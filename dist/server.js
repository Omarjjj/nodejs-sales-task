"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-api';
mongoose_1.default.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));
app.use((req, _res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});
function auth(req, res, next) {
    const token = req.header('x-auth');
    if (token === 'secret')
        return next();
    return res.status(401).json({ success: false, message: 'Unauthorized' });
}
app.use('/api', auth);
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
// Mongoose Schema and Model
const transactionSchema = new mongoose_1.default.Schema({
    productId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});
const Transaction = mongoose_1.default.model('Transaction', transactionSchema);
const processData = (transactions) => {
    const grouped = transactions.reduce((acc, t) => {
        if (!acc[t.productId])
            acc[t.productId] = [];
        acc[t.productId].push(t.amount);
        return acc;
    }, {});
    const totals = Object.entries(grouped).reduce((acc, [id, amounts]) => {
        acc[id] = amounts.reduce((sum, amount) => sum + amount, 0);
        return acc;
    }, {});
    return { grouped, totals };
};
const validateProduct = (productId, amount) => {
    if (!productId || typeof productId !== 'string')
        return 'invalid product';
    if (typeof amount !== 'number' || amount <= 0)
        return 'invalid amount';
    return null;
};
app.get('/', (req, res) => {
    res.send('the server is Running!');
});
app.get('/api/products', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        const { grouped } = processData(transactions);
        const data = Object.entries(grouped).map(([productId, amounts]) => ({ productId, amounts }));
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(400).json({ success: false, message: 'Failed to fetch products' });
    }
});
app.get('/api/products/totals', async (req, res) => {
    try {
        const transactions = await Transaction.find();
        const { totals } = processData(transactions);
        const data = Object.entries(totals).map(([productId, totalAmounts]) => ({ productId, totalAmounts }));
        res.status(200).json({ success: true, data });
    }
    catch (error) {
        console.error('Error fetching totals:', error);
        res.status(400).json({ success: false, message: 'Failed to fetch totals' });
    }
});
app.get('/api/products/:id/total', async (req, res) => {
    try {
        const { id } = req.params;
        const transactions = await Transaction.find();
        const { totals } = processData(transactions);
        if (!totals[id])
            return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, data: { productId: id, amount: totals[id] } });
    }
    catch (error) {
        console.error('Error fetching product total:', error);
        res.status(400).json({ success: false, message: 'Failed to get the product amount' });
    }
});
app.get('/api/products/:id/amounts', async (req, res) => {
    try {
        const { id } = req.params;
        const transactions = await Transaction.find();
        const { grouped } = processData(transactions);
        if (!grouped[id]?.length)
            return res.status(404).json({ success: false, message: 'Product not found' });
        res.status(200).json({ success: true, data: { productId: id, amount: grouped[id] } });
    }
    catch (error) {
        console.error('Error fetching product amounts:', error);
        res.status(400).json({ success: false, message: 'Failed to get the product amounts' });
    }
});
const sendResponse = (res, statusCode, data) => {
    res.status(statusCode).json({ success: true, ...data });
};
app.post('/api/products', async (req, res) => {
    try {
        const { productId, amount } = req.body;
        const error = validateProduct(productId, amount);
        if (error)
            return res.status(400).json({ success: false, message: 'Invalid product data' });
        const newTransaction = new Transaction({ productId, amount });
        const savedTransaction = await newTransaction.save();
        sendResponse(res, 201, { message: 'Product added', data: savedTransaction });
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(400).json({ success: false, message: 'Failed to create product' });
    }
});
