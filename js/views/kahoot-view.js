/* =====================================================
   EDUQUEST — views/kahoot-view.js
   Competencia por tiempo (inspirado en Kahoot)
   ===================================================== */

const EQ_KahootView = (() => {

  let timer = null;
  let state = {};

  const COLORS = ['#E21B3C', '#1368CE', '#D89E00', '#26890C'];

  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const getQuestions = () => {
    const pool = Object.values(EQ_DATA.questions).flat().filter(q => q.type === 'quiz');
    return shuffle(pool).slice(0, 5);
  };

  const render = (container) => {
    const user = EQ_Auth.getUser();
    if (!user) return;

    state = {
      questions: getQuestions(),
      current: 0,
      score: 0,
      correct: 0,
      timeLeft: 15,
      phase: 'intro',
    };

    container.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" id="hamburger-btn"><i class="fas fa-bars"></i></button>
          <div><div class="topbar-title">⚡ Kahoot Rush</div><div class="topbar-subtitle">Competencia por tiempo</div></div>
        </div>
        <div class="topbar-right">
          <button class="btn btn-ghost btn-sm" data-route="dashboard">← Dashboard</button>
          <div class="topbar-chip xp" id="kahoot-score">0 pts</div>
        </div>
      </header>
      <div class="page-content view-enter">
        <div class="card kahoot-stage" id="kahoot-stage"></div>
      </div>
    `;

    EQ_UI.init(user);
    container.querySelector('[data-route="dashboard"]')?.addEventListener('click', e => {
      e.preventDefault(); EQ_Router.navigate('dashboard');
    });

    renderIntro(container);
  };

  const renderIntro = (container) => {
    const stage = container.querySelector('#kahoot-stage');
    stage.innerHTML = `
      <div class="kahoot-intro animate-scale-in">
        <div style="font-size:4rem;margin-bottom:16px">⚡</div>
        <h2 style="font-family:var(--font-heading);font-size:2rem;font-weight:900;color:white;margin-bottom:12px">¡Listo para competir!</h2>
        <p style="color:rgba(255,255,255,0.7);margin-bottom:32px">${state.questions.length} preguntas · 15 segundos cada una · Más rápido = más puntos</p>
        <button class="btn btn-warning btn-xl" id="kahoot-start">¡Empezar! 🚀</button>
      </div>
    `;
    stage.querySelector('#kahoot-start').onclick = () => renderQuestion(container);
  };

  const renderQuestion = (container) => {
    clearInterval(timer);
    const q = state.questions[state.current];
    if (!q) return renderResults(container);

    state.timeLeft = 15;
    const stage = container.querySelector('#kahoot-stage');
    const letters = ['▲', '◆', '●', '■'];

    stage.innerHTML = `
      <div class="kahoot-question-header">
        <span>Pregunta ${state.current + 1}/${state.questions.length}</span>
        <span class="kahoot-timer ${state.timeLeft <= 5 ? 'urgent' : ''}" id="kahoot-timer">${state.timeLeft}s</span>
      </div>
      <h3 class="kahoot-question-text">${q.q}</h3>
      <div class="kahoot-options">
        ${q.options.map((opt, i) => `
          <button class="kahoot-option" style="background:${COLORS[i]}" data-index="${i}">${letters[i]} ${opt}</button>
        `).join('')}
      </div>
    `;

    timer = setInterval(() => {
      state.timeLeft--;
      const timerEl = container.querySelector('#kahoot-timer');
      if (timerEl) {
        timerEl.textContent = state.timeLeft + 's';
        timerEl.classList.toggle('urgent', state.timeLeft <= 5);
      }
      if (state.timeLeft <= 0) {
        clearInterval(timer);
        EQ_EventBus.emit('answer:wrong', { explanation: q.explanation, question: q.q });
        state.current++;
        setTimeout(() => renderQuestion(container), 1500);
      }
    }, 1000);

    stage.querySelectorAll('.kahoot-option').forEach(btn => {
      btn.addEventListener('click', () => {
        clearInterval(timer);
        const chosen = parseInt(btn.dataset.index);
        const isCorrect = chosen === q.answer;
        const pts = isCorrect ? 500 + state.timeLeft * 100 : 0;

        stage.querySelectorAll('.kahoot-option').forEach((b, i) => {
          b.disabled = true;
          if (i === q.answer) b.classList.add('correct');
          else if (i === chosen && !isCorrect) b.classList.add('wrong');
        });

        if (isCorrect) {
          state.score += pts;
          state.correct++;
          container.querySelector('#kahoot-score').textContent = state.score + ' pts';
          EQ_EventBus.emit('toast:show', { type: 'success', title: `+${pts} puntos`, message: '¡Respuesta rápida!' });
        } else {
          EQ_EventBus.emit('answer:wrong', { explanation: q.explanation, question: q.q });
        }

        state.current++;
        setTimeout(() => renderQuestion(container), 1800);
      });
    });
  };

  const renderResults = (container) => {
    const user = EQ_Auth.getUser();
    const total = state.questions.length;
    const pct = Math.round((state.correct / total) * 100);
    const xpGained = user ? EQ_Gamification.recordQuizResult(user.id, {
      subject: 'matematica', score: state.score, total, correct: state.correct,
      isPerfect: state.correct === total, fastCorrect: state.correct, mode: 'kahoot',
    }) : 0;

    container.querySelector('#kahoot-stage').innerHTML = `
      <div class="kahoot-results animate-scale-in">
        <div style="font-size:4rem">${pct >= 80 ? '🏆' : '📊'}</div>
        <h2 style="font-family:var(--font-heading);font-size:2.5rem;font-weight:900;color:white">${state.score} pts</h2>
        <p style="color:rgba(255,255,255,0.7);margin:12px 0 24px">${state.correct}/${total} correctas (${pct}%)</p>
        ${xpGained ? `<div class="xp-chip" style="font-size:1.1rem;margin-bottom:24px">⭐ +${xpGained} XP</div>` : ''}
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-warning btn-lg" id="kahoot-retry">Jugar de nuevo</button>
          <button class="btn btn-ghost btn-lg" data-route="dashboard" style="color:white;border-color:rgba(255,255,255,0.3)">Dashboard</button>
        </div>
      </div>
    `;
    if (pct >= 70) EQ_Gamification.launchConfetti();
    container.querySelector('#kahoot-retry').onclick = () => EQ_Router.navigate('modes/kahoot');
    container.querySelector('[data-route="dashboard"]').onclick = e => {
      e.preventDefault(); EQ_Router.navigate('dashboard');
    };
  };

  const destroy = () => clearInterval(timer);

  return { render, destroy };
})();

window.EQ_KahootView = EQ_KahootView;
