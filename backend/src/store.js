// Simple in-memory store for demo purposes
export const db = {
  users: [
    // { id, nom, prenom, telephone, dateNaissance, numeroIdentite, email, passwordHash, photo }
  ],
  accounts: [
    // { accountNumber, ownerEmail, balance }
  ],
  transactions: [
    // { id, type: 'deposit', accountNumber, amount, date, by }
  ],
};

export const findUserByEmail = (email) => db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
export const createDefaultAccountIfMissing = (ownerEmail) => {
  const accountNumber = `ACCT-${ownerEmail}`;
  let acct = db.accounts.find(a => a.accountNumber === accountNumber);
  if (!acct) {
    acct = { accountNumber, ownerEmail, balance: 0 };
    db.accounts.push(acct);
  }
  return acct;
};
