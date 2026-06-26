/* =====================================================
   EDUQUEST — core/auth.js
   Autenticación JWT (API) + perfil local (gamificación)
   ===================================================== */

const EQ_Auth = (() => {

  const PROTECTED = [
    'app.html', 'dashboard.html', 'profile.html', 'subjects.html',
    'subject-detail.html', 'quiz.html', 'ranking.html',
    'achievements.html', 'settings.html', 'games.html',
  ];

  const PUBLIC_ONLY = ['login.html', 'register.html'];

  const guard = () => {
    const page = window.location.pathname.split('/').pop();
    const loggedIn = EQ_Storage.isLoggedIn();

    if (PROTECTED.includes(page) && !loggedIn) {
      const base = page === 'app.html' ? 'login.html' : '../pages/login.html';
      window.location.href = base;
      return false;
    }
    if (PUBLIC_ONLY.includes(page) && loggedIn) {
      window.location.href = 'app.html';
      return false;
    }
    return true;
  };

  /** Login contra API MySQL + JWT */
  const loginApi = async (email, matricula_code) => {
    if (!email || !isValidEmail(email))
      return { ok: false, error: 'Correo electrónico inválido.' };
    if (!matricula_code?.trim())
      return { ok: false, error: 'Ingresa tu código de matrícula.' };

    try {
      const data = await EQ_API.login(email.trim(), matricula_code.trim());

      EQ_Storage.setAuth({
        token: data.token,
        role:  data.role,
        email: data.user?.email || email,
      });

      const localUser = EQ_Storage.ensureApiUser({
        apiId:          data.user?.id,
        email:          data.user?.email || email,
        role:           data.role,
        matricula_code: data.user?.matricula_code || matricula_code,
      });

      EQ_Storage.setSession(localUser);
      EQ_Storage.updateStreak(localUser.id);

      return { ok: true, user: localUser, role: data.role, token: data.token };
    } catch (err) {
      if (err.status === 401) return { ok: false, error: 'Correo o código de matrícula incorrectos.' };
      if (err.status === 400) return { ok: false, error: err.data?.error || 'Datos incompletos.' };
      return { ok: false, error: 'No se pudo conectar con el servidor. ¿Está activo el backend?' };
    }
  };

  const register = (name, email, password, avatarIndex) => {
    if (!name || name.trim().length < 2)
      return { ok: false, error: 'El nombre debe tener al menos 2 caracteres.' };
    if (!email || !isValidEmail(email))
      return { ok: false, error: 'Ingresa un correo electrónico válido.' };
    if (!password || password.length < 6)
      return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };

    const result = EQ_Storage.createUser({ name, email, password, avatar: avatarIndex || 0 });
    if (!result.ok) return result;

    EQ_Storage.setSession(result.user);
    EQ_Storage.updateStreak(result.user.id);
    return { ok: true, user: result.user };
  };

  /** @deprecated Usar loginApi — conservado para compatibilidad local */
  const login = (email, password) => {
    if (!email || !isValidEmail(email))
      return { ok: false, error: 'Correo electrónico inválido.' };
    if (!password)
      return { ok: false, error: 'Ingresa tu contraseña.' };

    const user = EQ_Storage.findUser(email);
    if (!user) return { ok: false, error: 'No existe una cuenta con ese correo.' };
    if (user.password !== password) return { ok: false, error: 'Contraseña incorrecta.' };

    EQ_Storage.setSession(user);
    EQ_Storage.updateStreak(user.id);
    return { ok: true, user };
  };

  const logout = () => {
    EQ_Storage.clearAuth();
    EQ_Storage.clearSession();
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? '../index.html' : 'index.html';
  };

  const getUser = () => {
    const session = EQ_Storage.getSession();
    if (session) {
      const fresh = EQ_Storage.findUserById(session.id);
      if (fresh) return { ...fresh, role: fresh.role || EQ_Storage.getRole() };
    }

    const email = EQ_Storage.getAuthEmail();
    if (email && EQ_Storage.getToken()) {
      const user = EQ_Storage.findUser(email);
      if (user) {
        EQ_Storage.setSession(user);
        return { ...user, role: user.role || EQ_Storage.getRole() };
      }
    }
    return null;
  };

  const getRole = () => EQ_Storage.getRole() || getUser()?.role || null;

  const getToken = () => EQ_Storage.getToken();

  const updateProfile = (patch) => {
    const user = getUser();
    if (!user) return { ok: false, error: 'No hay sesión activa.' };
    const updated = EQ_Storage.updateUser(user.id, patch);
    return updated ? { ok: true, user: updated } : { ok: false, error: 'Error al actualizar perfil.' };
  };

  const changePassword = (currentPwd, newPwd) => {
    const user = getUser();
    if (!user) return { ok: false, error: 'Sin sesión.' };
    if (user.password && user.password !== currentPwd)
      return { ok: false, error: 'Contraseña actual incorrecta.' };
    if (newPwd.length < 6)
      return { ok: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    return EQ_Storage.updateUser(user.id, { password: newPwd })
      ? { ok: true } : { ok: false, error: 'Error al cambiar contraseña.' };
  };

  const deleteAccount = () => {
    const user = getUser();
    if (!user) return;
    EQ_Storage.deleteUser(user.id);
    EQ_Storage.clearAuth();
    window.location.href = '../index.html';
  };

  const resetProgress = () => {
    const user = getUser();
    if (!user) return;
    EQ_Storage.updateUser(user.id, {
      xp: 0, level: 1, streak: 0,
      badges: [], achievements: [], history: [],
      stats: {
        totalQuizzes: 0, totalQuestions: 0, totalCorrect: 0,
        perfectQuizzes: 0, fastCorrect: 0, totalXP: 0,
        xpBySubject:      { matematica: 0, lengua: 0, fisica: 0, quimica: 0, biologia: 0 },
        quizzesBySubject: { matematica: 0, lengua: 0, fisica: 0, quimica: 0, biologia: 0 },
        progressBySubject:{ matematica: 0, lengua: 0, fisica: 0, quimica: 0, biologia: 0 },
      },
    });
  };

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  return {
    guard, register, login, loginApi, logout,
    getUser, getRole, getToken,
    updateProfile, changePassword,
    deleteAccount, resetProgress,
  };
})();

window.EQ_Auth = EQ_Auth;

document.addEventListener('DOMContentLoaded', () => EQ_Auth.guard());
