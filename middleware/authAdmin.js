import jwt from 'jsonwebtoken';

const JWT_SECRET = 'your_jwt_secret_key';

export const verifyAdmin = (req, res, next) => {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Not an admin.' });
    }

    req.user = decoded; // نمرر البيانات للي بعدها
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};
