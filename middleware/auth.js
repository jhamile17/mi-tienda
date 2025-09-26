const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'mi_secreto_ultra_seguro';

function isAuthenticated(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.redirect('/login?mensaje=Por favor inicia sesión');
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login?mensaje=Sesión expirada, inicia sesión de nuevo');
  }
}

module.exports = isAuthenticated;
