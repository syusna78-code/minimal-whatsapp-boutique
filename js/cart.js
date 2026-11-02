/**
 * Minimal Glass-Prism WhatsApp Boutique - Cart & Stock Management
 * PRD v2.0 Source of Truth
 * 
 * Rules:
 * - Line identity: productId + '__' + size + '__' + color
 * - Merging same variant checks combined quantity against current configured stock
 * - Different variants are distinct separate lines
 * - Integer paise calculation, zero invented delivery fees
 * - LocalStorage is treated as untrusted; totals recomputed from ProductService
 * - No personal customer data persisted in localStorage
 */

class CartService {
  constructor(productService, config) {
    this.productService = productService || (typeof ProductService !== 'undefined' ? ProductService : null);
    this.config = config || (typeof SHOP_CONFIG !== 'undefined' ? SHOP_CONFIG : null);
    this.storageKey = 'boutique_cart_v2';
    this.items = []; // Array of cart line objects
    this.subscribers = [];
    this.loadCart();
  }

  // Generate unique stable line identifier
  generateLineId(productId, size, color) {
    return `${productId}__${encodeURIComponent(size)}__${encodeURIComponent(color)}`;
  }

  // Subscribe to cart change events
  subscribe(callback) {
    if (typeof callback === 'function') {
      this.subscribers.push(callback);
    }
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notify() {
    const state = {
      items: this.getItems(),
      itemCount: this.getItemCount(),
      subtotalPaise: this.getSubtotalPaise(),
      formattedSubtotal: this.getFormattedSubtotal()
    };
    this.subscribers.forEach(cb => {
      try {
        cb(state);
      } catch (err) {
        console.error('Cart subscriber error:', err);
      }
    });
  }

  // Load from localStorage and strictly revalidate against current product data
  loadCart() {
    this.items = [];
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      parsed.forEach(rawItem => {
        if (!rawItem || !rawItem.productId || !rawItem.size || !rawItem.color) return;

        const product = this.productService ? this.productService.getById(rawItem.productId) : null;
        if (!product || !product.active) return; // Inactive or deleted product

        const variant = this.productService.getVariant(rawItem.productId, rawItem.size, rawItem.color);
        if (!variant || variant.stock <= 0) return; // Unavailable variant

        const rawQty = parseInt(rawItem.quantity, 10);
        if (isNaN(rawQty) || rawQty <= 0) return;

        // Clamp quantity to current stock
        const validQty = Math.min(rawQty, variant.stock);
        const lineId = this.generateLineId(product.id, variant.size, variant.color);

        this.items.push({
          lineId,
          productId: product.id,
          sku: product.sku || product.id,
          name: product.name,
          category: product.category,
          size: variant.size,
          color: variant.color,
          unitPrice: product.price, // in integer paise directly from product data
          quantity: validQty,
          maxStock: variant.stock,
          image: product.image
        });
      });
    } catch (e) {
      console.warn('Failed to parse cart from storage; resetting cart.', e);
      this.items = [];
    }
  }

  // Save cart (persists only minimal variant references, never personal data)
  saveCart() {
    if (typeof window === 'undefined' || !window.localStorage) return;

    try {
      const serialized = this.items.map(item => ({
        productId: item.productId,
        size: item.size,
        color: item.color,
        quantity: item.quantity
      }));
      window.localStorage.setItem(this.storageKey, JSON.stringify(serialized));
    } catch (e) {
      console.warn('Unable to persist cart to storage:', e);
    }
  }

  // Add item with variant validation and stock boundary check
  addItem(productId, size, color, quantityToAdd = 1) {
    if (!productId) {
      return { success: false, error: 'Product ID is required.' };
    }
    if (!size || !color) {
      return { success: false, error: 'Please select both a size and a colour before adding to cart.' };
    }

    const qty = parseInt(quantityToAdd, 10);
    if (isNaN(qty) || qty <= 0 || !Number.isInteger(Number(quantityToAdd))) {
      return { success: false, error: 'Quantity must be a valid positive whole number.' };
    }

    const product = this.productService ? this.productService.getById(productId) : null;
    if (!product || !product.active) {
      return { success: false, error: 'This item is currently unavailable.' };
    }

    const variant = this.productService.getVariant(productId, size, color);
    if (!variant) {
      return { success: false, error: `The combination ${size} / ${color} is not offered.` };
    }

    if (variant.stock <= 0) {
      return { success: false, error: `Selected combination (${size} / ${color}) is out of stock.` };
    }

    const lineId = this.generateLineId(productId, size, color);
    const existingIndex = this.items.findIndex(item => item.lineId === lineId);

    if (existingIndex > -1) {
      // Merge rule: check combined quantity against variant stock
      const currentQty = this.items[existingIndex].quantity;
      const combinedQty = currentQty + qty;

      if (combinedQty > variant.stock) {
        const remainingAddable = variant.stock - currentQty;
        if (remainingAddable <= 0) {
          return {
            success: false,
            error: `You already have all ${variant.stock} available in your cart.`
          };
        }
        return {
          success: false,
          error: `Only ${remainingAddable} more available in stock (maximum ${variant.stock}).`
        };
      }

      this.items[existingIndex].quantity = combinedQty;
      this.items[existingIndex].maxStock = variant.stock;
      this.items[existingIndex].unitPrice = product.price; // fresh price from data
    } else {
      // New line item
      if (qty > variant.stock) {
        return {
          success: false,
          error: `Cannot add ${qty}. Only ${variant.stock} currently in stock for ${size} / ${color}.`
        };
      }

      this.items.push({
        lineId,
        productId: product.id,
        sku: product.sku || product.id,
        name: product.name,
        category: product.category,
        size: variant.size,
        color: variant.color,
        unitPrice: product.price,
        quantity: qty,
        maxStock: variant.stock,
        image: product.image
      });
    }

    this.saveCart();
    this.notify();
    return { success: true, message: `Added to cart.` };
  }

  // Update quantity on existing line item with stock limits
  updateQuantity(lineId, newQuantity) {
    const index = this.items.findIndex(item => item.lineId === lineId);
    if (index === -1) {
      return { success: false, error: 'Item not found in cart.' };
    }

    const qty = parseInt(newQuantity, 10);
    if (isNaN(qty) || !Number.isInteger(Number(newQuantity))) {
      return { success: false, error: 'Quantity must be a valid whole number.' };
    }

    if (qty <= 0) {
      return this.removeItem(lineId);
    }

    const item = this.items[index];
    const currentStock = this.productService.getStock(item.productId, item.size, item.color);

    if (currentStock <= 0) {
      this.removeItem(lineId);
      return { success: false, error: `${item.name} (${item.size} / ${item.color}) is no longer in stock and was removed.` };
    }

    if (qty > currentStock) {
      this.items[index].quantity = currentStock;
      this.items[index].maxStock = currentStock;
      this.saveCart();
      this.notify();
      return {
        success: false,
        error: `Only ${currentStock} available in stock. Quantity updated to ${currentStock}.`
      };
    }

    this.items[index].quantity = qty;
    this.items[index].maxStock = currentStock;
    this.saveCart();
    this.notify();
    return { success: true };
  }

  // Remove a line item
  removeItem(lineId) {
    const initialLen = this.items.length;
    this.items = this.items.filter(item => item.lineId !== lineId);
    if (this.items.length !== initialLen) {
      this.saveCart();
      this.notify();
      return { success: true, message: 'Item removed from cart.' };
    }
    return { success: false, error: 'Item not found.' };
  }

  // Clear entire cart
  clearCart() {
    this.items = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(this.storageKey);
      } catch (e) {
        console.warn('Unable to clear cart storage:', e);
      }
    }
    this.notify();
    return { success: true };
  }

  // Get current lines with computed totals
  getItems() {
    return this.items.map(item => ({
      ...item,
      lineTotalPaise: item.unitPrice * item.quantity,
      formattedUnitPrice: this.productService ? this.productService.formatPrice(item.unitPrice, this.config) : `₹${item.unitPrice / 100}`,
      formattedLineTotal: this.productService ? this.productService.formatPrice(item.unitPrice * item.quantity, this.config) : `₹${(item.unitPrice * item.quantity) / 100}`
    }));
  }

  // Get total count of garments
  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  // Get subtotal in integer paise
  getSubtotalPaise() {
    return this.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  }

  // Formatted subtotal with currency symbol
  getFormattedSubtotal() {
    const paise = this.getSubtotalPaise();
    return this.productService ? this.productService.formatPrice(paise, this.config) : `₹${paise / 100}`;
  }
}

// Universal export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CartService;
} else if (typeof window !== 'undefined') {
  window.CartService = CartService;
}
