import fs from 'fs';

// --- CONFIG ---
const NUM_BRANCHES = 3;
const NUM_BRANDS = 3;
const NUM_PRODUCTS = 20; // total across branches and brands
const START_HOUR = 10; // 10 AM
const END_HOUR = 22; // 10 PM

// --- Generate Branches ---
let branches = [];
for (let i = 1; i <= NUM_BRANCHES; i++) {
    branches.push({ id: i, name: `Branch ${i}` });
}

// --- Generate Brands ---
let brands = [];
for (let i = 1; i <= NUM_BRANDS; i++) {
    brands.push({ id: i, name: `Brand ${i}` });
}

// --- Generate Products ---
let products = [];
for (let i = 1; i <= NUM_PRODUCTS; i++) {
    let branch_id = Math.ceil(Math.random() * NUM_BRANCHES);
    let brand_id = Math.ceil(Math.random() * NUM_BRANDS);
    products.push({
        id: i,
        branch_id,
        brand_id,
        name: `Product ${i}`,
        price: Math.floor(Math.random() * 200) + 50, // 50–250
        stock: Math.floor(Math.random() * 100) + 20 // 20–120
    });
}

// --- Generate Transactions & Transaction Products ---
let transactions = [];
let transactionProducts = [];
let transactionId = 1;

let today = new Date();
let startDate = new Date(today);
startDate.setDate(today.getDate() - 364); // 365 days including today

for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    let numTransactions = Math.floor(Math.random() * 16) + 15; // 15–30

    for (let t = 0; t < numTransactions; t++) {
        let branch_id = Math.ceil(Math.random() * NUM_BRANCHES);

        // Random time between 10AM and 10PM
        let hour = Math.floor(Math.random() * (END_HOUR - START_HOUR)) + START_HOUR;
        let minute = Math.floor(Math.random() * 60);
        let transactionDate = new Date(d);
        transactionDate.setHours(hour, minute, 0, 0);

        transactions.push({
            id: transactionId,
            branch_id,
            date: transactionDate.toISOString(),
            pay_method: Math.random() < 0.5 ? "Cash" : "E-Wallet"
        });

        // 1–5 random products per transaction
        let numProductsInTransaction = Math.floor(Math.random() * 5) + 1;
        let usedProductIds = new Set();

        for (let p = 0; p < numProductsInTransaction; p++) {
            let product = products[Math.floor(Math.random() * products.length)];
            if (usedProductIds.has(product.id)) continue; // avoid duplicate product in same transaction
            usedProductIds.add(product.id);

            let quantity = Math.floor(Math.random() * 5) + 1;
            transactionProducts.push({
                transaction_id: transactionId,
                product_id: product.id,
                quantity,
                price: product.price
            });
        }

        transactionId++;
    }
}

// --- Save to JSON files ---
fs.writeFileSync('branches.json', JSON.stringify(branches, null, 2));
fs.writeFileSync('brands.json', JSON.stringify(brands, null, 2));
fs.writeFileSync('products.json', JSON.stringify(products, null, 2));
fs.writeFileSync('transactions.json', JSON.stringify(transactions, null, 2));
fs.writeFileSync('transaction_products.json', JSON.stringify(transactionProducts, null, 2));

console.log("✅ JSON files generated successfully!");