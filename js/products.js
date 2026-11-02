/**
 * Minimal Glass-Prism WhatsApp Boutique - Structured Product Data
 * PRD v2.0 Source of Truth
 * 
 * Rules:
 * - Stable unique id for every product
 * - Price stored in integer paise (e.g. 349900 = ₹3,499)
 * - Stock tracked per actual size-colour combination
 * - Inactive products have active: false and must be hidden from the storefront
 */
const PRODUCTS = [
  {
    id: "prod-001",
    sku: "AUR-BLZ-01",
    name: "Raw Silk Sculpted Blazer",
    category: "Outerwear",
    description: "Structured single-breasted blazer tailored from textured raw Mulberry silk. Features sharp peak lapels, internal French seams, and horn buttons. Designed for effortless architectural draping.",
    price: 499900, // ₹4,999.00
    image: "assets/images/products/silk-blazer.jpg",
    active: true,
    variants: [
      { size: "S", color: "Cosmic Latte", stock: 4 },
      { size: "M", color: "Cosmic Latte", stock: 6 },
      { size: "L", color: "Cosmic Latte", stock: 0 }, // Out of stock combination
      { size: "S", color: "Deep Burgundy", stock: 2 }, // Low stock
      { size: "M", color: "Deep Burgundy", stock: 3 },
      { size: "L", color: "Deep Burgundy", stock: 1 }
    ]
  },
  {
    id: "prod-002",
    sku: "AUR-DRS-02",
    name: "Pleated Chiffon Column Dress",
    category: "Dresses",
    description: "Ankle-length column dress with micro-accordion pleating. Delicate high neckline and graceful flowing drape that catches natural light with prism-like subtlety.",
    price: 389900, // ₹3,899.00
    image: "assets/images/products/chiffon-dress.jpg",
    active: true,
    variants: [
      { size: "S", color: "Mocha Cream", stock: 5 },
      { size: "M", color: "Mocha Cream", stock: 2 },
      { size: "L", color: "Mocha Cream", stock: 3 },
      { size: "S", color: "Deep Burgundy", stock: 4 },
      { size: "M", color: "Deep Burgundy", stock: 0 }, // Out of stock
      { size: "L", color: "Deep Burgundy", stock: 2 }
    ]
  },
  {
    id: "prod-003",
    sku: "AUR-TRN-03",
    name: "Structured Belgian Linen Trench",
    category: "Outerwear",
    description: "Unlined, breathable duster trench crafted from heavyweight Belgian linen. Features wide raglan sleeves, storm flap detail, and an adjustable tie belt.",
    price: 549900, // ₹5,499.00
    image: "assets/images/products/linen-trench.jpg",
    active: true,
    variants: [
      { size: "S", color: "Cosmic Latte", stock: 3 },
      { size: "M", color: "Cosmic Latte", stock: 4 },
      { size: "L", color: "Cosmic Latte", stock: 2 },
      { size: "S", color: "Espresso Shadow", stock: 2 },
      { size: "M", color: "Espresso Shadow", stock: 0 },
      { size: "L", color: "Espresso Shadow", stock: 3 }
    ]
  },
  {
    id: "prod-004",
    sku: "AUR-TRS-04",
    name: "High-Waist Tailored Trousers",
    category: "Separates",
    description: "Double-pleated wool-blend trousers with a relaxed wide leg and deep slash pockets. Clean waistband with concealed zip and horn button closure.",
    price: 299900, // ₹2,999.00
    image: "assets/images/products/pleated-trouser.jpg",
    active: true,
    variants: [
      { size: "S", color: "Mocha Cream", stock: 6 },
      { size: "M", color: "Mocha Cream", stock: 5 },
      { size: "L", color: "Mocha Cream", stock: 2 },
      { size: "S", color: "Deep Burgundy", stock: 3 },
      { size: "M", color: "Deep Burgundy", stock: 4 },
      { size: "L", color: "Deep Burgundy", stock: 0 }
    ]
  },
  {
    id: "prod-005",
    sku: "AUR-KNT-05",
    name: "Fine Gauge Merino Knit Top",
    category: "Knitwear",
    description: "Featherlight mock-neck top spun from extra-fine 19.5 micron merino wool. Ribbed cuffs and hem provide a subtle fitted silhouette ideal for layering.",
    price: 249900, // ₹2,499.00
    image: "assets/images/products/cashmere-knit.jpg",
    active: true,
    variants: [
      { size: "S", color: "Cosmic Latte", stock: 4 },
      { size: "M", color: "Cosmic Latte", stock: 5 },
      { size: "L", color: "Cosmic Latte", stock: 3 },
      { size: "S", color: "Mocha Cream", stock: 2 },
      { size: "M", color: "Mocha Cream", stock: 1 },
      { size: "L", color: "Mocha Cream", stock: 4 }
    ]
  },
  {
    id: "prod-006",
    sku: "AUR-SCF-06",
    name: "Hand-Rolled Silk Twill Scarf",
    category: "Accessories",
    description: "Square 90cm silk twill scarf with hand-rolled edges. Features geometric prism line-work rendered in Deep Burgundy, Mocha Cream, and Cosmic Latte hues.",
    price: 159900, // ₹1,599.00
    image: "assets/images/products/silk-scarf.jpg",
    active: true,
    variants: [
      { size: "One Size", color: "Burgundy Prism", stock: 8 },
      { size: "One Size", color: "Mocha Geometric", stock: 4 }
    ]
  },
  {
    id: "prod-archived",
    sku: "AUR-ARC-99",
    name: "Archived Sample Dress",
    category: "Dresses",
    description: "Sample prototype from previous season. This item is inactive and should not appear in the storefront.",
    price: 199900,
    image: "assets/images/products/sample.jpg",
    active: false, // Testing inactive product exclusion
    variants: [
      { size: "M", color: "Sample", stock: 1 }
    ]
  }
];

// Helper functions for product access
const ProductService = {
  getAllActive() {
    return PRODUCTS.filter(p => p.active === true);
  },

  getById(id) {
    return PRODUCTS.find(p => p.id === id) || null;
  },

  getVariant(productId, size, color) {
    const product = this.getById(productId);
    if (!product || !Array.isArray(product.variants)) return null;
    return product.variants.find(v => v.size === size && v.color === color) || null;
  },

  getStock(productId, size, color) {
    const variant = this.getVariant(productId, size, color);
    return variant ? variant.stock : 0;
  },

  formatPrice(paise, config) {
    const currency = (config && config.currency) || { symbol: "₹", locale: "en-IN" };
    const rupees = (paise / 100);
    // Format integer if zero decimals, otherwise two decimals
    const formatted = rupees.toLocaleString(currency.locale, {
      minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2
    });
    return `${currency.symbol}${formatted}`;
  }
};

// Universal export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PRODUCTS, ProductService };
} else if (typeof window !== 'undefined') {
  window.PRODUCTS = PRODUCTS;
  window.ProductService = ProductService;
}
