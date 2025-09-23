import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-api';

const transactionSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const Transaction = mongoose.model('Transaction', transactionSchema);

const sampleData = [
  { productId: 'A', amount: 100 },
  { productId: 'B', amount: 200 },
  { productId: 'A', amount: 150 },
  { productId: 'C', amount: 300 },
  { productId: 'B', amount: 250 },
  { productId: 'A', amount: 75 },
  { productId: 'C', amount: 400 },
  { productId: 'D', amount: 500 }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Transaction.deleteMany({});
    console.log('Cleared existing data');

    await Transaction.insertMany(sampleData);
    console.log('Database seeded successfully');

    const count = await Transaction.countDocuments();
    console.log(`Total transactions: ${count}`);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

seedDatabase();
