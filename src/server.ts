import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-api';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const auth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.header('x-auth');
  if (token === (process.env.AUTH_TOKEN || 'secret')) return next();
  return res.status(401).json({ success: false, message: 'Unauthorized' });
};

app.use('/api', auth);

const transactionSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

const validateProduct = (productId: string, amount: number) => {
  if (!productId || typeof productId !== 'string') return 'Invalid product ID';
  if (typeof amount !== 'number' || amount <= 0) return 'Invalid amount';
  return null;
};


app.get('/', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Transaction.aggregate([
      { $group: { _id: '$productId', amounts: { $push: '$amount' } } },
      { $project: { productId: '$_id', amounts: 1, _id: 0 } },
      { $sort: { productId: 1 } }
    ]);
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

app.get('/api/products/totals', async (req, res) => {
  try {
    const totals = await Transaction.aggregate([
      { $group: { _id: '$productId', totalAmount: { $sum: '$amount' } } },
      { $project: { productId: '$_id', totalAmount: 1, _id: 0 } },
      { $sort: { productId: 1 } }
    ]);
    res.json({ success: true, data: totals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch totals' });
  }
});

app.get('/api/products/:id/total', async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      { $match: { productId: req.params.id } },
      { $group: { _id: '$productId', totalAmount: { $sum: '$amount' } } },
      { $project: { productId: '$_id', totalAmount: 1, _id: 0 } }
    ]);
    
    if (result.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, data: result[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product total' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { productId, amount } = req.body;
    const error = validateProduct(productId, amount);
    
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const transaction = await Transaction.create({ productId, amount });
    res.status(201).json({ success: true, message: 'Transaction created', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create transaction' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json({ success: true, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

app.get('/api/transactions/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction' });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const error = validateProduct(productId, amount);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const transaction = await Transaction.findByIdAndUpdate(
      id, 
      { productId, amount }, 
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction updated', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    const transaction = await Transaction.findByIdAndDelete(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted', data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete transaction' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
