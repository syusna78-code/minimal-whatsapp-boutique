/**
 * Minimal Glass-Prism WhatsApp Boutique - Application Controller
 * PRD v2.0 Source of Truth
 * 
 * Rules:
 * - HTML5 & Vanilla JavaScript
 * - Event listeners instead of inline handlers
 * - textContent for dynamic text (safe from HTML injection)
 * - Accessible modals, stock labels, keyboard focus
 * - Dynamic catalogue rendering from ProductService
 */

(function () {
  'use strict';

  // State
  let cart;
  let activeCategory = 'all';
  let currentDetailProduct = null;
  let selectedSize = null;
  let selectedColor = null;
  let currentDetailQty = 1;

  // DOM Elements Cache
  const elements = {};

  // Initialize Application
  function init() {
    cacheElements();

    // Safe Config fallback
    const config = window.SHOP_CONFIG || {
      shopName: "Boutique Store",
      shopTagline: "Curated Apparel",
      shopHeadline: "Modern tailoring with an artful silhouette.",
      shopSubheadline: "Browse our collection and order directly via WhatsApp.",
      whatsappNumber: "",
      policies: {},
      hero: { image: "assets/images/hero-fashion.jpg" }
    };

    // Initialize Cart Service
    cart = new CartService(window.ProductService, config);

    // Apply Shop Config to Header, Hero, and Footer
    applyShopConfig(config);

    // Setup Category Filters & Catalogue
    setupCategories();
    renderCatalogue();

    // Setup Event Listeners
    setupGlobalEventListeners();

    // Subscribe to Cart Changes
    cart.subscribe(updateCartUI);
    // Initial Cart Render
    updateCartUI({
      items: cart.getItems(),
      itemCount: cart.getItemCount(),
      subtotalPaise: cart.getSubtotalPaise(),
      formattedSubtotal: cart.getFormattedSubtotal()
    });
  }

  function cacheElements() {
    elements.shopName = document.querySelectorAll('.shop-name-target');
    elements.shopTagline = document.querySelector('.shop-tagline-target');
    elements.heroHeadline = document.getElementById('hero-headline');
    elements.heroSubheadline = document.getElementById('hero-subheadline');
    elements.heroBadge = document.getElementById('hero-badge');
    elements.heroBgImage = document.getElementById('hero-bg-image');
    elements.categoryPills = document.getElementById('category-pills');
    elements.productGrid = document.getElementById('product-grid');

    // Cart Elements
    elements.cartTrigger = document.getElementById('cart-trigger');
    elements.cartBadge = document.getElementById('cart-badge');
    elements.cartDrawer = document.getElementById('cart-drawer');
    elements.cartBackdrop = document.getElementById('cart-backdrop');
    elements.cartClose = document.getElementById('cart-close-btn');
    elements.cartItemsContainer = document.getElementById('cart-items-container');
    elements.cartSubtotal = document.getElementById('cart-subtotal');
    elements.cartWhatsappOrderBtn = document.getElementById('btn-whatsapp-order');
    elements.clearCartBtn = document.getElementById('btn-clear-cart');

    // Customer info inputs
    elements.custName = document.getElementById('cust-name');
    elements.custPhone = document.getElementById('cust-phone');
    elements.custAddress = document.getElementById('cust-address');

    // Product Detail Modal Elements
    elements.productModal = document.getElementById('product-modal');
    elements.modalClose = document.getElementById('modal-close-btn');
    elements.modalImage = document.getElementById('modal-product-image');
    elements.modalMediaWrap = document.getElementById('modal-media-wrap');
    elements.modalCategory = document.getElementById('modal-product-category');
    elements.modalTitle = document.getElementById('modal-product-title');
    elements.modalPrice = document.getElementById('modal-product-price');
    elements.modalSku = document.getElementById('modal-product-sku');
    elements.modalDesc = document.getElementById('modal-product-desc');
    elements.sizeOptions = document.getElementById('size-options');
    elements.colorOptions = document.getElementById('color-options');
    elements.stockStatus = document.getElementById('modal-stock-status');
    elements.qtyInput = document.getElementById('detail-qty-input');
    elements.qtyMinus = document.getElementById('detail-qty-minus');
    elements.qtyPlus = document.getElementById('detail-qty-plus');
    elements.addToCartBtn = document.getElementById('btn-add-to-cart');
    elements.enquiryBtn = document.getElementById('btn-detail-enquiry');

    // Policy Elements
    elements.policySizing = document.getElementById('policy-sizing');
    elements.policyFabric = document.getElementById('policy-fabric');
    elements.policyDelivery = document.getElementById('policy-delivery');
    elements.policyReturns = document.getElementById('policy-returns');
    elements.policyConfirmation = document.getElementById('policy-confirmation');

    // Toast Container
    elements.toastContainer = document.getElementById('toast-container');
  }

  function applyShopConfig(config) {
    if (elements.shopName) {
      elements.shopName.forEach(el => {
        el.textContent = config.shopName || "Boutique Store";
      });
    }
    if (elements.shopTagline) {
      elements.shopTagline.textContent = config.shopTagline || "";
    }
    if (elements.heroHeadline && config.shopHeadline) {
      elements.heroHeadline.textContent = config.shopHeadline;
    }
    if (elements.heroSubheadline && config.shopSubheadline) {
      elements.heroSubheadline.textContent = config.shopSubheadline;
    }
    if (elements.heroBadge && config.hero && config.hero.badgeText) {
      elements.heroBadge.textContent = config.hero.badgeText;
    }

    // Hero background image with error fallback
    if (elements.heroBgImage && config.hero && config.hero.image) {
      elements.heroBgImage.src = config.hero.image;
      elements.heroBgImage.onerror = function () {
        // Hide broken image gracefully, relying on the elegant CSS gradient fallback
        elements.heroBgImage.style.display = 'none';
      };
    }

    // Policies
    if (config.policies) {
      if (elements.policySizing) elements.policySizing.textContent = config.policies.sizing || "";
      if (elements.policyFabric) elements.policyFabric.textContent = config.policies.fabricCare || "";
      if (elements.policyDelivery) elements.policyDelivery.textContent = config.policies.delivery || "";
      if (elements.policyReturns) elements.policyReturns.textContent = config.policies.returns || "";
      if (elements.policyConfirmation) elements.policyConfirmation.textContent = config.policies.confirmationNotice || "";
    }
  }

  // Categories Setup
  function setupCategories() {
    if (!elements.categoryPills || !window.ProductService) return;

    const activeProducts = window.ProductService.getAllActive();
    const categories = ['all'];
    activeProducts.forEach(p => {
      if (p.category && !categories.includes(p.category)) {
        categories.push(p.category);
      }
    });

    elements.categoryPills.innerHTML = '';
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `filter-pill ${cat === activeCategory ? 'active' : ''}`;
      btn.textContent = cat === 'all' ? 'All Garments' : cat;
      btn.setAttribute('data-category', cat);
      btn.setAttribute('aria-pressed', cat === activeCategory ? 'true' : 'false');

      btn.addEventListener('click', () => {
        activeCategory = cat;
        document.querySelectorAll('.filter-pill').forEach(p => {
          const isAct = p.getAttribute('data-category') === cat;
          p.classList.toggle('active', isAct);
          p.setAttribute('aria-pressed', isAct ? 'true' : 'false');
        });
        renderCatalogue();
      });

      elements.categoryPills.appendChild(btn);
    });
  }

  // Render Product Grid from Structured Data
  function renderCatalogue() {
    if (!elements.productGrid || !window.ProductService) return;

    elements.productGrid.innerHTML = '';
    let products = window.ProductService.getAllActive();

    if (activeCategory !== 'all') {
      products = products.filter(p => p.category === activeCategory);
    }

    if (products.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'catalogue-empty';
      emptyMsg.textContent = 'No garments found in this category.';
      elements.productGrid.appendChild(emptyMsg);
      return;
    }

    products.forEach(product => {
      const card = createProductCard(product);
      elements.productGrid.appendChild(card);
    });
  }

  // Create Product Card DOM
  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-product-id', product.id);

    // Media Wrapper
    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'product-card-media';

    const img = document.createElement('img');
    img.className = 'product-card-image';
    img.src = product.image;
    img.alt = product.name;
    img.loading = 'lazy';

    // Graceful palette-based image fallback
    img.onerror = function () {
      mediaWrap.innerHTML = '';
      const fallback = createFallbackPlaceholder(product.name, product.category);
      mediaWrap.appendChild(fallback);
    };

    mediaWrap.appendChild(img);

    // Stock Badge Calculation
    const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
    const badgeWrap = document.createElement('div');
    badgeWrap.className = 'card-badge-wrap';

    const badge = document.createElement('span');
    if (totalStock === 0) {
      badge.className = 'badge badge-outofstock';
      badge.textContent = 'Sold Out';
    } else if (totalStock <= 3) {
      badge.className = 'badge badge-lowstock';
      badge.textContent = `Low Stock (${totalStock})`;
    } else {
      badge.className = 'badge badge-instock';
      badge.textContent = 'In Stock';
    }
    badgeWrap.appendChild(badge);
    mediaWrap.appendChild(badgeWrap);

    // Card Body
    const body = document.createElement('div');
    body.className = 'product-card-body';

    const catEl = document.createElement('span');
    catEl.className = 'product-card-category';
    catEl.textContent = product.category || 'Collection';

    const titleEl = document.createElement('h3');
    titleEl.className = 'product-card-title';
    titleEl.textContent = product.name;

    const descEl = document.createElement('p');
    descEl.className = 'product-card-desc';
    descEl.textContent = product.description;

    const priceRow = document.createElement('div');
    priceRow.className = 'product-card-price-row';

    const priceEl = document.createElement('span');
    priceEl.className = 'product-card-price';
    priceEl.textContent = window.ProductService.formatPrice(product.price, window.SHOP_CONFIG);

    const skuEl = document.createElement('span');
    skuEl.className = 'product-card-sku';
    skuEl.textContent = product.sku || '';

    priceRow.appendChild(priceEl);
    if (product.sku) priceRow.appendChild(skuEl);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'product-card-actions';

    // Primary: Select Options / View Details
    const selectBtn = document.createElement('button');
    selectBtn.type = 'button';
    selectBtn.className = 'btn-card-select';
    selectBtn.textContent = 'Select Options & Size';
    selectBtn.addEventListener('click', () => openProductDetail(product.id));

    // FR-04: Card-Level WhatsApp Enquiry Button
    const enquiryBtn = document.createElement('button');
    enquiryBtn.type = 'button';
    enquiryBtn.className = 'btn-card-enquiry';
    enquiryBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
      <span>Ask about this product</span>
    `;
    enquiryBtn.setAttribute('aria-label', `Enquire about ${product.name} on WhatsApp`);
    enquiryBtn.addEventListener('click', () => handleCardEnquiry(product));

    actions.appendChild(selectBtn);
    actions.appendChild(enquiryBtn);

    body.appendChild(catEl);
    body.appendChild(titleEl);
    body.appendChild(descEl);
    body.appendChild(priceRow);
    body.appendChild(actions);

    card.appendChild(mediaWrap);
    card.appendChild(body);

    return card;
  }

  // Polished palette-based fallback when image is missing
  function createFallbackPlaceholder(title, category) {
    const box = document.createElement('div');
    box.className = 'image-fallback-placeholder';

    const icon = document.createElement('div');
    icon.className = 'image-fallback-icon';
    icon.textContent = '✦';

    const h = document.createElement('div');
    h.className = 'image-fallback-title';
    h.textContent = title;

    const s = document.createElement('div');
    s.className = 'image-fallback-sub';
    s.textContent = `${category || 'Atelier'} • Image Coming Soon`;

    box.appendChild(icon);
    box.appendChild(h);
    box.appendChild(s);
    return box;
  }

  // Handle Card-Level WhatsApp Enquiry (FR-04)
  function handleCardEnquiry(product) {
    const result = window.WhatsAppService.generateProductEnquiryUrl(
      window.SHOP_CONFIG,
      product,
      null // No variant selected at card level
    );

    if (result.success) {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } else {
      showToast(result.error, 'error');
    }
  }

  // Open Product Detail Modal
  function openProductDetail(productId) {
    const product = window.ProductService.getById(productId);
    if (!product) return;

    currentDetailProduct = product;
    currentDetailQty = 1;

    // Default to first available size & color
    const availableVariant = product.variants.find(v => v.stock > 0) || product.variants[0];
    selectedSize = availableVariant ? availableVariant.size : null;
    selectedColor = availableVariant ? availableVariant.color : null;

    // Populate Modal Content
    if (elements.modalMediaWrap) {
      elements.modalMediaWrap.innerHTML = '';
      const img = document.createElement('img');
      img.className = 'product-detail-image';
      img.src = product.image;
      img.alt = product.name;
      img.onerror = function () {
        elements.modalMediaWrap.innerHTML = '';
        elements.modalMediaWrap.appendChild(createFallbackPlaceholder(product.name, product.category));
      };
      elements.modalMediaWrap.appendChild(img);
    }

    if (elements.modalCategory) elements.modalCategory.textContent = product.category || 'Garment';
    if (elements.modalTitle) elements.modalTitle.textContent = product.name;
    if (elements.modalPrice) elements.modalPrice.textContent = window.ProductService.formatPrice(product.price, window.SHOP_CONFIG);
    if (elements.modalSku) elements.modalSku.textContent = product.sku ? `SKU: ${product.sku}` : '';
    if (elements.modalDesc) elements.modalDesc.textContent = product.description;

    renderVariantSelectors();
    updateDetailStockAndControls();

    // Show Modal
    elements.productModal.classList.add('open');
    elements.productModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeProductDetail() {
    elements.productModal.classList.remove('open');
    elements.productModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentDetailProduct = null;
  }

  // Render Size and Colour Pills
  function renderVariantSelectors() {
    if (!currentDetailProduct) return;

    // Distinct sizes
    const sizes = [...new Set(currentDetailProduct.variants.map(v => v.size))];
    elements.sizeOptions.innerHTML = '';

    sizes.forEach(size => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `variant-btn ${size === selectedSize ? 'selected' : ''}`;
      btn.textContent = size;

      // Check if size has any stock across colors
      const hasStock = currentDetailProduct.variants.some(v => v.size === size && v.stock > 0);
      if (!hasStock) {
        btn.disabled = true;
        btn.title = 'Size out of stock';
      }

      btn.addEventListener('click', () => {
        selectedSize = size;
        // Verify if current color exists for this size; if not, pick first valid
        const variantExists = currentDetailProduct.variants.find(v => v.size === size && v.color === selectedColor);
        if (!variantExists || variantExists.stock <= 0) {
          const firstInStock = currentDetailProduct.variants.find(v => v.size === size && v.stock > 0);
          if (firstInStock) {
            selectedColor = firstInStock.color;
          }
        }
        renderVariantSelectors();
        updateDetailStockAndControls();
      });

      elements.sizeOptions.appendChild(btn);
    });

    // Distinct colours
    const colors = [...new Set(currentDetailProduct.variants.map(v => v.color))];
    elements.colorOptions.innerHTML = '';

    colors.forEach(color => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `variant-btn ${color === selectedColor ? 'selected' : ''}`;
      btn.textContent = color;

      // Check stock for this specific size + color combination
      const combination = currentDetailProduct.variants.find(v => v.size === selectedSize && v.color === color);
      const isCombAvailable = combination && combination.stock > 0;

      if (!isCombAvailable) {
        btn.disabled = true;
        btn.title = `${color} out of stock in size ${selectedSize}`;
      }

      btn.addEventListener('click', () => {
        selectedColor = color;
        renderVariantSelectors();
        updateDetailStockAndControls();
      });

      elements.colorOptions.appendChild(btn);
    });
  }

  // Update Stock Indicator & Add to Cart availability
  function updateDetailStockAndControls() {
    if (!currentDetailProduct || !selectedSize || !selectedColor) {
      elements.stockStatus.className = 'modal-stock-status status-warn';
      elements.stockStatus.textContent = 'Please select a size and colour.';
      elements.addToCartBtn.disabled = true;
      return;
    }

    const variant = window.ProductService.getVariant(currentDetailProduct.id, selectedSize, selectedColor);
    const stock = variant ? variant.stock : 0;

    // Check how many are already in the cart for this variant
    const cartLines = cart.getItems();
    const existingLine = cartLines.find(item =>
      item.productId === currentDetailProduct.id &&
      item.size === selectedSize &&
      item.color === selectedColor
    );
    const inCartQty = existingLine ? existingLine.quantity : 0;
    const remainingStock = Math.max(0, stock - inCartQty);

    if (stock <= 0) {
      elements.stockStatus.className = 'modal-stock-status status-empty';
      elements.stockStatus.textContent = `Out of stock for ${selectedSize} in ${selectedColor}.`;
      elements.addToCartBtn.disabled = true;
      currentDetailQty = 1;
    } else if (remainingStock === 0) {
      elements.stockStatus.className = 'modal-stock-status status-warn';
      elements.stockStatus.textContent = `All ${stock} available units are already in your bag.`;
      elements.addToCartBtn.disabled = true;
    } else if (stock <= 3) {
      elements.stockStatus.className = 'modal-stock-status status-warn';
      elements.stockStatus.textContent = `Low stock: Only ${stock} remaining (${remainingStock} more can be added).`;
      elements.addToCartBtn.disabled = false;
    } else {
      elements.stockStatus.className = 'modal-stock-status status-ok';
      elements.stockStatus.textContent = `In stock (${stock} available).`;
      elements.addToCartBtn.disabled = false;
    }

    // Clamp current detail quantity
    if (currentDetailQty > remainingStock && remainingStock > 0) {
      currentDetailQty = remainingStock;
    } else if (currentDetailQty < 1) {
      currentDetailQty = 1;
    }

    if (elements.qtyInput) elements.qtyInput.value = currentDetailQty;
    if (elements.qtyMinus) elements.qtyMinus.disabled = currentDetailQty <= 1;
    if (elements.qtyPlus) elements.qtyPlus.disabled = currentDetailQty >= remainingStock;
  }

  // Detail Modal Actions
  function setupDetailModalEvents() {
    if (elements.modalClose) {
      elements.modalClose.addEventListener('click', closeProductDetail);
    }

    if (elements.productModal) {
      elements.productModal.addEventListener('click', (e) => {
        if (e.target === elements.productModal) {
          closeProductDetail();
        }
      });
    }

    // Quantity controls
    if (elements.qtyMinus) {
      elements.qtyMinus.addEventListener('click', () => {
        if (currentDetailQty > 1) {
          currentDetailQty--;
          updateDetailStockAndControls();
        }
      });
    }

    if (elements.qtyPlus) {
      elements.qtyPlus.addEventListener('click', () => {
        const variant = window.ProductService.getVariant(currentDetailProduct.id, selectedSize, selectedColor);
        const max = variant ? variant.stock : 1;
        if (currentDetailQty < max) {
          currentDetailQty++;
          updateDetailStockAndControls();
        }
      });
    }

    if (elements.qtyInput) {
      elements.qtyInput.addEventListener('change', () => {
        const val = parseInt(elements.qtyInput.value, 10);
        const variant = window.ProductService.getVariant(currentDetailProduct.id, selectedSize, selectedColor);
        const max = variant ? variant.stock : 1;

        if (isNaN(val) || val < 1) {
          currentDetailQty = 1;
        } else if (val > max) {
          currentDetailQty = max;
          showToast(`Only ${max} available in stock.`, 'info');
        } else {
          currentDetailQty = val;
        }
        updateDetailStockAndControls();
      });
    }

    // Add To Cart
    if (elements.addToCartBtn) {
      elements.addToCartBtn.addEventListener('click', () => {
        if (!currentDetailProduct || !selectedSize || !selectedColor) {
          showToast('Please select both a size and a colour.', 'error');
          return;
        }

        const res = cart.addItem(
          currentDetailProduct.id,
          selectedSize,
          selectedColor,
          currentDetailQty
        );

        if (res.success) {
          showToast(`Added ${currentDetailProduct.name} (${selectedSize} / ${selectedColor}) to your bag.`, 'success');
          updateDetailStockAndControls();
        } else {
          showToast(res.error, 'error');
        }
      });
    }

    // FR-04: WhatsApp Product Enquiry from Modal
    if (elements.enquiryBtn) {
      elements.enquiryBtn.addEventListener('click', () => {
        if (!currentDetailProduct) return;

        const variant = (selectedSize || selectedColor)
          ? { size: selectedSize, color: selectedColor }
          : null;

        const res = window.WhatsAppService.generateProductEnquiryUrl(
          window.SHOP_CONFIG,
          currentDetailProduct,
          variant
        );

        if (res.success) {
          window.open(res.url, '_blank', 'noopener,noreferrer');
        } else {
          showToast(res.error, 'error');
        }
      });
    }
  }

  // Cart Drawer UI & Events
  function openCartDrawer() {
    elements.cartDrawer.classList.add('open');
    elements.cartBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeCartDrawer() {
    elements.cartDrawer.classList.remove('open');
    elements.cartBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setupCartEvents() {
    if (elements.cartTrigger) {
      elements.cartTrigger.addEventListener('click', openCartDrawer);
    }
    if (elements.cartClose) {
      elements.cartClose.addEventListener('click', closeCartDrawer);
    }
    if (elements.cartBackdrop) {
      elements.cartBackdrop.addEventListener('click', closeCartDrawer);
    }

    if (elements.clearCartBtn) {
      elements.clearCartBtn.addEventListener('click', () => {
        if (confirm('Clear all items from your shopping bag?')) {
          cart.clearCart();
          showToast('Shopping bag cleared.', 'info');
        }
      });
    }

    // FR-05 & FR-06: WhatsApp Cart Order
    if (elements.cartWhatsappOrderBtn) {
      elements.cartWhatsappOrderBtn.addEventListener('click', () => {
        const items = cart.getItems();
        if (items.length === 0) {
          showToast('Your bag is empty. Please add items before placing an order.', 'error');
          return;
        }

        // Optional customer inputs (never saved to localStorage)
        const customerDetails = {
          name: elements.custName ? elements.custName.value : '',
          phone: elements.custPhone ? elements.custPhone.value : '',
          address: elements.custAddress ? elements.custAddress.value : ''
        };

        const result = window.WhatsAppService.generateCartOrderUrl(
          window.SHOP_CONFIG,
          items,
          cart.getFormattedSubtotal(),
          customerDetails
        );

        if (result.success) {
          window.open(result.url, '_blank', 'noopener,noreferrer');
        } else {
          showToast(result.error, 'error');
        }
      });
    }
  }

  // Update Cart Drawer UI
  function updateCartUI(cartState) {
    if (!elements.cartBadge || !elements.cartItemsContainer || !elements.cartSubtotal) return;

    elements.cartBadge.textContent = cartState.itemCount;
    elements.cartSubtotal.textContent = cartState.formattedSubtotal;

    // Render Items
    elements.cartItemsContainer.innerHTML = '';

    if (cartState.items.length === 0) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'cart-empty-view';
      emptyDiv.innerHTML = `
        <div class="cart-empty-icon" aria-hidden="true">✦</div>
        <h4 class="cart-empty-title">Your shopping bag is empty</h4>
        <p class="cart-empty-sub">Explore our curated collection and add garments to enquire or order.</p>
      `;
      const browseBtn = document.createElement('button');
      browseBtn.type = 'button';
      browseBtn.className = 'btn-primary';
      browseBtn.textContent = 'Explore Collection';
      browseBtn.addEventListener('click', () => {
        closeCartDrawer();
        const cat = document.getElementById('catalogue');
        if (cat) cat.scrollIntoView({ behavior: 'smooth' });
      });
      emptyDiv.appendChild(browseBtn);
      elements.cartItemsContainer.appendChild(emptyDiv);

      if (elements.cartWhatsappOrderBtn) elements.cartWhatsappOrderBtn.disabled = true;
      if (elements.clearCartBtn) elements.clearCartBtn.style.display = 'none';
      return;
    }

    if (elements.cartWhatsappOrderBtn) elements.cartWhatsappOrderBtn.disabled = false;
    if (elements.clearCartBtn) elements.clearCartBtn.style.display = 'inline-block';

    cartState.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item-row';
      row.setAttribute('data-line-id', item.lineId);

      // Thumbnail
      const img = document.createElement('img');
      img.className = 'cart-item-thumb';
      img.src = item.image;
      img.alt = item.name;
      img.onerror = function () {
        img.style.display = 'none';
      };

      // Info
      const info = document.createElement('div');
      info.className = 'cart-item-info';

      const name = document.createElement('h5');
      name.className = 'cart-item-name';
      name.textContent = item.name;

      const variant = document.createElement('div');
      variant.className = 'cart-item-variant';
      variant.textContent = `Size: ${item.size} • Colour: ${item.color}`;

      const unitPrice = document.createElement('div');
      unitPrice.className = 'cart-item-price-unit';
      unitPrice.textContent = item.formattedUnitPrice;

      // Stepper
      const stepper = document.createElement('div');
      stepper.className = 'cart-item-stepper';

      const minusBtn = document.createElement('button');
      minusBtn.type = 'button';
      minusBtn.className = 'cart-qty-btn';
      minusBtn.textContent = '−';
      minusBtn.setAttribute('aria-label', `Decrease quantity for ${item.name}`);
      minusBtn.addEventListener('click', () => {
        cart.updateQuantity(item.lineId, item.quantity - 1);
      });

      const qtyVal = document.createElement('span');
      qtyVal.className = 'cart-qty-val';
      qtyVal.textContent = item.quantity;

      const plusBtn = document.createElement('button');
      plusBtn.type = 'button';
      plusBtn.className = 'cart-qty-btn';
      plusBtn.textContent = '+';
      plusBtn.setAttribute('aria-label', `Increase quantity for ${item.name}`);
      plusBtn.disabled = item.quantity >= item.maxStock;
      plusBtn.addEventListener('click', () => {
        const res = cart.updateQuantity(item.lineId, item.quantity + 1);
        if (!res.success && res.error) {
          showToast(res.error, 'info');
        }
      });

      stepper.appendChild(minusBtn);
      stepper.appendChild(qtyVal);
      stepper.appendChild(plusBtn);

      info.appendChild(name);
      info.appendChild(variant);
      info.appendChild(unitPrice);
      info.appendChild(stepper);

      // Actions / Line Total
      const actions = document.createElement('div');
      actions.className = 'cart-item-actions';

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'cart-item-remove-btn';
      removeBtn.innerHTML = '&times;';
      removeBtn.setAttribute('aria-label', `Remove ${item.name} (${item.size}/${item.color}) from bag`);
      removeBtn.addEventListener('click', () => {
        cart.removeItem(item.lineId);
        showToast(`Removed ${item.name} from bag.`, 'info');
      });

      const lineTotal = document.createElement('span');
      lineTotal.className = 'cart-item-linetotal';
      lineTotal.textContent = item.formattedLineTotal;

      actions.appendChild(removeBtn);
      actions.appendChild(lineTotal);

      row.appendChild(img);
      row.appendChild(info);
      row.appendChild(actions);

      elements.cartItemsContainer.appendChild(row);
    });

    // If modal is open, refresh stock indicator
    if (currentDetailProduct) {
      updateDetailStockAndControls();
    }
  }

  // Toast System
  function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3800);
  }

  // Global Listeners (Escape key, smooth scroll links)
  function setupGlobalEventListeners() {
    setupDetailModalEvents();
    setupCartEvents();

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (elements.productModal && elements.productModal.classList.contains('open')) {
          closeProductDetail();
        } else if (elements.cartDrawer && elements.cartDrawer.classList.contains('open')) {
          closeCartDrawer();
        }
      }
    });
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose showToast globally for unit testing or external hooks
  window.BoutiqueApp = {
    init,
    showToast,
    openProductDetail,
    closeProductDetail,
    openCartDrawer,
    closeCartDrawer
  };

})();
