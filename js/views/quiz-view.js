/* =====================================================
   EDUQUEST — views/quiz-view.js
   Vista de quiz integrada en el router SPA
   ===================================================== */

const EQ_QuizView = (() => {

  const render = (container, params = {}) => {
    const user = EQ_Auth.getUser();
    if (!user) return;

    const subject = params.subject || 'matematica';
    const mode = params.mode || 'quiz';
    const sub = EQ_DATA.subjects[subject];

    container.innerHTML = `
      <div class="quiz-page-inline">
        <div class="quiz-topbar-inline">
          <button class="btn btn-ghost btn-sm" data-route="dashboard"><i class="fas fa-arrow-left"></i> Salir</button>
          <div class="quiz-subject-label" id="quiz-subject-name">${sub?.icon || ''} ${sub?.name || subject}</div>
          <div class="quiz-stats-row">
            <div class="quiz-stat-chip" style="background:var(--secondary-light);color:var(--secondary-dark)">✅ <span id="quiz-correct-count">0</span></div>
            <div class="quiz-stat-chip" style="background:var(--danger-light);color:#991B1B">❌ <span id="quiz-wrong-count">0</span></div>
            <div class="quiz-stat-chip" style="background:var(--primary-light);color:var(--primary)">⭐ <span id="quiz-score-display">0 pts</span></div>
          </div>
        </div>

        <div class="quiz-progress-bar"><div class="progress-fill" id="quiz-progress-fill" style="width:0%"></div></div>

        <div class="quiz-card" id="quiz-main-area">
          <div class="quiz-header-row">
            <span id="quiz-question-num">Pregunta 1</span>
            <div class="quiz-timer" id="quiz-timer">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="var(--gray-200)" stroke-width="6"/>
                <circle id="quiz-timer-circle" cx="40" cy="40" r="35" fill="none" stroke="var(--primary)" stroke-width="6"
                  stroke-dasharray="220" stroke-dashoffset="0" transform="rotate(-90 40 40)" style="transition:stroke-dashoffset 1s linear"/>
              </svg>
              <span id="quiz-timer-val">20</span>
            </div>
          </div>
          <h2 class="quiz-question-text" id="quiz-question-text">Cargando...</h2>
          <div id="quiz-options-area"></div>
          <div id="quiz-explanation" style="display:none"></div>
        </div>
      </div>
    `;

    EQ_UI.init(user);
    container.querySelector('[data-route="dashboard"]')?.addEventListener('click', e => {
      e.preventDefault(); EQ_Router.navigate('dashboard');
    });

    const url = new URL(window.location.href);
    url.searchParams.set('subject', subject);
    url.searchParams.set('mode', mode);
    window.history.replaceState({}, '', `#/quiz?subject=${subject}&mode=${mode}`);

    EQ_Quiz.initWithParams({ subject, mode });
  };

  return { render, destroy: () => EQ_Quiz?.destroy?.() };
})();

window.EQ_QuizView = EQ_QuizView;
