"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
require("./server");
/*import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs/promises';
import path from 'path';

const INPUT_FILE = path.join('data', 'sales.json');
const OUT_PUT_File = path.join('data', 'results.json');

export interface Transaction {
    productId: string;
    amount: number;
}

export function calculateTotalSales(transactions: Transaction[]): Record<string, number> {
    if (!Array.isArray(transactions)) {
        throw new Error('Invalid transactions data');
    }
    const totals: Record<string, number> = transactions.reduce((acc, item, idx) => {
        if (!item || typeof item.productId === 'undefined' || typeof item.amount === 'undefined') {
            console.warn(`skipping item #${idx}: missing productId or amount`);
            return acc;
        }
        const id = String(item.productId);
        acc[id] = (acc[id] || 0) + Number(item.amount);
        return acc;
    }, {} as Record<string, number>);
    return totals;
}

async function main(): Promise<void> {
    const raw = await fs.readFile(INPUT_FILE, 'utf8');
    let transactions: Transaction[];
    try {
        transactions = JSON.parse(raw);
    } catch (err) {
        throw new Error(`failed to parse ${INPUT_FILE} as JSON`);
    }
    const totals = calculateTotalSales(transactions);
    const outputJ = JSON.stringify({ totalSales: totals }, null, 2);
    await fs.writeFile(OUT_PUT_File, outputJ, 'utf8');
    console.log('Total sales written to', OUT_PUT_File);
    console.log('You can see them in \n', outputJ);
}

main().catch(function (err) {
    console.error('error:', err.message);
    process.exit(1);
});*/
