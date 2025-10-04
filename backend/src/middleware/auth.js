import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export const sign = (payload, options = {}) => jwt.sign(payload, JWT_SECRET, { expiresIn: '2h', ...options });

export const requireAuth = (req, _res, next) => {
  const auth = req.headers.authorization || '';
  const [, token] = auth.split(' ');
  if (!token) return next({ status: 401, message: 'Token manquant' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    next({ status: 401, message: 'Token invalide' });
  }
};

export default requireAuth;
