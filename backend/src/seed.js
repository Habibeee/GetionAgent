import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Account from './models/Account.js';

function randDigits(len) {
  let s = '';
  for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
  return s;
}

export async function runSeed() {
  const baseUsers = [
    { prenom: 'Khadim', nom: 'Ndiaye' },
    { prenom: 'Moustapha', nom: 'Mbaye' },
    { prenom: 'Makhtare', nom: 'Sylla' },
    { prenom: 'Ami', nom: 'Ndiaye' },
    { prenom: 'Fatou', nom: 'Bodian' },
    // Ajouts pour atteindre 8 utilisateurs
    { prenom: 'Bara', nom: 'Diallo' },
    { prenom: 'Aliou', nom: 'Seck' },
    { prenom: 'Seynabou', nom: 'Diallo' },
  ];

  const defaultPassword = 'Passw0rd!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // Seed specific requested agent: diallo23@gmail.com / passer1234
  const specialEmail = 'diallo23@gmail.com';
  const specialPwdHash = await bcrypt.hash('passer1234', 10);
  const existingSpecial = await User.findOne({ email: specialEmail });
  if (!existingSpecial) {
    const specialUser = await User.create({
      nom: 'Diallo',
      prenom: 'Bara',
      telephone: '77' + randDigits(7),
      dateNaissance: '1990-01-01',
      numeroIdentite: randDigits(13),
      email: specialEmail,
      passwordHash: specialPwdHash,
      photo: '',
      actif: true,
    });
    const accountNumber = `ACCT-${specialUser.email}`;
    await Account.create({ accountNumber, ownerEmail: specialUser.email, balance: 0 });
  } else {
    const accountNumber = `ACCT-${existingSpecial.email}`;
    const acct = await Account.findOne({ accountNumber });
    if (!acct) {
      await Account.create({ accountNumber, ownerEmail: existingSpecial.email, balance: 0 });
    }
  }

  for (let i = 0; i < baseUsers.length; i++) {
    const u = baseUsers[i];
    const email = `${u.prenom}.${u.nom}${i + 1}`.toLowerCase().replace(/\s+/g, '') + '@example.com';
    const existing = await User.findOne({ email });
    if (existing) {
      // Ensure an account exists
      const accountNumber = `ACCT-${email}`;
      const acct = await Account.findOne({ accountNumber });
      if (!acct) {
        await Account.create({ accountNumber, ownerEmail: email, balance: 0 });
      }
      continue;
    }

    const newUser = await User.create({
      nom: u.nom,
      prenom: u.prenom,
      telephone: '77' + randDigits(7),
      dateNaissance: '1990-01-01',
      numeroIdentite: randDigits(13),
      email,
      passwordHash,
      photo: '',
      actif: true,
    });

    const accountNumber = `ACCT-${newUser.email}`;
    await Account.create({ accountNumber, ownerEmail: newUser.email, balance: 0 });
  }

  return { seeded: true };
}

export default runSeed;
