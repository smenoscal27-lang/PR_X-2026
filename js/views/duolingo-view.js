/* =====================================================
   EDUQUEST — views/duolingo-view.js
   Ruta de progresión + rachas (inspirado en Duolingo)
   ===================================================== */

const EQ_DuolingoView = (() => {

  const LESSONS = [
    { id: 1, title: 'Fundamentos', xp: 20, icon: '🌱' },
    { id: 2, title: 'Práctica Diaria', xp: 30, icon: '📖' },
    { id: 3, title: 'Desafío Rápido', xp: 40, icon: '⚡' },
    { id: 4, title: 'Repaso Inteligente', xp: 35, icon: '🔄' },
    { id: 5, title: 'Boss Battle', xp: 60, icon: '👑' },
  ];

  const DAILY_GOAL = 50;

  const render = (container) => {
    const user = EQ_Auth.getUser();
    if (!user) return;

    const todayXP = (user.history || [])
      .filter(h => new Date(h.date).toDateString() === new Date().toDateString())
      .reduce((s, h) => s + (h.xpGained || 0), 0);

    const goalPct = Math.min(100, (todayXP / DAILY_GOAL) * 100);
    const completedLessons = Math.min(LESSONS.length, Math.floor((user.stats?.totalQuizzes || 0) / 2));

    container.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" id="hamburger-btn"><i class="fas fa-bars"></i></button>
          <div>
            <div class="topbar-title">🦉 Ruta Duolingo</div>
            <div class="topbar-subtitle">Progresión visual y rachas diarias</div>
          </div>
        </div>
        <div class="topbar-right">
          <button class="btn btn-ghost btn-sm" data-route="dashboard">← Dashboard</button>
        </div>
      </header>
      <div class="page-content view-enter">
        <div class="card duolingo-hero" style="background:linear-gradient(135deg,#58CC02,#46A302);color:white;border:none;margin-bottom:24px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px">
            <div>
              <div style="font-size:0.8rem;opacity:0.8;text-transform:uppercase;letter-spacing:0.1em">Meta diaria</div>
              <div style="font-family:var(--font-heading);font-size:2rem;font-weight:900">${todayXP} / ${DAILY_GOAL} XP</div>
              <div class="progress-track" style="margin-top:12px;max-width:280px;background:rgba(255,255,255,0.2)">
                <div class="progress-fill" style="width:${goalPct}%;background:white"></div>
              </div>
            </div>
            <div style="text-align:center">
              <div style="font-size:3rem">🔥</div>
              <div style="font-family:var(--font-heading);font-weight:800;font-size:1.5rem">${user.streak} días</div>
              <div style="font-size:0.85rem;opacity:0.8">Racha activa</div>
            </div>
          </div>
        </div>

        <div class="duolingo-path">
          ${LESSONS.map((lesson, i) => {
            const done = i < completedLessons;
            const active = i === completedLessons;
            return `
              <div class="path-node ${done ? 'done' : ''} ${active ? 'active' : ''}" data-lesson="${lesson.id}">
                <div class="path-connector ${i === 0 ? 'hidden' : ''}"></div>
                <button class="path-circle ${done ? 'done' : ''} ${active ? 'active' : ''}" ${!done && !active ? 'disabled' : ''}>
                  ${done ? '✓' : lesson.icon}
                </button>
                <div class="path-label">
                  <strong>${lesson.title}</strong>
                  <span>+${lesson.xp} XP</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="text-align:center;margin-top:32px">
          <button class="btn btn-primary btn-xl" id="start-lesson" style="background:linear-gradient(135deg,#58CC02,#46A302)">
            ${completedLessons < LESSONS.length ? 'Continuar lección' : 'Repasar todo'} →
          </button>
        </div>
      </div>
    `;

    EQ_UI.init(user);
    container.querySelector('[data-route="dashboard"]')?.addEventListener('click', e => {
      e.preventDefault(); EQ_Router.navigate('dashboard');
    });
    container.querySelector('#start-lesson')?.addEventListener('click', () => {
      EQ_Router.navigate('quiz?subject=matematica&mode=quiz');
    });
  };

  return { render, destroy: () => {} };
})();

window.EQ_DuolingoView = EQ_DuolingoView;
