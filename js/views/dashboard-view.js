/* =====================================================
   EDUQUEST — views/dashboard-view.js
   Dashboard + sección Benchmark (Duolingo/Quizlet/Kahoot)
   ===================================================== */

const EQ_DashboardView = (() => {

  const BENCHMARK_MODES = [
    {
      id: 'duolingo',
      route: 'modes/duolingo',
      brand: 'Duolingo',
      icon: '🦉',
      color: 'linear-gradient(135deg,#58CC02,#46A302)',
      title: 'Ruta de Progresión',
      desc: 'Camino visual con rachas diarias y metas XP. Inspirado en Duolingo.',
      tags: ['Rachas', 'Niveles', 'Meta diaria'],
    },
    {
      id: 'quizlet',
      route: 'modes/quizlet',
      brand: 'Quizlet',
      icon: '🃏',
      color: 'linear-gradient(135deg,#4255FF,#2D3BFF)',
      title: 'Asociar Conceptos',
      desc: 'Empareja términos y definiciones. Mecánica tipo Quizlet Match.',
      tags: ['Memoria', 'Parejas', 'Flashcards'],
    },
    {
      id: 'kahoot',
      route: 'modes/kahoot',
      brand: 'Kahoot',
      icon: '⚡',
      color: 'linear-gradient(135deg,#46178F,#7B2FF7)',
      title: 'Competencia Rápida',
      desc: 'Quiz contra el reloj con puntos por velocidad. Estilo Kahoot.',
      tags: ['Timer', 'Puntos', 'Competencia'],
    },
  ];

  const render = (container) => {
    const user = EQ_Auth.getUser();
    if (!user) return;

    const levelInfo = EQ_Gamification.getLevelInfo(user.xp);
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

    container.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" id="hamburger-btn"><i class="fas fa-bars"></i></button>
          <div>
            <div class="topbar-title">Dashboard</div>
            <div class="topbar-subtitle" id="topbar-greeting">${greet}, ${user.name.split(' ')[0]} 👋</div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-chip" id="topbar-role" style="background:var(--accent-light);color:var(--accent)">${user.role === 'teacher' ? '👨‍🏫 Profesor' : '🎓 Estudiante'}</div>
          <div class="topbar-chip xp" id="topbar-xp">⭐ ${user.xp} XP</div>
          <div class="topbar-chip streak" id="topbar-streak">🔥 ${user.streak} días</div>
        </div>
      </header>

      <div class="page-content view-enter">
        <div class="card hero-card">
          <div class="hero-card-content">
            <div>
              <div class="hero-eyebrow">¡Bienvenido de vuelta!</div>
              <h1 class="hero-title" id="hero-name">¡Hola, ${user.name}!</h1>
              <div class="hero-badges-row">
                <div class="level-badge" id="hero-level-badge">Nivel ${levelInfo.level} · ${levelInfo.icon} ${levelInfo.name}</div>
                <div class="xp-chip" id="hero-xp-chip">⭐ ${user.xp} XP</div>
              </div>
              <div class="hero-progress-wrap">
                <div class="hero-progress-labels">
                  <span>Progreso al nivel ${levelInfo.level + 1}</span>
                  <span id="hero-xp-to-next">${levelInfo.xpToNext > 0 ? `${levelInfo.xpToNext} XP restante` : '¡Nivel máximo!'}</span>
                </div>
                <div class="progress-track hero-progress-track">
                  <div class="progress-fill" id="hero-progress-fill" style="width:0%"></div>
                </div>
              </div>
            </div>
            <div class="hero-avatar" id="hero-avatar">${EQ_DATA.avatars[user.avatar] || '🧑‍💻'}</div>
          </div>
        </div>

        <div class="stats-grid">
          <div class="stat-card will-animate"><div class="stat-card-icon" style="background:var(--primary-light)">🔢</div><div><div class="stat-card-value" id="stat-quizzes">0</div><div class="stat-card-label">Quizzes Completados</div></div></div>
          <div class="stat-card will-animate delay-1"><div class="stat-card-icon" style="background:var(--secondary-light)">✅</div><div><div class="stat-card-value" id="stat-accuracy">0%</div><div class="stat-card-label">Precisión</div></div></div>
          <div class="stat-card will-animate delay-2"><div class="stat-card-icon" style="background:var(--warning-light)">🔥</div><div><div class="stat-card-value" id="stat-streak">0</div><div class="stat-card-label">Días de Racha</div></div></div>
          <div class="stat-card will-animate delay-3"><div class="stat-card-icon" style="background:var(--accent-light)">🏆</div><div><div class="stat-card-value" id="stat-achievements">0</div><div class="stat-card-label">Logros</div></div></div>
        </div>

        <section class="benchmark-section">
          <div class="section-title">
            <div class="section-icon" style="background:var(--accent-light)">🎯</div>
            Modos Benchmark — Arquitectura Unificada
          </div>
          <p class="benchmark-intro">Tres mecánicas inspiradas en líderes del sector, integradas bajo la misma arquitectura técnica de EduQuest.</p>
          <div class="benchmark-grid">
            ${BENCHMARK_MODES.map(m => `
              <article class="benchmark-card will-animate" data-route="${m.route}" style="--bench-gradient:${m.color}">
                <div class="benchmark-brand">${m.brand}</div>
                <div class="benchmark-icon">${m.icon}</div>
                <h3 class="benchmark-title">${m.title}</h3>
                <p class="benchmark-desc">${m.desc}</p>
                <div class="benchmark-tags">${m.tags.map(t => `<span class="tag tag-primary">${t}</span>`).join('')}</div>
                <button class="btn btn-primary btn-block benchmark-btn" data-route="${m.route}">Jugar ahora →</button>
              </article>
            `).join('')}
          </div>
        </section>

        <section style="margin-bottom:32px">
          <div class="section-title"><div class="section-icon" style="background:var(--primary-light);color:var(--primary)">📚</div> Acceso Rápido a Materias</div>
          <div class="subjects-dash" id="subjects-dash"></div>
        </section>

        <div class="two-col-section" id="two-col-section">
          <div class="card">
            <div class="section-title" style="margin-bottom:16px"><div class="section-icon" style="background:var(--warning-light)">🏅</div> Insignias Recientes</div>
            <div class="badges-row" id="badges-row"></div>
          </div>
          <div class="card">
            <div class="section-title" style="margin-bottom:16px"><div class="section-icon" style="background:var(--primary-light);color:var(--primary)">📊</div> Actividad Reciente</div>
            <div class="recent-list" id="recent-list"></div>
          </div>
        </div>
      </div>
    `;

    EQ_UI.init(user);
    EQ_UI.animateProgress(document.getElementById('hero-progress-fill'), levelInfo.progress, 200);
    EQ_UI.animateCounter(document.getElementById('stat-quizzes'), user.stats.totalQuizzes || 0);
    document.getElementById('stat-accuracy').textContent = EQ_Gamification.getAccuracy(user) + '%';
    EQ_UI.animateCounter(document.getElementById('stat-streak'), user.streak || 0);
    EQ_UI.animateCounter(document.getElementById('stat-achievements'), user.achievements?.length || 0);

    renderSubjects(user);
    renderBadges(user);
    renderRecent(user);

    container.querySelectorAll('[data-route]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        EQ_Router.navigate(el.dataset.route);
      });
    });

    if (window.innerWidth < 768) {
      document.getElementById('two-col-section').style.gridTemplateColumns = '1fr';
    }

    requestAnimationFrame(() => {
      container.querySelectorAll('.will-animate').forEach((el, i) => {
        el.style.animationDelay = i * 0.06 + 's';
        el.classList.add('animated');
      });
    });
  };

  const renderSubjects = (user) => {
    const grid = document.getElementById('subjects-dash');
    if (!grid) return;
    Object.values(EQ_DATA.subjects).forEach(sub => {
      const progress = user.stats.progressBySubject[sub.id] || 0;
      const card = document.createElement('a');
      card.href = '#';
      card.className = 'subject-card will-animate';
      card.dataset.route = `quiz?subject=${sub.id}&mode=quiz`;
      card.innerHTML = `
        <div class="subject-card-banner" style="background:${sub.gradient}"><span class="subject-card-icon">${sub.icon}</span></div>
        <div class="subject-card-body">
          <div class="subject-card-title">${sub.name}</div>
          <div class="progress-track" style="margin-bottom:8px"><div class="progress-fill" style="width:${Math.min(progress,100)}%"></div></div>
          <div style="display:flex;justify-content:space-between;font-size:0.78rem;color:var(--text-muted)">
            <span>${Math.min(progress,100).toFixed(0)}% completado</span><span>${user.stats.xpBySubject[sub.id] || 0} XP</span>
          </div>
        </div>
      `;
      card.addEventListener('click', e => { e.preventDefault(); EQ_Router.navigate(card.dataset.route); });
      grid.appendChild(card);
    });
  };

  const renderBadges = (user) => {
    const row = document.getElementById('badges-row');
    if (!row) return;
    if (!user.achievements?.length) {
      row.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem">Aún no tienes insignias. ¡Completa un quiz!</p>';
      return;
    }
    row.innerHTML = user.achievements.slice(0, 6).map(id => {
      const ach = EQ_DATA.achievements.find(a => a.id === id);
      return ach ? `<div class="badge-chip">${ach.icon} ${ach.name}</div>` : '';
    }).join('');
  };

  const renderRecent = (user) => {
    const list = document.getElementById('recent-list');
    if (!list) return;
    if (!user.history?.length) {
      list.innerHTML = '<p style="color:var(--text-muted);font-size:0.88rem">Sin actividad reciente. ¡Juega tu primer quiz!</p>';
      return;
    }
    list.innerHTML = user.history.slice(0, 5).map(entry => {
      const sub = EQ_DATA.subjects[entry.subject];
      const date = new Date(entry.date).toLocaleDateString('es', { day:'2-digit', month:'short' });
      return `<div class="recent-item">
        <div class="recent-icon" style="background:${sub?.gradient || 'var(--primary-light)'}">${sub?.icon || '📚'}</div>
        <div style="flex:1"><div style="font-weight:600;font-size:0.9rem">${entry.subjectName || sub?.name}</div>
        <div style="font-size:0.78rem;color:var(--text-muted)">${entry.correct}/${entry.total} correctas · ${date}</div></div>
        <div class="xp-chip" style="font-size:0.75rem">+${entry.xpGained || 0} XP</div>
      </div>`;
    }).join('');
  };

  const destroy = () => {};

  return { render, destroy };
})();

window.EQ_DashboardView = EQ_DashboardView;
