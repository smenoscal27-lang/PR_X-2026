const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();
const SECRET_KEY = process.env.SECRET_KEY;

/**
 * POST /api/auth/login
 * Body: { email, matricula_code }
 */
router.post('/login', async (req, res) => {
  const { email, matricula_code } = req.body;

  if (!email || !matricula_code) {
    return res.status(400).json({
      success: false,
      error: 'Los campos email y matricula_code son obligatorios',
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT id, email, role, matricula_code
       FROM users
       WHERE email = ? AND matricula_code = ?
       LIMIT 1`,
      [email.trim().toLowerCase(), matricula_code.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
      });
    }

    const user = rows[0];

    const token = jwt.sign(
      { id: user.id, role: user.role },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      success: true,
      token,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        matricula_code: user.matricula_code,
      },
    });
  } catch (err) {
    console.error('[POST /api/auth/login]', err.message);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
    });
  }
});

/** GET /api/auth/me — usuario autenticado desde JWT */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, email, role, matricula_code FROM users WHERE id = ? LIMIT 1`,
      [req.userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    return res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('[GET /api/auth/me]', err.message);
    return res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

module.exports = router;
