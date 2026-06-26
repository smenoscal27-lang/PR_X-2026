/* =====================================================
   EDUQUEST — views/ranking-view.js
   ===================================================== */

const EQ_RankingView = (() => {

  const render = (container) => {
    const user = EQ_Auth.getUser();
    if (!user) return;

    container.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger-btn" id="hamburger-btn"><i class="fas fa-bars"></i></button>
          <div><div class="topbar-title">Ranking Global</div><div class="topbar-subtitle">Compite con estudiantes del plantel</div></div>
        </div>
        <div class="topbar-right">
          <div class="topbar-chip xp" id="topbar-xp">⭐ ${user.xp} XP</div>
          <div class="topbar-chip streak" id="topbar-streak">🔥 ${user.streak} días</div>
        </div>
      </header>
      <div class="page-content view-enter">
        <div class="card" style="margin-bottom:24px"><div id="ranking-podium"></div></div>
        <div class="card"><div id="ranking-list"></div></div>
      </div>
    `;

    EQ_UI.init(user);
    EQ_Ranking.renderPodium('ranking-podium');
    EQ_Ranking.render('ranking-list', user.id);
  };

  return { render, destroy: () => {} };
})();

window.EQ_RankingView = EQ_RankingView;
