/* =====================================================
   EDUQUEST — core/storage.js
   Persistencia + validación de integridad anti-trampas
   ===================================================== */

const EQ_Storage = (() => {

  const KEYS = {
    CURRENT_USER: 'eq_current_user',
    USERS:        'eq_users',
    SETTINGS:     'eq_settings',
    AUTH_TOKEN:   'eq_auth_token',
    AUTH_ROLE:    'eq_auth_role',
    AUTH_EMAIL:   'eq_auth_email',
  };

  const INTEGRITY_SALT = 'eq_bach_2026_integrity';

  const get = (key) => {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch { return null; }
  };

  const set = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  };

  const remove = (key) => localStorage.removeItem(key);

  /* ─── INTEGRIDAD ─── */
  const hashUser = (user) => {
    const payload = [
      user.id,
      user.xp,
      user.level,
      user.streak,
      user.stats?.totalQuizzes || 0,
      user.stats?.totalCorrect || 0,
      user.stats?.totalXP || 0,
      (user.achievements || []).length,
      INTEGRITY_SALT,
    ].join('|');

    let hash = 5381;
    for (let i = 0; i < payload.length; i++) {
      hash = ((hash << 5) + hash) + payload.charCodeAt(i);
      hash |= 0;
    }
    return 'eq_' + Math.abs(hash).toString(36);
  };

  const attachIntegrity = (user) => ({
    ...user,
    _checksum: hashUser(user),
    _checksumAt: new Date().toISOString(),
  });

  const validateUser = (user) => {
    if (!user || !user.id) return { valid: false, reason: 'Usuario inválido' };
    if (!user._checksum) return { valid: true, legacy: true };

    const expected = hashUser({ ...user, _checksum: undefined, _checksumAt: undefined });
    if (user._checksum === expected) return { valid: true };

    return {
      valid: false,
      reason: 'Datos manipulados detectados',
      expected,
      actual: user._checksum,
    };
  };

  const sanitizeUser = (user) => {
    const stats = user.stats || {};
    const recalculatedLevel = EQ_Progression.calculateLevel(user.xp || 0);
    const totalFromSubjects = Object.values(stats.xpBySubject || {}).reduce((a, b) => a + b, 0);
    const safeXP = Math.min(user.xp || 0, Math.max(totalFromSubjects, stats.totalXP || 0) + 500);

    return attachIntegrity({
      ...user,
      xp: safeXP,
      level: recalculatedLevel,
      stats: {
        ...stats,
        totalXP: Math.min(stats.totalXP || 0, safeXP),
      },
    });
  };

  const validateAllUsers = () => {
    const users = getUsers();
    let tampered = 0;

    const fixed = users.map(user => {
      const check = validateUser(user);
      if (!check.valid) {
        tampered++;
        return sanitizeUser(user);
      }
      if (check.legacy) return attachIntegrity(user);
      return user;
    });

    if (tampered > 0) {
      saveUsers(fixed);
      EQ_EventBus?.emit('data:tampered', { count: tampered });
    }

    return { tampered, users: fixed };
  };

  /* ─── USERS ─── */
  const getUsers = () => get(KEYS.USERS) || [];

  const saveUsers = (users) => set(KEYS.USERS, users);

  const findUser = (email) =>
    getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());

  const findUserById = (id) => getUsers().find(u => u.id === id);

  const findUserByApiId = (apiId) =>
    getUsers().find(u => u.apiId === apiId || u.apiId === String(apiId));

  const defaultStats = () => ({
    totalQuizzes: 0, totalQuestions: 0, totalCorrect: 0,
    perfectQuizzes: 0, fastCorrect: 0, totalXP: 0,
    xpBySubject:      { matematica: 0, lengua: 0, fisica: 0, quimica: 0, biologia: 0 },
    quizzesBySubject: { matematica: 0, lengua: 0, fisica: 0, quimica: 0, biologia: 0 },
    progressBySubject:{ matematica: 0, lengua: 0, fisica: 0, quimica: 0, biologia: 0 },
  });

  const createUser = (data) => {
    const users = getUsers();
    if (findUser(data.email)) return { ok: false, error: 'El correo ya está registrado.' };

    const newUser = attachIntegrity({
      id:       crypto.randomUUID(),
      name:     data.name.trim(),
      email:    data.email.trim().toLowerCase(),
      password: data.password,
      avatar:   data.avatar || 0,
      xp:       0,
      level:    1,
      streak:   0,
      lastLogin: null,
      badges:   [],
      achievements: [],
      stats: defaultStats(),
      history: [],
      createdAt: new Date().toISOString(),
    });

    users.push(newUser);
    saveUsers(users);
    return { ok: true, user: newUser };
  };

  const ensureApiUser = ({ apiId, email, role, matricula_code }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = findUser(normalizedEmail);

    if (existing) {
      return updateUser(existing.id, { apiId, role, matricula_code, email: normalizedEmail });
    }

    const nameFromEmail = normalizedEmail.split('@')[0]
      .replace(/[._-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    const users = getUsers();
    const newUser = attachIntegrity({
      id:            crypto.randomUUID(),
      apiId,
      name:          role === 'teacher' ? 'Profesor Admin' : nameFromEmail,
      email:         normalizedEmail,
      role,
      matricula_code,
      password:      '',
      avatar:        role === 'teacher' ? 1 : 0,
      xp:            0,
      level:         1,
      streak:        0,
      lastLogin:     null,
      badges:        [],
      achievements:  [],
      stats:         defaultStats(),
      history:       [],
      createdAt:     new Date().toISOString(),
    });

    users.push(newUser);
    saveUsers(users);
    return newUser;
  };

  const updateUser = (id, patch) => {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return false;

    const merged = deepMerge(users[idx], patch);
    merged.level = EQ_Progression.calculateLevel(merged.xp || 0);
    users[idx] = attachIntegrity(merged);
    saveUsers(users);

    const session = getSession();
    if (session && session.id === id) {
      set(KEYS.CURRENT_USER, users[idx]);
    }
    return users[idx];
  };

  const deleteUser = (id) => {
    saveUsers(getUsers().filter(u => u.id !== id));
    if (getSession()?.id === id) clearSession();
  };

  /* ─── SESSION ─── */
  const getSession = () => {
    const session = get(KEYS.CURRENT_USER);
    if (!session) return null;

    const fresh = findUserById(session.id);
    if (!fresh) { clearSession(); return null; }

    const check = validateUser(fresh);
    if (!check.valid) {
      const fixed = sanitizeUser(fresh);
      const users = getUsers();
      const idx = users.findIndex(u => u.id === fixed.id);
      if (idx !== -1) { users[idx] = fixed; saveUsers(users); }
      set(KEYS.CURRENT_USER, fixed);
      EQ_EventBus?.emit('data:tampered', { count: 1, userId: fixed.id });
      return fixed;
    }
    return fresh;
  };

  const setSession = (user) => set(KEYS.CURRENT_USER, attachIntegrity(user));
  const clearSession = () => remove(KEYS.CURRENT_USER);

  /* ─── JWT / API SESSION ─── */
  const getToken  = () => localStorage.getItem(KEYS.AUTH_TOKEN);
  const getRole   = () => localStorage.getItem(KEYS.AUTH_ROLE);
  const getAuthEmail = () => localStorage.getItem(KEYS.AUTH_EMAIL);

  const setAuth = ({ token, role, email }) => {
    if (token) localStorage.setItem(KEYS.AUTH_TOKEN, token);
    if (role)  localStorage.setItem(KEYS.AUTH_ROLE, role);
    if (email) localStorage.setItem(KEYS.AUTH_EMAIL, email.toLowerCase());
  };

  const clearAuth = () => {
    remove(KEYS.AUTH_TOKEN);
    remove(KEYS.AUTH_ROLE);
    remove(KEYS.AUTH_EMAIL);
  };

  const isLoggedIn = () => {
    if (!getToken()) return false;
    if (getSession()) return true;
    const email = getAuthEmail();
    const user = email ? findUser(email) : null;
    if (user) { setSession(user); return true; }
    return false;
  };

  /* ─── SETTINGS ─── */
  const getSettings = () => get(KEYS.SETTINGS) || {
    theme: 'light', sounds: true, animations: true, language: 'es',
  };

  const saveSettings = (patch) => {
    const settings = { ...getSettings(), ...patch };
    set(KEYS.SETTINGS, settings);
    return settings;
  };

  const addHistoryEntry = (userId, entry) =>
    updateUser(userId, {
      history: [
        { ...entry, date: new Date().toISOString() },
        ...(findUserById(userId)?.history || []).slice(0, 49),
      ],
    });

  const updateStreak = (userId) => {
    const user = findUserById(userId);
    if (!user) return;

    const today = new Date().toDateString();
    const lastLogin = user.lastLogin ? new Date(user.lastLogin).toDateString() : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    let newStreak = user.streak;
    if (lastLogin === today) {
      // sin cambio
    } else if (lastLogin === yesterday) {
      newStreak = user.streak + 1;
    } else if (!lastLogin) {
      newStreak = 1;
    } else {
      newStreak = 1;
    }

    updateUser(userId, { streak: newStreak, lastLogin: new Date().toISOString() });
    return newStreak;
  };

  const deepMerge = (target, source) => {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  };

  /* Validar al cargar */
  if (typeof EQ_EventBus !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => validateAllUsers());
  }

  return {
    getUsers, saveUsers, findUser, findUserById, findUserByApiId,
    createUser, ensureApiUser, updateUser, deleteUser,
    getSession, setSession, clearSession, isLoggedIn,
    getToken, getRole, getAuthEmail, setAuth, clearAuth,
    getSettings, saveSettings,
    addHistoryEntry, updateStreak,
    validateUser, validateAllUsers, hashUser,
  };
})();

window.EQ_Storage = EQ_Storage;
