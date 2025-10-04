import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['deposit'], required: true },
    accountNumber: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    by: { type: String, required: true },
    byName: { type: String, default: '' },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['completed', 'canceled'], default: 'completed', index: true },
    canceledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
