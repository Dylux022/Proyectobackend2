const { Router } = require('express');
const passport = require('passport');

const User = require('../models/user.model');
const Cart = require('../models/cart.model');

const { createHash, isValidPassword } = require('../utils/hash');
const { generateToken, generateResetToken, verifyResetToken } = require('../utils/jwt');
const { sendMail } = require('../utils/mailer');

const UserCurrentDTO = require('../dtos/userCurrent.dto');

const router = Router();

// -------------------- REGISTER --------------------
router.post('/register', async (req, res) => {
  try {
    const { first_name, last_name, email, age, password, role } = req.body;

    if (!first_name || !last_name || !email || age === undefined || !password) {
      return res.status(400).json({ status: 'error', error: 'Faltan campos obligatorios' });
    }

    const normalizedEmail = email.toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ status: 'error', error: 'Email ya registrado' });

    const newCart = await Cart.create({ products: [] });

    const user = await User.create({
      first_name,
      last_name,
      email: normalizedEmail,
      age,
      password: createHash(password),
      last_password: null,
      cart: newCart._id,
      role: role || 'user',
    });

    return res.status(201).json({
      status: 'success',
      payload: { id: user._id, email: user.email, cart: user.cart, role: user.role },
    });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: err.message });
  }
});

// -------------------- LOGIN (passport-local) --------------------
router.post('/login', passport.authenticate('login', { session: false }), (req, res) => {
  const token = generateToken(req.user);

  res.cookie('accessToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60, // 1 hora
  });

  return res.json({
    status: 'success',
    message: 'Login OK',
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
    },
  });
});

// -------------------- CURRENT (DTO) --------------------
router.get('/current', passport.authenticate('current', { session: false }), (req, res) => {
  const dto = new UserCurrentDTO(req.user);
  return res.json({ status: 'success', payload: dto });
});

// -------------------- LOGOUT --------------------
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  return res.json({ status: 'success', message: 'Logout OK' });
});

// -------------------- FORGOT PASSWORD (manda mail) --------------------
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ status: 'error', error: 'Email requerido' });

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      // ✅ No revelamos si existe o no
      return res.json({ status: 'success', message: 'Si el email existe, se envió un enlace de recuperación' });
    }

    console.log('RESET_TOKEN_EXPIRES runtime =', process.env.RESET_TOKEN_EXPIRES);


    const token = generateResetToken(user);

    const base = process.env.RESET_URL_BASE || 'http://localhost:8080';
    const link = `${base}/api/sessions/reset-password?token=${encodeURIComponent(token)}`;

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.4">
        <h2>Recuperación de contraseña</h2>
        <p>Hacé click en el botón para restablecer tu contraseña. Este enlace expira en ${process.env.RESET_TOKEN_EXPIRES || '1h'}.</p>
        <p>
          <a href="${link}" style="display:inline-block;padding:12px 16px;background:#111;color:#fff;text-decoration:none;border-radius:8px">
            Restablecer contraseña
          </a>
        </p>
        <p>Si no pediste esto, ignorá este correo.</p>
      </div>
    `;

const { previewUrl } = await sendMail({
  to: normalizedEmail,
  subject: 'Recuperación de contraseña',
  html,
});

return res.json({
  status: 'success',
  message: 'Si el email existe, se envió un enlace de recuperación',
  previewUrl, // 👈 link para ver el mail si usas Ethereal
});


    return res.json({ status: 'success', message: 'Si el email existe, se envió un enlace de recuperación' });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: 'Error enviando email', details: err.message });
  }
});

// -------------------- RESET PASSWORD (GET para probar link) --------------------
// Esto te permite abrir el link del mail en el navegador y ver que llegó el token.
// En entrega real podrías redirigir a un front. Acá lo dejamos backend-only.
router.get('/reset-password', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Falta token');

  // mostramos una mini pantalla HTML para poder pegar la nueva pass
  return res.send(`
    <html>
      <body style="font-family: Arial, sans-serif; max-width: 520px; margin: 40px auto;">
        <h2>Restablecer contraseña</h2>
        <form method="POST" action="/api/sessions/reset-password">
          <input type="hidden" name="token" value="${token}" />
          <label>Nueva contraseña</label><br/>
          <input name="newPassword" type="password" style="width:100%;padding:10px;margin:8px 0" required />
          <button style="padding:10px 14px">Cambiar contraseña</button>
        </form>
      </body>
    </html>
  `);
});

// -------------------- RESET PASSWORD (POST) --------------------
// Acepta JSON (Postman) o form (HTML del GET)
router.post('/reset-password', async (req, res) => {
  try {
    const token = req.body.token || req.query.token;
    const newPassword = req.body.newPassword;

    if (!token || !newPassword) {
      return res.status(400).json({ status: 'error', error: 'token y newPassword requeridos' });
    }

    let payload;
    try {
      payload = verifyResetToken(token); // ✅ expira en 1h automáticamente
    } catch (e) {
      return res.status(400).json({ status: 'error', error: 'Token inválido o expirado' });
    }

    const user = await User.findById(payload.id);
    if (!user) return res.status(404).json({ status: 'error', error: 'Usuario no encontrado' });

    // ✅ No permitir misma contraseña anterior (comparar contra hash actual)
    const sameAsCurrent = isValidPassword(newPassword, user);
    if (sameAsCurrent) {
      return res.status(400).json({ status: 'error', error: 'No podés usar la misma contraseña anterior' });
    }

    // guardamos password anterior (hash) y seteamos nuevo hash
    user.last_password = user.password;
    user.password = createHash(newPassword);
    await user.save();

    return res.json({ status: 'success', message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    return res.status(500).json({ status: 'error', error: 'Error reseteando contraseña', details: err.message });
  }
});

module.exports = router;
