/**
 * Minimal Glass-Prism WhatsApp Boutique - WhatsApp Integration Module
 * PRD v2.0 Source of Truth (FR-04 & FR-05)
 * 
 * Rules:
 * - Product-specific WhatsApp enquiry action does NOT add to cart or create orders
 * - WhatsApp Cart Order compiles structured cart lines, variants, quantities, and subtotal
 * - Uses international digits-only wa.me link with encodeURIComponent
 * - Strictly validates number; graceful clear error if invalid/missing
 * - Opening WhatsApp is not an automatic send or confirmation
 */

const WhatsAppService = {
  /**
   * Clean and validate international phone number
   * Strips all non-digit characters. E.164 recommends 8 to 15 digits.
   */
  sanitizeNumber(rawNumber) {
    if (!rawNumber || typeof rawNumber !== 'string') return '';
    // Strip non-digit characters
    return rawNumber.replace(/\D/g, '');
  },

  validateNumber(rawNumber) {
    const digitsOnly = this.sanitizeNumber(rawNumber);
    if (!digitsOnly) {
      return {
        isValid: false,
        error: 'WhatsApp contact number is not configured in shop settings.'
      };
    }
    // International numbers typically 8 to 15 digits
    if (digitsOnly.length < 8 || digitsOnly.length > 15) {
      return {
        isValid: false,
        error: `Configured WhatsApp number "${rawNumber}" is invalid (must be 8–15 digits without symbols).`
      };
    }
    return {
      isValid: true,
      number: digitsOnly
    };
  },

  /**
   * FR-04: Product-Specific Enquiry
   * For pre-purchase questions; does not require cart or variant selection
   */
  generateProductEnquiryUrl(config, product, selectedVariant = null) {
    if (!product) {
      return { success: false, error: 'Product information is missing.' };
    }

    const validation = this.validateNumber(config ? config.whatsappNumber : '');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const formattedPrice = (typeof ProductService !== 'undefined')
      ? ProductService.formatPrice(product.price, config)
      : `₹${product.price / 100}`;

    const skuInfo = product.sku ? ` (${product.sku})` : '';

    let variantText = '';
    if (selectedVariant && (selectedVariant.size || selectedVariant.color)) {
      const parts = [];
      if (selectedVariant.size) parts.push(`Size: ${selectedVariant.size}`);
      if (selectedVariant.color) parts.push(`Colour: ${selectedVariant.color}`);
      variantText = ` Selected option: ${parts.join(', ')}.`;
    }

    // Suggested PRD message template
    const message = `Hi! I'm interested in ${product.name}${skuInfo}. Price shown: ${formattedPrice}.${variantText} Could you share more details about availability, fabric/measurements and delivery?`;

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${validation.number}?text=${encoded}`;

    return {
      success: true,
      url,
      message,
      targetNumber: validation.number
    };
  },

  /**
   * FR-05: WhatsApp Cart Order
   * Compiles cart lines, variants, quantities, unit prices, line totals, subtotal,
   * optional customer details, and seller confirmation notice.
   */
  generateCartOrderUrl(config, cartItems, subtotalFormatted, customerDetails = {}) {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return { success: false, error: 'Your cart is empty. Add items before placing an order.' };
    }

    const validation = this.validateNumber(config ? config.whatsappNumber : '');
    if (!validation.isValid) {
      return { success: false, error: validation.error };
    }

    const shopName = (config && config.shopName) ? config.shopName : 'Boutique Store';

    // Structured message layout
    let msg = `🛍️ *Order Request — ${shopName}*\n\n`;
    msg += `Hello! I would like to order the following items:\n\n`;

    cartItems.forEach((item, index) => {
      const skuLabel = item.sku ? ` (${item.sku})` : '';
      msg += `*${index + 1}. ${item.name}*${skuLabel}\n`;
      msg += `   • Variant: ${item.size} / ${item.color}\n`;
      msg += `   • Quantity: ${item.quantity} × ${item.formattedUnitPrice}\n`;
      msg += `   • Line Total: ${item.formattedLineTotal}\n\n`;
    });

    msg += `--------------------------------\n`;
    msg += `*Subtotal:* ${subtotalFormatted}\n`;
    msg += `--------------------------------\n\n`;

    // Customer details (only included if entered)
    const hasName = customerDetails.name && customerDetails.name.trim();
    const hasPhone = customerDetails.phone && customerDetails.phone.trim();
    const hasAddress = customerDetails.address && customerDetails.address.trim();

    if (hasName || hasPhone || hasAddress) {
      msg += `*Customer Details:*\n`;
      if (hasName) msg += `• Name: ${customerDetails.name.trim()}\n`;
      if (hasPhone) msg += `• Phone: ${customerDetails.phone.trim()}\n`;
      if (hasAddress) msg += `• Delivery Address / Notes: ${customerDetails.address.trim()}\n`;
      msg += `\n`;
    }

    // Required disclosures per PRD
    msg += `_Note: Delivery fee, payment details, and final item availability will be confirmed by the seller. Please send this message to start our consultation._`;

    const encoded = encodeURIComponent(msg);
    const url = `https://wa.me/${validation.number}?text=${encoded}`;

    return {
      success: true,
      url,
      message: msg,
      targetNumber: validation.number
    };
  }
};

// Universal export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WhatsAppService;
} else if (typeof window !== 'undefined') {
  window.WhatsAppService = WhatsAppService;
}
