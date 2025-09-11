"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use(express_1.default.json());
// Data file
const SALES_FILE = path_1.default.join('data', 'sales.json');
// Helper functions
async function readData() {
    try {
        const data = await promises_1.default.readFile(SALES_FILE, 'utf8');
        return JSON.parse(data);
    }
    catch {
        return [];
    }
}
async function writeData(data) {
    await promises_1.default.writeFile(SALES_FILE, JSON.stringify(data, null, 2));
}
function calculateTotals(transactions) {
    return transactions.reduce((acc, item) => {
        if (item?.productId && typeof item.amount === 'number') {
            acc[item.productId] = (acc[item.productId] || 0) + item.amount;
        }
        return acc;
    }, {});
}
function getProductAmounts(transactions, productId) {
    return transactions
        .filter(t => t.productId === productId)
        .map(t => t.amount);
}
// API Routes
// 1. Get total amount for all products
app.get('/api/products/totals', async (req, res) => {
    try {
        const transactions = await readData();
        const totals = calculateTotals(transactions);
        const result = Object.entries(totals).map(([productId, totalAmount]) => ({
            productId,
            totalAmount
        }));
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get totals' });
    }
});
// 2. Get product details (product IDs with their amounts)
app.get('/api/products', async (req, res) => {
    try {
        const transactions = await readData();
        const grouped = transactions.reduce((acc, t) => {
            if (!acc[t.productId])
                acc[t.productId] = [];
            acc[t.productId].push(t.amount);
            return acc;
        }, {});
        const result = Object.entries(grouped).map(([productId, amounts]) => ({
            productId,
            amounts
        }));
        res.json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get products' });
    }
});
// 3. Get product by ID with total amount
app.get('/api/products/:id/total', async (req, res) => {
    try {
        const { id } = req.params;
        const transactions = await readData();
        const totals = calculateTotals(transactions);
        if (!(id in totals)) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: { productId: id, totalAmount: totals[id] } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get product total' });
    }
});
// 4. Get product by ID with all amounts
app.get('/api/products/:id/amounts', async (req, res) => {
    try {
        const { id } = req.params;
        const transactions = await readData();
        const amounts = getProductAmounts(transactions, id);
        if (amounts.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.json({ success: true, data: { productId: id, amounts } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get product amounts' });
    }
});
// 5. Add new product
app.post('/api/products', async (req, res) => {
    try {
        const { productId, amount } = req.body;
        if (!productId || typeof productId !== 'string') {
            return res.status(400).json({ success: false, error: 'Invalid productId' });
        }
        if (typeof amount !== 'number' || amount <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid amount' });
        }
        const transactions = await readData();
        const newTransaction = { productId, amount };
        transactions.push(newTransaction);
        await writeData(transactions);
        res.status(201).json({ success: true, message: 'Product added', data: newTransaction });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add product' });
    }
});
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Product API Server',
        endpoints: {
            'GET /api/products/totals': 'Get total amount for all products',
            'GET /api/products': 'Get product details with amounts',
            'GET /api/products/:id/total': 'Get product by ID with total amount',
            'GET /api/products/:id/amounts': 'Get product by ID with all amounts',
            'POST /api/products': 'Add new product'
        }
    });
});
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET  /api/products/totals');
    console.log('  GET  /api/products');
    console.log('  GET  /api/products/:id/total');
    console.log('  GET  /api/products/:id/amounts');
    console.log('  POST /api/products');
});
