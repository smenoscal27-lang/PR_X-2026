/* =====================================================
   EDUQUEST — gamification.js
   XP, logros, confetti — usa Progression + EventBus
   ===================================================== */

const EQ_Gamification = (() => {

  const getLevelInfo = (xp) => EQ_Progression.getLevelInfo(xp);

  const addXP = (userId, amount, subject) => {
    const user = EQ_Storage.findUserById(userId);
    if (!user) return null;

    const oldLevel = getLevelInfo(user.xp);
    const newXP = user.xp + amount;
    const newLevel = getLevelInfo(newXP);

    const updated = EQ_Storage.updateUser(userId, {
      xp: newXP,
      level: newLevel.level,
      stats: {
        totalXP: (user.stats?.totalXP || 0) + amount,
        xpBySubject: {
          ...user.stats.xpBySubject,
          [subject]: (user.stats.xpBySubject[subject] || 0) + amount,
        },
      },
    });

    EQ_EventBus.emit('xp:gained', { amount, subject, total: newXP });

    if (newLevel.level > oldLevel.level) {
      EQ_EventBus.emit('level:up', { ...newLevel, previous: oldLevel });
    }

    setTimeout(() => checkAchievements(userId), 500);
    return updated;
  };

  const recordQuizResult = (userId, { subject, score, total, correct, isPerfect, fastCorrect, mode }) => {
    const user = EQ_Storage.findUserById(userId);
    if (!user) return;

    const xpGained = calculateXP(correct, total, isPerfect, fastCorrect);

    EQ_Storage.updateUser(userId, {
      stats: {
        totalQuizzes:   (user.stats.totalQuizzes || 0) + 1,
        totalQuestions: (user.stats.totalQuestions || 0) + total,
        totalCorrect:   (user.stats.totalCorrect || 0) + correct,
        perfectQuizzes: (user.stats.perfectQuizzes || 0) + (isPerfect ? 1 : 0),
        fastCorrect:    (user.stats.fastCorrect || 0) + fastCorrect,
        quizzesBySubject: {
          ...user.stats.quizzesBySubject,
          [subject]: (user.stats.quizzesBySubject[subject] || 0) + 1,
        },
        progressBySubject: {
          ...user.stats.progressBySubject,
          [subject]: Math.min(100, (user.stats.progressBySubject[subject] || 0) + (correct / total * 10)),
        },
      },
    });

    EQ_Storage.addHistoryEntry(userId, {
      subject, score, total, correct, isPerfect, xpGained,
      mode: mode || 'quiz',
      subjectName: EQ_DATA.subjects[subject]?.name || subject,
    });

    addXP(userId, xpGained, subject);
    return xpGained;
  };

  const calculateXP = (correct, total, isPerfect, fastCorrect) => {
    let base = correct * 20;
    let bonus = 0;
    if (isPerfect) bonus += 50;
    if (fastCorrect > 0) bonus += fastCorrect * 5;
    if (correct / total >= 0.8) bonus += 20;
    return base + bonus;
  };

  const checkAchievements = (userId) => {
    const user = EQ_Storage.findUserById(userId);
    if (!user) return;

    const stats = { ...user.stats, level: user.level, streak: user.streak, totalXP: user.xp };
    const unlocked = [];

    for (const ach of EQ_DATA.achievements) {
      if (user.achievements.includes(ach.id)) continue;
      try { if (ach.condition(stats)) unlocked.push(ach); } catch {}
    }

    if (unlocked.length > 0) {
      EQ_Storage.updateUser(userId, {
        achievements: [...user.achievements, ...unlocked.map(a => a.id)],
      });
      unlocked.forEach((a, i) => {
        setTimeout(() => EQ_EventBus.emit('achievement:unlock', a), i * 2000);
      });
    }
  };

  const launchConfetti = () => {
    const canvas = document.getElementById('confetti-canvas') || createConfettiCanvas();
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width, y: -10,
      w: Math.random() * 10 + 5, h: Math.random() * 6 + 3,
      r: Math.random() * Math.PI * 2,
      vy: Math.random() * 4 + 2, vx: (Math.random() - 0.5) * 3,
      vr: (Math.random() - 0.5) * 0.2,
      color: ['#2563EB','#7C3AED','#10B981','#F59E0B','#EF4444','#EC4899','#60A5FA'][Math.floor(Math.random()*7)],
    }));

    let frame;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.vy; p.x += p.vx; p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (particles.some(p => p.y < canvas.height)) frame = requestAnimationFrame(draw);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    draw();
    setTimeout(() => { cancelAnimationFrame(frame); ctx.clearRect(0,0,canvas.width,canvas.height); }, 4000);
  };

  const createConfettiCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.id = 'confetti-canvas';
    document.body.appendChild(canvas);
    return canvas;
  };

  const formatXP = (xp) => xp >= 1000 ? `${(xp/1000).toFixed(1)}k` : xp.toString();

  const getAccuracy = (user) => {
    const { totalQuestions, totalCorrect } = user.stats;
    if (!totalQuestions) return 0;
    return Math.round((totalCorrect / totalQuestions) * 100);
  };

  return {
    getLevelInfo, addXP, recordQuizResult,
    calculateXP, checkAchievements, launchConfetti,
    formatXP, getAccuracy,
  };
})();

window.EQ_Gamification = EQ_Gamification;
window.launchConfetti = EQ_Gamification.launchConfetti;
