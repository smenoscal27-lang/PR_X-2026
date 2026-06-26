require('dotenv').config();

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { authMiddleware, checkRole } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.SECRET_KEY) {
  console.warn('[EduQuest API] SECRET_KEY no definida. Configura backend/.env');
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'EduQuest API operativa' });
});

app.use('/api/auth', authRoutes);

/* Ruta de ejemplo protegida por rol */
app.get('/api/teacher/dashboard', authMiddleware, checkRole('teacher'), (req, res) => {
  res.json({
    success: true,
    message: 'Panel de profesor',
    userId: req.userId,
    role: req.userRole,
  });
});

app.get('/api/student/dashboard', authMiddleware, checkRole('student'), (req, res) => {
  res.json({
    success: true,
    message: 'Panel de estudiante',
    userId: req.userId,
    role: req.userRole,
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Ruta no encontrada' });
});

app.listen(PORT, () => {
  console.log(`EduQuest API escuchando en http://localhost:${PORT}`);
});
