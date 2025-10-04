import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true },
    prenom: { type: String, required: true },
    telephone: { type: String, required: true },
    dateNaissance: { type: String, required: true },
    numeroIdentite: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    photo: { type: String, default: '' },
    actif: { type: Boolean, default: true },
    type: { type: String, enum: ['client', 'distributeur'], default: 'client', index: true },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
export default User;
