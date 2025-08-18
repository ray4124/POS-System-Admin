import fs from 'fs';

// --- Load Products ---
const products = JSON.parse(fs.readFileSync('products.json', 'utf-8'));

// --- Helper Functions ---
function randomDateInRange(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// --- Promotion Types ---
const PROMO_TYPES = ["bogo", "fixed", "percentage"];
const PROMO_NAMES = [
  "Weekend Madness", "Holiday Special", "Payday Sale", "Bundle Deal",
  "Flash Sale", "Midnight Promo", "Exclusive Discount", "Mega Sale",
  "Buy More Save More", "Customer Appreciation", "Anniversary Special",
  "Grand Opening", "Clearance Blast", "Birthday Treat", "Happy Hour",
  "VIP Promo", "Back-to-School", "Summer Splash", "Winter Deals", "New Year Kickoff"
];

// --- Generate Promotions ---
let promotions = [];
let promoProducts = [];

const NUM_PROMOS = Math.floor(Math.random() * 100) + 200; // 200–300 promos
let promoId = 1;

// --- Date range: 1 year past to 1 year future ---
const today = new Date();
const startRange = new Date(today);
startRange.setFullYear(today.getFullYear() - 1);
const endRange = new Date(today);
endRange.setFullYear(today.getFullYear() + 1);

for (let i = 0; i < NUM_PROMOS; i++) {
  let type = randomChoice(PROMO_TYPES);

  let value;
  if (type === "percentage") {
    value = Math.floor(Math.random() * 95) + 1; // 1–95%
  } else if (type === "fixed") {
    value = Math.floor(Math.random() * 1000) + 20; // ₱20–₱1000 off
  } else {
    value = 1; // BOGO placeholder
  }

  // Dates within the 2-year window
  let startDate = randomDateInRange(startRange, endRange);
  let endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + Math.floor(Math.random() * 60) + 1); // 1–60 days long

  // Random timeframe (sometimes null = whole day)
  let useTimeFrame = Math.random() < 0.4; // 40% chance to have timeframe
  let startTimeFrame = useTimeFrame ? `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:00` : null;
  let endTimeFrame = useTimeFrame ? `${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:59` : null;

  // Random minimum conditions
  let minimumSpend = Math.random() < 0.35 ? Math.floor(Math.random() * 5000) + 200 : null; // 35% chance
  let minimumItem = Math.random() < 0.3 ? Math.floor(Math.random() * 10) + 2 : null;       // 30% chance

  let promotion = {
    promotion_id: promoId,
    name: `${randomChoice(PROMO_NAMES)} ${promoId}`,
    description: "Special promotion to boost sales.",
    type,
    value,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    startTimeFrame,
    endTimeFrame,
    minimumSpend,
    minimumItem
  };

  promotions.push(promotion);

  // --- Attach random products ---
  let numProducts = Math.floor(Math.random() * 10) + 1; // 1–10 products per promo
  let usedIds = new Set();

  for (let p = 0; p < numProducts; p++) {
    let product = randomChoice(products);
    if (usedIds.has(product.id)) continue;
    usedIds.add(product.id);

    promoProducts.push({
      promotion_id: promoId,
      product_id: product.id
    });
  }

  promoId++;
}

// --- Save JSON files ---
fs.writeFileSync('promotions.json', JSON.stringify(promotions, null, 2));
fs.writeFileSync('promotion_products.json', JSON.stringify(promoProducts, null, 2));

console.log(`✅ Generated ${promotions.length} promotions with ${promoProducts.length} product links!`);
