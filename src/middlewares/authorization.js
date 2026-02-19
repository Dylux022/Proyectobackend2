const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', error: 'No autenticado' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', error: 'No autorizado' });
    }

    next();
  };
};

module.exports = { authorizeRoles };
