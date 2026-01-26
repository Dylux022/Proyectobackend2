const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/user.model');
const { JWT_SECRET } = require('../utils/jwt');

const initializePassport = () => {
  passport.use(
    'current',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: JWT_SECRET,
      },
      async (jwt_payload, done) => {
        try {
          const user = await User.findById(jwt_payload.id).lean();
          if (!user) return done(null, false);
          return done(null, user); // user disponible en req.user
        } catch (err) {
          return done(err);
        }
      }
    )
  );
};

module.exports = { initializePassport };
