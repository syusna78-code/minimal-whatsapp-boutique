/**
 * Minimal Glass-Prism WhatsApp Boutique - Configuration
 * PRD v2.0 Source of Truth
 * 
 * Shop owners: Replace placeholder values below with your verified boutique details.
 */
const SHOP_CONFIG = {
  // Shop Identity Placeholders
  shopName: "Aura Studio & Boutique",
  shopTagline: "Art-Directed Minimal Wardrobe",
  shopHeadline: "Modern tailoring rendered with an artful, glass-prism silhouette.",
  shopSubheadline: "Curated seasonal apparel cut from raw silk, structured linen, and fine merino. Inspect details below and enquire or order directly via WhatsApp.",

  // Contact & WhatsApp
  // International format digits-only without '+' or spaces (e.g. "919876543210")
  whatsappNumber: "919876543210", // Placeholder: Replace with verified boutique WhatsApp number

  // Currency & Formatting
  currency: {
    symbol: "₹",
    code: "INR",
    locale: "en-IN"
  },

  // Verified Store Information & Policy Placeholders
  policies: {
    sizing: "Our cuts follow standard contemporary sizing (S, M, L). For specific chest, waist, and length measurements before purchasing, use 'Ask about this product' on any garment.",
    fabricCare: "Constructed with breathable natural textiles: Mulberry raw silk, organic Belgian linen, and high-twist wool. Dry clean or gentle cold wash recommended.",
    delivery: "Pan-India delivery typically takes 3–5 business days. Delivery rates and courier options are confirmed directly by the boutique seller in WhatsApp chat.",
    returns: "Exchanges accepted within 7 days of receipt for unused garments with tags attached. WhatsApp our team with your order reference to arrange.",
    confirmationNotice: "Note: Opening WhatsApp creates a draft message. Your order is confirmed only after the boutique owner reviews item availability and replies to you."
  },

  // Hero & Visual Presentation
  hero: {
    image: "assets/images/hero-fashion.jpg",
    badgeText: "Collection Nº 04 / Autumn 2026"
  },

  // Validation Limits
  limits: {
    maxQuantityPerLine: 10
  }
};

// Universal export for browser & Node.js unit tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SHOP_CONFIG;
} else if (typeof window !== 'undefined') {
  window.SHOP_CONFIG = SHOP_CONFIG;
}
