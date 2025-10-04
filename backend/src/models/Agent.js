import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    actif: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Agent = mongoose.model('Agent', agentSchema);
export default Agent;
