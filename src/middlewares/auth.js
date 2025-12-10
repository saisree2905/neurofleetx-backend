const jwt = require('../utils/jwt');
const User = require('../models/user');

exports.verifyToken = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ msg: 'Missing Authorization header' });

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ msg: 'Invalid Authorization header' });

  try {
    const payload = jwt.verifyToken(parts[1]);
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ msg: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: 'Invalid or expired token' });
  }
};

exports.requireRole = (role) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ msg: 'Not authenticated' });
  if (req.user.role !== role) return res.status(403).json({ msg: 'Forbidden: insufficient role' });
  next();
};
