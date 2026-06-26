const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY;

/**
 * Verifica el JWT en Authorization: Bearer <token>
 * y expone id y rol en req.
 */
const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Token no proporcionado. Use Authorization: Bearer <token>',
    });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, SECRET_KEY);
    req.userId   = payload.id;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      error: 'Token inválido o expirado',
    });
  }
};

/**
 * Fábrica de middleware: permite el paso solo si req.userRole coincide.
 * @param {'student'|'teacher'} role
 */
const checkRole = (role) => (req, res, next) => {
  if (req.userRole !== role) {
    return res.status(403).json({
      success: false,
      error: `Acceso denegado. Se requiere rol: ${role}`,
    });
  }
  next();
};

module.exports = { authMiddleware, checkRole };
