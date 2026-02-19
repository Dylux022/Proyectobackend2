const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// ✅ Reset password token (secreto aparte)
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'reset_secret_change_me';
const RESET_TOKEN_EXPIRES = process.env.RESET_TOKEN_EXPIRES || '1h';

const generateToken = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// ✅ Token de reseteo (1 hora)
const generateResetToken = (user) => {
  const payload = {
    id: user._id.toString(),
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_RESET_SECRET || JWT_RESET_SECRET, {
    expiresIn: process.env.RESET_TOKEN_EXPIRES || RESET_TOKEN_EXPIRES || '1h',
  });
};

const verifyResetToken = (token) => {
  return jwt.verify(token, process.env.JWT_RESET_SECRET || JWT_RESET_SECRET);
};

module.exports = {
  generateToken,
  JWT_SECRET,
  JWT_RESET_SECRET,
  RESET_TOKEN_EXPIRES,
  generateResetToken,
  verifyResetToken,
};
