/* =====================================================
   EDUQUEST — views/quizlet-view.js
   Flashcards + Match (inspirado en Quizlet)
   ===================================================== */

const EQ_QuizletView = (() => {

  let flipped = false;

  const getCards = () => {
    const all = [];
    Object.entries(EQ_DATA.questions).forEach(([subject, questions]) => {
      questions.filter(q => q.type === 'quiz').slice(0, 3).forEach(q => {
        all.push({
          subject,
          front: q.q,
          back: q.options[q.answer],
          explanation: q.explanation,
        });
      });
    });
    return all.sort(() => Math.random() - 0.5).slice(0, 8);
  };

  const render = (container) => {
    const user = EQ_Auth.getUser();
    if (!user) return;
    const cards = getCards();
    let current = 0;
    flipped = false;

    const draw = () => {
      const card = cards[current];
      const sub = EQ_DATA.subjects[card.subject];
      container.querySelector('#flashcard-area').innerHTML = `
        <div class="flashcard ${flipped ? 'flipped' : ''}" id="flashcard">
          <div class="flashcard-front" style="border-top:4px solid ${sub?.color || 'var(--primary)'}">
            <span class="flashcard-subject">${sub?.icon} ${sub?.name}</span>
            <p class="flashcard-text">${card.front}</p>
            <span class="flashcard-hint">Toca para voltear</span>
          </div>
          <div class="flashcard-back">
            <p class="flashcard-answer">${card.back}</p>
            <p class="flashcard-explanation">${card.explanation}</p>
          </div>
        </div>
        <div class="flashcard-counter">${current + 1} / ${cards.length}</div>
      `;
      container.querySelector('#flashcard').addEventListener('click', () => {
        flipped = !flipped;
        container.querySelector('#flashcard').classList.toggle('flipped', flipped);
      });
    };

    container.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" id="hamburger-btn"><i class="fas fa-bars"></i></button>
          <div><div class="topbar-title">🃏 Modo Quizlet</div><div class="topbar-subtitle">Flashcards y asociación de conceptos</div></div>
        </div>
        <div class="topbar-right">
          <button class="btn btn-ghost btn-sm" data-route="dashboard">← Dashboard</button>
          <button class="btn btn-primary btn-sm" data-route="quiz?subject=matematica&mode=match">Modo Match →</button>
        </div>
      </header>
      <div class="page-content view-enter">
        <div class="card flashcard-container">
          <div id="flashcard-area"></div>
          <div class="flashcard-actions">
            <button class="btn btn-ghost" id="fc-wrong">😕 Difícil</button>
            <button class="btn btn-secondary" id="fc-next">Siguiente →</button>
            <button class="btn btn-primary" id="fc-easy">✅ Fácil (+5 XP)</button>
          </div>
        </div>
      </div>
    `;

    EQ_UI.init(user);
    draw();

    container.querySelector('[data-route]')?.addEventListener('click', e => {
      if (e.target.dataset.route) { e.preventDefault(); EQ_Router.navigate(e.target.dataset.route); }
    });
    container.querySelectorAll('[data-route]').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); EQ_Router.navigate(btn.dataset.route); });
    });

    container.querySelector('#fc-next').onclick = () => {
      current = (current + 1) % cards.length;
      flipped = false;
      draw();
    };
    container.querySelector('#fc-easy').onclick = () => {
      EQ_Gamification.addXP(user.id, 5, cards[current].subject);
      current = (current + 1) % cards.length;
      flipped = false;
      draw();
    };
    container.querySelector('#fc-wrong').onclick = () => {
      EQ_EventBus.emit('answer:wrong', { explanation: cards[current].explanation, question: cards[current].front });
      current = (current + 1) % cards.length;
      flipped = false;
      draw();
    };
  };

  return { render, destroy: () => {} };
})();

window.EQ_QuizletView = EQ_QuizletView;
