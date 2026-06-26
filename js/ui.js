/* =====================================================
   EDUQUEST — ui.js
   Sidebar, Toast, Modales — escucha EventBus
   ===================================================== */

const EQ_UI = (() => {

  const showToast = ({ type = 'info', icon, title, message, duration = 3000 }) => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type} toast-enter`;
    toast.innerHTML = `
      <span class="toast-icon">${icon || getToastIcon(type)}</span>
      <div class="toast-text">
        ${title ? `<div class="toast-title">${title}</div>` : ''}
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visible'));

    setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  const getToastIcon = (type) => ({
    success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', xp: '⭐', learn: '📚',
  }[type] || '📢');

  const showLearnModal = ({ title, explanation, tip }) => {
    const existing = document.getElementById('eq-learn-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'eq-learn-modal';
    modal.className = 'modal-overlay active learn-modal-overlay';
    modal.innerHTML = `
      <div class="modal learn-modal animate-scale-in">
        <div class="learn-modal-icon">📚</div>
        <div class="modal-title">${title || '¡Oportunidad de aprendizaje!'}</div>
        <p class="modal-desc learn-modal-explanation">${explanation || ''}</p>
        ${tip ? `<div class="learn-modal-tip"><strong>💡 Consejo:</strong> ${tip}</div>` : ''}
        <button class="btn btn-primary btn-lg learn-modal-btn" id="eq-learn-close">Entendido, sigo aprendiendo</button>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#eq-learn-close').onclick = () => modal.remove();
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  };

  const showLevelUp = (levelInfo) => {
    const overlay = document.createElement('div');
    overlay.className = 'level-up-overlay';
    overlay.innerHTML = `
      <div class="level-up-card animate-scale-in">
        <div class="level-up-stars">⭐</div>
        <div class="level-up-badge">${levelInfo.level}</div>
        <div class="level-up-title">¡Subiste de nivel!</div>
        <div class="level-up-name">${levelInfo.icon} ${levelInfo.name}</div>
        <p style="color:var(--text-muted);font-size:0.9rem;margin-bottom:20px">
          Fórmula: Nivel ${levelInfo.level} = ⌊√(${levelInfo.minXP + levelInfo.xpInLevel}/100)⌋ + 1
        </p>
        <button class="btn btn-primary btn-lg" id="level-up-dismiss">¡Increíble! 🎉</button>
      </div>
    `;
    document.body.appendChild(overlay);
    EQ_Gamification.launchConfetti();
    overlay.querySelector('#level-up-dismiss').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  };

  const showXPFloat = (amount) => {
    const el = document.createElement('div');
    el.className = 'xp-float-indicator';
    el.innerHTML = `⭐ +${amount} XP`;
    el.style.left = (window.innerWidth / 2 - 60) + 'px';
    el.style.top = (window.innerHeight / 2) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1200);
  };

  const initEventListeners = () => {
    EQ_EventBus.on('xp:gained', ({ amount }) => showXPFloat(amount));
    EQ_EventBus.on('level:up', showLevelUp);
    EQ_EventBus.on('achievement:unlock', (ach) => {
      showToast({ type: 'xp', icon: ach.icon, title: '¡Logro desbloqueado!', message: ach.name, duration: 4000 });
      EQ_Gamification.launchConfetti();
    });
    EQ_EventBus.on('answer:wrong', ({ question, explanation }) => {
      showLearnModal({
        title: 'No te preocupes, aprendemos juntos',
        explanation: explanation || question,
        tip: 'Revisa la explicación y vuelve a intentarlo. Cada error te acerca al dominio.',
      });
      showToast({ type: 'learn', title: 'Respuesta incorrecta', message: 'Lee la explicación para reforzar el concepto.', duration: 3500 });
    });
    EQ_EventBus.on('data:tampered', ({ count }) => {
      showToast({
        type: 'warning',
        title: 'Integridad de datos',
        message: `Se detectaron ${count} registro(s) manipulado(s). Los puntajes fueron corregidos.`,
        duration: 6000,
      });
    });
    EQ_EventBus.on('toast:show', showToast);
  };

  const initSidebar = () => {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const hamburger = document.getElementById('hamburger-btn');
    if (!sidebar) return;

    hamburger?.addEventListener('click', () => toggleSidebar());
    overlay?.addEventListener('click', () => closeSidebar());

    let touchStartX = 0;
    sidebar.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
    sidebar.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientX - touchStartX < -80) closeSidebar();
    });
  };

  const toggleSidebar = () => {
    document.getElementById('sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('active');
  };

  const closeSidebar = () => {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('active');
  };

  const populateSidebar = (user) => {
    if (!user) return;
    const levelInfo = EQ_Gamification.getLevelInfo(user.xp);
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    set('sb-user-name', user.name);
    set('sb-user-level', `Nivel ${levelInfo.level} · ${levelInfo.name}`);
    set('sb-user-xp', `${user.xp} XP`);
    const avatarEl = document.getElementById('sb-user-avatar');
    if (avatarEl) avatarEl.textContent = EQ_DATA.avatars[user.avatar] || '🧑‍💻';

    const xpFill = document.getElementById('sb-xp-fill');
    if (xpFill) xpFill.style.width = `${levelInfo.progress}%`;
    set('sb-xp-val', `${user.xp} XP`);
    set('sb-xp-text', levelInfo.xpToNext > 0
      ? `Nivel ${levelInfo.level + 1} en ${levelInfo.xpToNext} XP`
      : '¡Nivel máximo alcanzado!');
  };

  const populateTopbar = (user) => {
    if (!user) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('topbar-xp', `⭐ ${user.xp} XP`);
    set('topbar-streak', `🔥 ${user.streak} días`);

    const role = user.role || EQ_Storage.getRole();
    const roleEl = document.getElementById('topbar-role');
    if (roleEl && role) {
      roleEl.textContent = role === 'teacher' ? '👨‍🏫 Profesor' : '🎓 Estudiante';
      roleEl.style.display = 'inline-flex';
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('eq_theme', theme);
  };

  const loadTheme = () => applyTheme(EQ_Storage.getSettings().theme || 'light');

  const initScrollReveal = () => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('animated'); observer.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.will-animate').forEach(el => observer.observe(el));
  };

  const animateProgress = (el, pct, delay = 0) => {
    if (!el) return;
    el.style.width = '0%';
    setTimeout(() => { el.style.width = pct + '%'; }, delay + 100);
  };

  const animateCounter = (el, target, duration = 1000) => {
    if (!el) return;
    const start = performance.now();
    const update = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))).toLocaleString('es');
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  };

  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
  };

  const closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
  };

  const initModals = () => {
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay.id); });
    });
    document.querySelectorAll('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', () => openModal(btn.dataset.openModal));
    });
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
    });
  };

  const confirm = (message, onConfirm) => {
    const modal = document.createElement('div');
    modal.id = 'eq-confirm-modal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal animate-scale-in">
        <div class="modal-title">⚠️ Confirmar acción</div>
        <p class="modal-desc">${message}</p>
        <div style="display:flex;gap:12px;justify-content:flex-end">
          <button class="btn btn-ghost" id="eq-confirm-cancel">Cancelar</button>
          <button class="btn btn-danger" id="eq-confirm-ok">Confirmar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    modal.querySelector('#eq-confirm-cancel').onclick = () => modal.remove();
    modal.querySelector('#eq-confirm-ok').onclick = () => { modal.remove(); onConfirm(); };
  };

  const initLogout = () => {
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', () => confirm('¿Seguro que deseas cerrar sesión?', () => EQ_Auth.logout()));
    });
  };

  const addRipple = (el) => {
    el.classList.add('ripple-container');
    el.addEventListener('click', e => {
      const rect = el.getBoundingClientRect();
      const r = document.createElement('span');
      r.className = 'ripple-effect';
      const size = Math.max(rect.width, rect.height);
      r.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size/2}px;top:${e.clientY - rect.top - size/2}px`;
      el.appendChild(r);
      setTimeout(() => r.remove(), 600);
    });
  };

  const initRouterNav = () => {
    document.querySelectorAll('[data-route]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        EQ_Router?.navigate(link.dataset.route);
        closeSidebar();
      });
    });
  };

  const setActiveNav = (route) => {
    document.querySelectorAll('[data-route]').forEach(link => {
      link.classList.toggle('active', link.dataset.route === route);
    });
  };

  const init = (user) => {
    loadTheme();
    initEventListeners();
    initSidebar();
    initModals();
    initLogout();
    initRouterNav();
    initScrollReveal();
    if (user) { populateSidebar(user); populateTopbar(user); }
    document.querySelectorAll('.btn').forEach(addRipple);
  };

  return {
    showToast, showLearnModal, showLevelUp, showXPFloat,
    initSidebar, toggleSidebar, closeSidebar,
    populateSidebar, populateTopbar, setActiveNav,
    applyTheme, loadTheme, initScrollReveal,
    animateProgress, animateCounter,
    openModal, closeModal, initModals, confirm, initLogout, addRipple, init,
  };
})();

window.EQ_UI = EQ_UI;
