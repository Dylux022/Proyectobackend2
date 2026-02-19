const passport = require('passport');
const { Strategy: JwtStrategy } = require('passport-jwt');
const { Strategy: LocalStrategy } = require('passport-local');

const User = require('../models/user.model');
const { isValidPassword } = require('../utils/hash');
const { JWT_SECRET } = require('../utils/jwt');

// ✅ Lee token desde cookie accessToken
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) token = req.cookies.accessToken || null;
  return token;
};

const initializePassport = () => {
  // ✅ LOCAL strategy para login
  passport.use(
    'login',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email: email.toLowerCase() });
          if (!user) return done(null, false);

          const ok = isValidPassword(password, user);
          if (!ok) return done(null, false);

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // ✅ JWT strategy para /current
  passport.use(
    'current',
    new JwtStrategy(
      {
        jwtFromRequest: cookieExtractor,
        secretOrKey: JWT_SECRET,
      },
      async (jwt_payload, done) => {
        try {
          const user = await User.findById(jwt_payload.id).lean();
          if (!user) return done(null, false);
          return done(null, user);
        } catch (err) {
          return done(err, false);
        }
      }
    )
  );
};

module.exports = { initializePassport };
