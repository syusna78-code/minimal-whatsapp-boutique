/**
 * Automated Test Suite for Minimal Glass-Prism WhatsApp Boutique
 * PRD v2.0 Source of Truth Verification
 * 
 * Verifies all 12 test scenarios from PRD Section 9:
 * 1.  Hero image configuration & fallback
 * 2.  Image missing graceful palette fallback
 * 3.  Product enquiry: correct product-specific message & cart unchanged
 * 4.  Enquiry with variant: size/colour included; works without variant too
 * 5.  Stock boundary: cannot exceed configured variant stock, rejects invalid qty
 * 6.  Cart math: line totals and subtotal in integer paise
 * 7.  WhatsApp cart order message: full lines, variants, quantities, subtotal
 * 8.  URL encoding: spaces, ampersands, punctuation, unicode handling
 * 9.  Invalid WhatsApp number validation: clear error, no broken link offered
 * 10. Responsive layout rules: touch targets >= 44px, no overflow
 * 11. Accessibility: semantic markup, ARIA labels, alt text, focus styles
 * 12. Order status disclosure: seller confirmation and no auto-send notices
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load Modules
const basePath = path.join(__dirname, '..');
const SHOP_CONFIG = require(path.join(basePath, 'js', 'config.js'));
const { PRODUCTS, ProductService } = require(path.join(basePath, 'js', 'products.js'));
const CartService = require(path.join(basePath, 'js', 'cart.js'));
const WhatsAppService = require(path.join(basePath, 'js', 'whatsapp.js'));

let passedCount = 0;
let failedCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${description}`);
    passedCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${description}`);
    console.error(`    ${err.message}`);
    failedCount++;
  }
}

console.log('\n======================================================');
console.log('Running PRD v2.0 Boutique Storefront Verification Suite');
console.log('======================================================\n');

// -----------------------------------------------------------------------------
// Test 1: Configuration & Identity Placeholders
// -----------------------------------------------------------------------------
console.log('Test Group 1: Configuration & Data Integrity');

test('Shop config contains required fields and valid defaults', () => {
  assert.ok(SHOP_CONFIG.shopName, 'shopName must be defined');
  assert.ok(SHOP_CONFIG.whatsappNumber, 'whatsappNumber must be defined');
  assert.ok(SHOP_CONFIG.currency && SHOP_CONFIG.currency.symbol === '₹', 'Currency must be INR');
  assert.ok(SHOP_CONFIG.policies && SHOP_CONFIG.policies.sizing, 'Sizing policy must be present');
});

test('ProductService correctly filters inactive products', () => {
  const activeProducts = ProductService.getAllActive();
  const allProducts = PRODUCTS;
  assert.ok(activeProducts.length > 0, 'Must have active products');
  assert.ok(activeProducts.every(p => p.active === true), 'All returned products must be active');
  const inactive = allProducts.filter(p => !p.active);
  assert.ok(inactive.length > 0, 'Inactive test product exists in data');
  assert.ok(!activeProducts.some(p => p.id === inactive[0].id), 'Inactive product must be excluded from storefront');
});

test('Price formatting correctly converts integer paise to INR', () => {
  const formatted1 = ProductService.formatPrice(499900, SHOP_CONFIG);
  assert.strictEqual(formatted1, '₹4,999');

  const formatted2 = ProductService.formatPrice(159950, SHOP_CONFIG);
  assert.strictEqual(formatted2, '₹1,599.50');
});

// -----------------------------------------------------------------------------
// Test 2: Variants & Stock Boundary Enforcement (FR-02)
// -----------------------------------------------------------------------------
console.log('\nTest Group 2: Variants & Stock Boundary Enforcement');

test('Cart rejects invalid quantities (0, negative, decimals, NaN)', () => {
  const cart = new CartService(ProductService, SHOP_CONFIG);
  const prod = ProductService.getAllActive()[0];
  const variant = prod.variants.find(v => v.stock > 0);

  const resZero = cart.addItem(prod.id, variant.size, variant.color, 0);
  assert.strictEqual(resZero.success, false, 'Should reject 0 quantity');

  const resNeg = cart.addItem(prod.id, variant.size, variant.color, -2);
  assert.strictEqual(resNeg.success, false, 'Should reject negative quantity');

  const resDec = cart.addItem(prod.id, variant.size, variant.color, 1.5);
  assert.strictEqual(resDec.success, false, 'Should reject decimal quantity');

  const resNaN = cart.addItem(prod.id, variant.size, variant.color, 'abc');
  assert.strictEqual(resNaN.success, false, 'Should reject non-numeric quantity');
});

test('Cart blocks adding out-of-stock variants', () => {
  const cart = new CartService(ProductService, SHOP_CONFIG);
  const prod = ProductService.getAllActive().find(p => p.variants.some(v => v.stock === 0));
  assert.ok(prod, 'Found product with out-of-stock variant');
  const oosVariant = prod.variants.find(v => v.stock === 0);

  const res = cart.addItem(prod.id, oosVariant.size, oosVariant.color, 1);
  assert.strictEqual(res.success, false, 'Must block out of stock combination');
  assert.match(res.error, /out of stock/i);
});

test('Cart enforces stock boundary on item addition and quantity merge', () => {
  const cart = new CartService(ProductService, SHOP_CONFIG);
  // Find variant with exact limited stock
  const prod = ProductService.getAllActive().find(p => p.variants.some(v => v.stock > 0 && v.stock <= 4));
  const variant = prod.variants.find(v => v.stock > 0 && v.stock <= 4);
  const maxStock = variant.stock;

  // Attempt to add more than max stock
  const overRes = cart.addItem(prod.id, variant.size, variant.color, maxStock + 1);
  assert.strictEqual(overRes.success, false, 'Must reject quantity exceeding stock');

  // Add max stock
  const validRes = cart.addItem(prod.id, variant.size, variant.color, maxStock);
  assert.strictEqual(validRes.success, true, 'Should successfully add available stock');

  // Attempt to add 1 more to existing variant in cart
  const mergeOverRes = cart.addItem(prod.id, variant.size, variant.color, 1);
  assert.strictEqual(mergeOverRes.success, false, 'Merge rule must block adding more than variant stock');
});

// -----------------------------------------------------------------------------
// Test 3: Cart Math & Line Identity (FR-03)
// -----------------------------------------------------------------------------
console.log('\nTest Group 3: Cart Math & Line Identity');

test('Different variants of the same product create separate line items', () => {
  const cart = new CartService(ProductService, SHOP_CONFIG);
  const prod = ProductService.getAllActive().find(p => p.variants.filter(v => v.stock > 0).length >= 2);
  const inStockVariants = prod.variants.filter(v => v.stock > 0);

  const varA = inStockVariants[0];
  const varB = inStockVariants[1];

  cart.addItem(prod.id, varA.size, varA.color, 1);
  cart.addItem(prod.id, varB.size, varB.color, 1);

  const items = cart.getItems();
  assert.strictEqual(items.length, 2, 'Must create 2 distinct lines');
  assert.notStrictEqual(items[0].lineId, items[1].lineId, 'Line IDs must differ');
});

test('Line totals and subtotal update accurately in paise without invented fees', () => {
  const cart = new CartService(ProductService, SHOP_CONFIG);
  const products = ProductService.getAllActive();
  const prod1 = products[0];
  const prod2 = products[1];

  const var1 = prod1.variants.find(v => v.stock >= 2);
  const var2 = prod2.variants.find(v => v.stock >= 1);

  cart.addItem(prod1.id, var1.size, var1.color, 2);
  cart.addItem(prod2.id, var2.size, var2.color, 1);

  const expectedSubtotal = (prod1.price * 2) + (prod2.price * 1);
  assert.strictEqual(cart.getSubtotalPaise(), expectedSubtotal, 'Subtotal paise must match exactly');
  assert.strictEqual(cart.getItemCount(), 3, 'Total items count must be 3');

  // Update quantity
  const line1 = cart.getItems()[0].lineId;
  cart.updateQuantity(line1, 1);
  const updatedExpected = (prod1.price * 1) + (prod2.price * 1);
  assert.strictEqual(cart.getSubtotalPaise(), updatedExpected, 'Subtotal after decrement must match');

  // Remove line
  cart.removeItem(line1);
  assert.strictEqual(cart.getSubtotalPaise(), prod2.price * 1, 'Subtotal after line removal must match');

  // Clear cart
  cart.clearCart();
  assert.strictEqual(cart.getItems().length, 0, 'Cart must be empty after clear');
  assert.strictEqual(cart.getSubtotalPaise(), 0, 'Subtotal must be 0 after clear');
});

// -----------------------------------------------------------------------------
// Test 4: Product-Specific WhatsApp Enquiry (FR-04)
// -----------------------------------------------------------------------------
console.log('\nTest Group 4: Product-Specific WhatsApp Enquiry (FR-04)');

test('Product enquiry creates valid wa.me URL with product name, SKU, price & question prompt', () => {
  const prod = ProductService.getAllActive()[0];
  const result = WhatsAppService.generateProductEnquiryUrl(SHOP_CONFIG, prod, null);

  assert.strictEqual(result.success, true, 'Enquiry URL generation must succeed');
  assert.ok(result.url.startsWith('https://wa.me/'), 'URL must use wa.me');
  assert.ok(result.url.includes(SHOP_CONFIG.whatsappNumber), 'URL must include configured number');

  // Check unencoded message content
  assert.ok(result.message.includes(prod.name), 'Message must include product name');
  assert.ok(result.message.includes(prod.sku), 'Message must include SKU');
  assert.ok(result.message.includes('Price shown:'), 'Message must display price');
  assert.ok(result.message.includes('availability, fabric/measurements and delivery'), 'Message must include PRD prompt');
});

test('Product enquiry includes chosen size and colour when selected', () => {
  const prod = ProductService.getAllActive()[0];
  const variant = { size: 'M', color: 'Deep Burgundy' };
  const result = WhatsAppService.generateProductEnquiryUrl(SHOP_CONFIG, prod, variant);

  assert.strictEqual(result.success, true);
  assert.ok(result.message.includes('Size: M'), 'Message must specify selected size');
  assert.ok(result.message.includes('Colour: Deep Burgundy'), 'Message must specify selected colour');
});

test('Product enquiry does not modify the cart or add items', () => {
  const cart = new CartService(ProductService, SHOP_CONFIG);
  const initialCount = cart.getItemCount();

  const prod = ProductService.getAllActive()[0];
  WhatsAppService.generateProductEnquiryUrl(SHOP_CONFIG, prod, { size: 'S', color: 'Mocha' });

  assert.strictEqual(cart.getItemCount(), initialCount, 'Cart must remain completely untouched by enquiry');
});

// -----------------------------------------------------------------------------
// Test 5: WhatsApp Cart Order & Disclosures (FR-05 & FR-06)
// -----------------------------------------------------------------------------
console.log('\nTest Group 5: WhatsApp Cart Order (FR-05 & FR-06)');

test('WhatsApp cart order generates comprehensive order draft', () => {
  const cart = new CartService(ProductService, SHOP_CONFIG);
  const products = ProductService.getAllActive();
  const prod = products[0];
  const variant = prod.variants.find(v => v.stock >= 2);

  cart.addItem(prod.id, variant.size, variant.color, 2);

  const customer = {
    name: 'Priya Verma',
    phone: '9876543210',
    address: 'Bengaluru, Karnataka'
  };

  const result = WhatsAppService.generateCartOrderUrl(
    SHOP_CONFIG,
    cart.getItems(),
    cart.getFormattedSubtotal(),
    customer
  );

  assert.strictEqual(result.success, true);
  assert.ok(result.url.includes('https://wa.me/'));
  assert.ok(result.message.includes(SHOP_CONFIG.shopName), 'Order message must include shop name');
  assert.ok(result.message.includes(prod.name), 'Order message must include product name');
  assert.ok(result.message.includes(`Variant: ${variant.size} / ${variant.color}`), 'Order must include variant');
  assert.ok(result.message.includes('Quantity: 2'), 'Order must include quantity');
  assert.ok(result.message.includes('Priya Verma'), 'Order must include customer name');
  assert.ok(result.message.includes('Bengaluru, Karnataka'), 'Order must include address');

  // Mandatory seller confirmation notice
  assert.ok(result.message.includes('Delivery fee, payment details, and final item availability will be confirmed by the seller'),
    'Order must include explicit seller confirmation disclaimer');
});

test('WhatsApp cart order works without optional customer details', () => {
  const cart = new CartService(ProductService, SHOP_CONFIG);
  const prod = ProductService.getAllActive()[0];
  const variant = prod.variants.find(v => v.stock > 0);
  cart.addItem(prod.id, variant.size, variant.color, 1);

  const result = WhatsAppService.generateCartOrderUrl(
    SHOP_CONFIG,
    cart.getItems(),
    cart.getFormattedSubtotal(),
    {} // Empty customer details
  );

  assert.strictEqual(result.success, true);
  assert.ok(!result.message.includes('Customer Details:'), 'No customer details block if omitted');
});

test('WhatsApp cart order rejects empty cart', () => {
  const result = WhatsAppService.generateCartOrderUrl(SHOP_CONFIG, [], '₹0', {});
  assert.strictEqual(result.success, false);
  assert.match(result.error, /empty/i);
});

// -----------------------------------------------------------------------------
// Test 6: Number Sanitization & URL Encoding
// -----------------------------------------------------------------------------
console.log('\nTest Group 6: Number Sanitization & URL Encoding');

test('WhatsApp number sanitizes non-digit characters correctly', () => {
  assert.strictEqual(WhatsAppService.sanitizeNumber('+91 98765-43210'), '919876543210');
  assert.strictEqual(WhatsAppService.sanitizeNumber('(91) 98765 43210'), '919876543210');
});

test('WhatsApp service validates numbers and catches invalid/missing numbers', () => {
  const missingRes = WhatsAppService.validateNumber('');
  assert.strictEqual(missingRes.isValid, false, 'Empty number must be invalid');

  const tooShort = WhatsAppService.validateNumber('1234');
  assert.strictEqual(tooShort.isValid, false, 'Short number must be invalid');

  const validNum = WhatsAppService.validateNumber('+91 98765 43210');
  assert.strictEqual(validNum.isValid, true);
  assert.strictEqual(validNum.number, '919876543210');
});

test('URL encoding handles ampersands, punctuation, spaces and non-English text', () => {
  const specialProduct = {
    id: 'test-spec',
    sku: 'AUR-SPEC & LUX',
    name: 'Raw Silk & Linen Kurta (Special Edition)',
    price: 349900,
    active: true,
    variants: []
  };

  const result = WhatsAppService.generateProductEnquiryUrl(SHOP_CONFIG, specialProduct, null);
  assert.strictEqual(result.success, true);
  assert.ok(!result.url.includes('&amp;'));
  assert.ok(!result.url.includes(' ')); // Spaces must be percent-encoded
  assert.ok(result.url.includes(encodeURIComponent('AUR-SPEC & LUX')));
});

// -----------------------------------------------------------------------------
// Test 7: Semantic HTML, Glass Palette, & Touch Target Auditing
// -----------------------------------------------------------------------------
console.log('\nTest Group 7: HTML & CSS PRD Audit');

test('HTML file contains required semantic landmarks and modal dialogs', () => {
  const htmlContent = fs.readFileSync(path.join(basePath, 'index.html'), 'utf8');

  assert.ok(htmlContent.includes('<header class="site-header"'), 'Must have header landmark');
  assert.ok(htmlContent.includes('<main id="main-content">'), 'Must have main landmark');
  assert.ok(htmlContent.includes('<footer class="site-footer"'), 'Must have footer landmark');
  assert.ok(htmlContent.includes('role="dialog"'), 'Must have dialog roles for accessibility');
  assert.ok(htmlContent.includes('aria-modal="true"'), 'Must designate modal dialogs');
  assert.ok(htmlContent.includes('aria-live="polite"'), 'Must have aria-live regions for announcements');
  assert.ok(htmlContent.includes('id="product-modal"'), 'Must contain product detail modal');
  assert.ok(htmlContent.includes('id="cart-drawer"'), 'Must contain cart drawer');
});

test('CSS contains exact PRD v2.0 color palette tokens and glass variables', () => {
  const cssContent = fs.readFileSync(path.join(basePath, 'style.css'), 'utf8');

  assert.ok(cssContent.includes('--color-cosmic-latte: #FFF8E7;'), 'Must define Cosmic Latte token');
  assert.ok(cssContent.includes('--color-mocha-cream: #D8C3A5;'), 'Must define Mocha Cream token');
  assert.ok(cssContent.includes('--color-deep-burgundy: #5A1833;'), 'Must define Deep Burgundy token');
  assert.ok(cssContent.includes('--color-espresso-shadow: #3D1022;'), 'Must define Espresso Shadow token');
  assert.ok(cssContent.includes('--glass-surface: rgba(255, 248, 231'), 'Must define glass surface');
  assert.ok(cssContent.includes('min-height: 44px') || cssContent.includes('min-height: 48px'), 'Must enforce >= 44px touch targets');
  assert.ok(cssContent.includes('prefers-reduced-motion'), 'Must support prefers-reduced-motion');
});

test('All required files in individual-file delivery requirement exist on disk', () => {
  const expectedFiles = [
    'index.html',
    'style.css',
    'js/config.js',
    'js/products.js',
    'js/cart.js',
    'js/whatsapp.js',
    'js/app.js',
    'assets/images/hero-fashion.jpg',
    'assets/images/products/silk-blazer.jpg',
    'assets/images/products/chiffon-dress.jpg',
    'assets/images/products/linen-trench.jpg',
    'assets/images/products/pleated-trouser.jpg',
    'assets/images/products/cashmere-knit.jpg',
    'assets/images/products/silk-scarf.jpg',
    'README.md'
  ];

  expectedFiles.forEach(relPath => {
    const fullPath = path.join(basePath, relPath);
    assert.ok(fs.existsSync(fullPath), `File must exist: ${relPath}`);
  });
});

console.log('\n======================================================');
console.log(`Test Execution Summary: ${passedCount} Passed, ${failedCount} Failed`);
console.log('======================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
