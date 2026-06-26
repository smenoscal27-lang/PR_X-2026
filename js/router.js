/* =====================================================
   EDUQUEST — router.js
   Navegación SPA sin recarga de página
   ===================================================== */

const EQ_Router = (() => {

  const routes = {
    '':              { view: 'dashboard',   title: 'Dashboard' },
    'dashboard':     { view: 'dashboard',   title: 'Dashboard' },
    'ranking':       { view: 'ranking',     title: 'Ranking' },
    'modes/duolingo':{ view: 'duolingo',    title: 'Ruta Duolingo' },
    'modes/quizlet': { view: 'quizlet',     title: 'Modo Quizlet' },
    'modes/kahoot':  { view: 'kahoot',      title: 'Kahoot Rush' },
    'quiz':          { view: 'quiz',        title: 'Quiz', dynamic: true },
  };

  let currentRoute = '';
  let outlet = null;

  const parseHash = () => {
    const hash = window.location.hash.replace(/^#\/?/, '') || 'dashboard';
    const [path, query] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(query || ''));
    return { path: path || 'dashboard', params };
  };

  const getView = (name) => ({
    dashboard: EQ_DashboardView,
    ranking:   EQ_RankingView,
    duolingo:  EQ_DuolingoView,
    quizlet:   EQ_QuizletView,
    kahoot:    EQ_KahootView,
    quiz:      EQ_QuizView,
  }[name]);

  const navigate = (path) => {
    window.location.hash = '/' + path;
  };

  const render = () => {
    const { path, params } = parseHash();
    const route = routes[path] || routes['dashboard'];
    const View = getView(route.view);

    if (!View || !outlet) return;

    outlet.classList.remove('view-enter');
    void outlet.offsetWidth;
    outlet.classList.add('view-exit');

    setTimeout(() => {
      outlet.innerHTML = '';
      outlet.classList.remove('view-exit');
      outlet.classList.add('view-enter');

      document.title = `${route.title} — EduQuest Bachillerato`;
      EQ_UI.setActiveNav?.(path.startsWith('modes/') ? path : path.split('?')[0]);

      View.render(outlet, params);
      currentRoute = path;
    }, 120);
  };

  const init = (containerId = 'app-outlet') => {
    outlet = document.getElementById(containerId);
    if (!outlet) return;

    window.addEventListener('hashchange', render);
    if (!window.location.hash) window.location.hash = '/dashboard';
    else render();

    EQ_Storage.validateAllUsers();
  };

  return { navigate, init, parseHash };
})();

window.EQ_Router = EQ_Router;
