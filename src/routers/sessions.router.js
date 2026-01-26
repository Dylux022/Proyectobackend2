const { Router } = require('express');
const passport = require('passport');
const User = require('../models/user.model');
const { createHash, isValidPassword } = require('../utils/hash');
const { generateToken } = require('../utils/jwt');

const router = Router();

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, age, password, cart, role } = req.body;

    if (!first_name || !last_name || !email || age === undefined || !password) {
      return res.status(400).json({ status: 'error', error: 'Faltan campos obligatorios' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(409).json({ status: 'error', error: 'Email ya registrado' });

    const user = await User.create({
      first_name,
      last_name,
      email,
      age,
      password: createHash(password),
      cart: cart || null,
      role: role || 'user',
    });

    return res.status(201).json({ status: 'success', payload: { id: user._id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// LOGIN (JWT)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ status: 'error', error: 'Email y password requeridos' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ status: 'error', error: 'Credenciales inválidas' });

    const ok = isValidPassword(password, user);
    if (!ok) return res.status(401).json({ status: 'error', error: 'Credenciales inválidas' });

    const token = generateToken(user);

    //  token 
    return res.json({
      status: 'success',
      token,
      user: { id: user._id, email: user.email, role: user.role, first_name: user.first_name, last_name: user.last_name },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// CURRENT (
router.get('/current', passport.authenticate('current', { session: false }), (req, res) => {
  
  const { password, ...safeUser } = req.user; 
  return res.json({ status: 'success', payload: safeUser });
});

module.exports = router;
