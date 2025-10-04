import mongoose from 'mongoose';

const accountSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, required: true, unique: true, index: true },
    ownerEmail: { type: String, required: true, index: true },
    balance: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

export const Account = mongoose.model('Account', accountSchema);
export default Account;
