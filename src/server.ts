import express from 'express';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// middleware
app.use(express.json());

// data file
const SALES_FILE = path.join('data', 'sales.json');

// interface
interface Transaction {
    productId: string;
    amount: number;
}

// helper functions
async function readData(): Promise<Transaction[]> {
    try {
        const data = await fs.readFile(SALES_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return [];
    } 
}

async function writeData(data: Transaction[]): Promise<void> {
    await fs.writeFile(SALES_FILE, JSON.stringify(data, null, 2));
}

function calculateTotals(transactions: Transaction[]): Record<string, number> {
    return transactions.reduce((acc, item) => {
        if (item?.productId && typeof item.amount === 'number') {
            acc[item.productId] = (acc[item.productId] || 0) + item.amount;
        }
        return acc;
    }, {} as Record<string, number>);
}

function getProductAmounts(transactions: Transaction[], productId: string): number[] {
    return transactions
        .filter(t => t.productId === productId)
        .map(t => t.amount);
}

// api routes

// get total amount for all products
app.get('/api/products/totals', async (req, res) => {
    try {
        const transactions = await readData();
        const totals = calculateTotals(transactions);
        const result = Object.entries(totals).map(([productId, totalAmount]) => ({
            productId,
            totalAmount
        }));
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get totals' });
    }
});

// get product details (product IDs with their amounts)
app.get('/api/products', async (req, res) => {
    try {
        const transactions = await readData();
        const grouped = transactions.reduce((acc, t) => {
            if (!acc[t.productId]) acc[t.productId] = [];
            acc[t.productId].push(t.amount);
            return acc;
        }, {} as Record<string, number[]>);
        
        const result = Object.entries(grouped).map(([productId, amounts]) => ({
            productId,
            amounts
        }));
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get products' });
    }
});

// get product by ID with total amount
app.get('/api/products/:id/total', async (req, res) => {
    try {
        const { id } = req.params;
        const transactions = await readData();
        const totals = calculateTotals(transactions);
        
        if (!(id in totals)) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        
        res.json({ success: true, data: { productId: id, totalAmount: totals[id] } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get product total' });
    }
});

// get product by ID with all amounts
app.get('/api/products/:id/amounts', async (req, res) => {
    try {
        const { id } = req.params;
        const transactions = await readData();
        const amounts = getProductAmounts(transactions, id);
        
        if (amounts.length === 0) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        
        res.json({ success: true, data: { productId: id, amounts } });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to get product amounts' });
    }
});

//  add new product
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
        const newTransaction: Transaction = { productId, amount };
        transactions.push(newTransaction);
        await writeData(transactions);
        
        res.status(201).json({ success: true, message: 'Product added', data: newTransaction });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to add product' });
    }
});

// root endpoint
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