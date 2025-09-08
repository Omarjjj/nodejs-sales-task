"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotalSales = calculateTotalSales;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const INPUT_FILE = path_1.default.join('data', 'sales.json');
const OUT_PUT_File = path_1.default.join('data', 'results.json');
function calculateTotalSales(transactions) {
    if (!Array.isArray(transactions)) {
        throw new Error('Invalid transactions data');
    }
    const totals = transactions.reduce((acc, item, idx) => {
        if (!item || typeof item.productId === 'undefined' || typeof item.amount === 'undefined') {
            console.warn(`skipping item #${idx}: missing productId or amount`);
            return acc;
        }
        const id = String(item.productId);
        acc[id] = (acc[id] || 0) + Number(item.amount);
        return acc;
    }, {});
    return totals;
}
async function main() {
    const raw = await promises_1.default.readFile(INPUT_FILE, 'utf8');
    let transactions;
    try {
        transactions = JSON.parse(raw);
    }
    catch (err) {
        throw new Error(`failed to parse ${INPUT_FILE} as JSON`);
    }
    const totals = calculateTotalSales(transactions);
    const outputJ = JSON.stringify({ totalSales: totals }, null, 2);
    await promises_1.default.writeFile(OUT_PUT_File, outputJ, 'utf8');
    console.log('Total sales written to', OUT_PUT_File);
    console.log('You can see them in \n', outputJ);
}
main().catch(function (err) {
    console.error('error:', err.message);
    process.exit(1);
});
