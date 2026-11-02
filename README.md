# Minimal Glass-Prism WhatsApp Boutique (PRD v2.0)

A polished, mobile-first storefront engineered for independent clothing boutiques. Built with vanilla HTML5, CSS3, and JavaScript—designed specifically for beginner developers working on an Android tablet.

---

## 1. Visual System & Palette Tokens

The boutique uses an art-directed, minimal glass-prism aesthetic inspired by luxury atelier editorial layouts:

| Token | HEX | Primary Role |
| :--- | :--- | :--- |
| **Cosmic Latte** | `#FFF8E7` | Primary background, clean negative space |
| **Mocha Cream** | `#D8C3A5` | Secondary surfaces, selector pills, subtle dividers |
| **Deep Burgundy** | `#5A1833` | Brand anchor, editorial headings, primary action buttons |
| **Espresso Shadow** | `#3D1022` | Supporting deep shade for footer, overlays, and hover depth |

**Glass-Prism Design Principles:**
- Translucent glass surfaces (`rgba(255, 248, 231, 0.78)`) with subtle borders (`rgba(255, 255, 255, 0.55)`).
- Restrained backdrop blur (`14px`–`20px`) applied only to navigation, cart drawer, and detail overlays—never overwhelming product cards.
- Non-blurred solid fallbacks provided for older browsers or low-power rendering.
- Strict touch targets of at least **44×44 CSS pixels** for seamless tablet and mobile navigation.

---

## 2. File-by-File Architecture

```
boutique-shop/
├── index.html                   # Semantic HTML structure, accessible modals & drawer
├── style.css                    # Palette variables, glass surfaces, typography & responsive grid
├── js/
│   ├── config.js                # Shop identity, WhatsApp number, policies & theme placeholders
│   ├── products.js              # Structured product catalog, integer paise prices & variant stock
│   ├── cart.js                  # Untrusted storage revalidation, stock boundary rules & paise math
│   ├── whatsapp.js              # Phone number sanitizer & encoded enquiry/order message generators
│   └── app.js                   # Application lifecycle, catalog rendering, UI events & toast alerts
├── assets/
│   └── images/
│       ├── hero-fashion.jpg     # Hero banner background (with palette fallback)
│       └── products/            # Garment photography directory
├── tests/
│   └── test-suite.js            # Automated verification suite checking all PRD requirements
└── README.md                    # This comprehensive guide
```

### Module Responsibilities:
- **`index.html`**: Contains semantic landmarks (`<header>`, `<main>`, `<section>`, `<aside>`, `<footer>`), accessible dialogs with `aria-modal="true"`, and clean form inputs.
- **`style.css`**: Defines CSS custom properties, responsive breakpoints (320px mobile to wide desktop), and visible keyboard focus rings.
- **`js/config.js`**: Central repository for all boutique settings. Update your WhatsApp phone number and store policies here.
- **`js/products.js`**: Stores all garment records. Prices are represented in integer **paise** (`₹1 = 100 paise`) to prevent floating-point rounding errors. Stock is tracked per specific size-and-colour combination.
- **`js/cart.js`**: Manages the shopping bag. Strictly validates additions against configured stock, re-verifies `localStorage` against current product data, and never saves customer personal information.
- **`js/whatsapp.js`**: Strips non-digits from WhatsApp numbers and constructs encoded links (`wa.me/NUMBER?text=...`) using `encodeURIComponent` to guarantee compatibility with special characters and punctuation.
- **`js/app.js`**: Binds user actions using event listeners (no inline `onclick`), safely updates DOM text via `textContent` (preventing XSS vulnerabilities), and manages modals and live status banners.

---

## 3. How to Preview the Website on an Android Tablet

You can preview and test the boutique directly on your Android tablet using either **Termux** or any Android code editor.

### Option A: Local HTTP Server via Termux (Recommended)

1. Open your **Termux** terminal app.
2. Navigate to the project directory:
   ```bash
   cd ~/projects/boutique-shop
   ```
3. Start the built-in Python web server on port `8080`:
   ```bash
   python3 -m http.server 8080
   ```
4. Open your favorite web browser on your tablet (Chrome, Firefox, or Samsung Internet) and visit:
   ```
   http://localhost:8080
   ```
5. To test responsiveness, rotate your tablet between portrait and landscape modes.

### Option B: Using an Android Code Editor App (Acode / Spck Editor)

1. Open **Acode** (or **Spck Editor**) on your Android tablet.
2. Tap **Open Folder** and navigate to:
   `/data/user/0/com.termux/files/home/projects/boutique-shop`
   *(Or copy the folder to your tablet's shared storage if using external storage).*
3. Open `index.html` and tap the **Play / Live Preview** button in the editor.

---

## 4. Boutique Owner Configuration Guide

All store settings and products are isolated in plain JavaScript files so you do not need to touch complex HTML or CSS.

### Step 1: Update Store Identity & WhatsApp Number (`js/config.js`)

Open `js/config.js` and edit the following fields:

```javascript
const SHOP_CONFIG = {
  // Store details
  shopName: "Your Boutique Name",
  shopTagline: "Art-Directed Minimal Wardrobe",
  shopHeadline: "Your custom headline for the hero section.",
  shopSubheadline: "A brief welcoming sentence describing your aesthetic.",

  // WhatsApp Number: Enter your international digits-only phone number (e.g. 91 for India)
  // Example for Indian number +91 98765 43210 -> "919876543210"
  whatsappNumber: "919876543210",

  // Policies (Displayed under Verified Boutique Standards)
  policies: {
    sizing: "Enter your sizing chart or measurement instructions here.",
    fabricCare: "Enter your fabric care notes (e.g. dry clean only).",
    delivery: "Enter standard shipping timeframes and courier info.",
    returns: "Enter return or exchange timeframes (e.g. 7 days exchange)."
  }
};
```

> **Important**: Do not add `+`, spaces, or hyphens to `whatsappNumber`. The application automatically sanitizes input, but digits-only format ensures seamless URL generation across devices.

### Step 2: Add or Edit Garments (`js/products.js`)

Each product is defined as an object in the `PRODUCTS` array:

```javascript
{
  id: "prod-007",                      // Unique stable identifier
  sku: "AUR-DRS-07",                   // Optional SKU
  name: "Handloom Linen Kaftan",       // Product name
  category: "Dresses",                 // Category for filter tabs
  description: "Editorial product description...",
  price: 349900,                       // Price in PAISE (₹3,499.00 = 349900)
  image: "assets/images/products/kaftan.jpg", // Path to photo
  active: true,                        // Set to false to hide without deleting
  variants: [
    // Define stock per exact size and colour combination
    { size: "S", color: "Cosmic Latte", stock: 3 },
    { size: "M", color: "Cosmic Latte", stock: 5 },
    { size: "L", color: "Cosmic Latte", stock: 0 } // Sold out
  ]
}
```

### Step 3: Add Approved Photos (`assets/images/`)

1. Place your main landscape photo at `assets/images/hero-fashion.jpg`.
2. Place product photos in portrait orientation (ideally 4:5 ratio, e.g. 800×1000px) into `assets/images/products/`.
3. If any image fails to load or is not yet available, the site **automatically displays an elegant Cosmic Latte & Mocha palette art card** with the garment title. You will never see a broken image icon.

---

## 5. WhatsApp User Workflows

The website provides two separate, dedicated WhatsApp flows in strict compliance with PRD v2.0:

### Flow 1: Product-Specific Enquiry (FR-04)
- **Where**: Accessible via the **"Ask about this product"** button on every product card and inside the product detail modal.
- **Behavior**: Opens WhatsApp with a pre-filled enquiry message:
  > *"Hi! I'm interested in Raw Silk Sculpted Blazer (AUR-BLZ-01). Price shown: ₹4,999. Selected option: Size: S, Colour: Deep Burgundy. Could you share more details about availability, fabric/measurements and delivery?"*
- **Key Safety Rule**: This does **not** add the garment to the bag or place an order. It works even if no variant has been selected.

### Flow 2: Cart-Based Order Request (FR-05 & FR-06)
- **Where**: Triggered by the **"Order on WhatsApp"** button inside the Shopping Bag drawer.
- **Behavior**: Compiles all bag items, chosen sizes, colours, quantities, unit prices, line totals, subtotal, and optional customer delivery notes into an order draft.
- **Mandatory Disclosure**: The customer must tap send in WhatsApp to initiate consultation. The seller personally verifies availability and shipping costs before confirming.
- **Customer Privacy**: Customer details (name, phone, delivery address) are optional and **never stored in localStorage**.

---

## 6. Verification & Automated Test Suite

A comprehensive test runner is included to verify all functional requirements without needing a browser.

To run the automated tests:
```bash
node tests/test-suite.js
```

### Scenarios Tested:
1. **Config & Fallback Handling**: Safe defaults when fields are missing or empty.
2. **Product Data Integrity**: Active/inactive filtering, integer paise formatting.
3. **Variant-Level Stock Checks**: Rejection of negative/decimal quantities, out-of-stock blocking.
4. **Cart Merge Rules**: Combining same variant respects stock ceilings; distinct variants remain separate lines.
5. **Untrusted LocalStorage Sanitization**: Corrupt or out-of-stock stored items are purged and totals re-calculated from source data.
6. **Product WhatsApp Enquiry (FR-04)**: Generates correct encoded `wa.me` links with SKU, price, and variant context without modifying the cart.
7. **Cart WhatsApp Order (FR-05)**: Full item breakdown, correct subtotal calculation, optional customer details, and seller confirmation notices.
8. **URL Encoding & Special Characters**: Handles ampersands, commas, and Hindi/Unicode text safely.
9. **Phone Number Sanitization**: Rejects invalid lengths and strips spaces/symbols gracefully.
10. **Touch Targets & Accessibility**: Verifies touch targets >= 44px, semantic labels, and keyboard focus.

---

## 7. Commercial Hosting Guidance

- Static files can be deployed to **Cloudflare Pages**, **Netlify**, or **Vercel** under their free tiers.
- Note: GitHub Pages is intended primarily for open-source documentation. Ensure your selected host permits commercial WhatsApp catalog storefronts under their acceptable use policy.
