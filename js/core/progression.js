/* =====================================================
   EDUQUEST — progression.js
   Fórmula exponencial: Nivel = ⌊√(XP/100)⌋ + 1
   ===================================================== */

const EQ_Progression = (() => {

  const TIER_NAMES = [
    { min: 1,  name: 'Novato',           icon: '🌱' },
    { min: 2,  name: 'Aprendiz',         icon: '📖' },
    { min: 3,  name: 'Explorador',       icon: '🔭' },
    { min: 4,  name: 'Aventurero',       icon: '⚔️' },
    { min: 5,  name: 'Experto',          icon: '🎯' },
    { min: 6,  name: 'Maestro',          icon: '🏆' },
    { min: 7,  name: 'Gran Maestro',     icon: '👑' },
    { min: 8,  name: 'Leyenda EduQuest', icon: '⭐' },
    { min: 12, name: 'Sabio',            icon: '🧠' },
    { min: 16, name: 'Élite',            icon: '💎' },
    { min: 20, name: 'Inmortal',         icon: '🔥' },
  ];

  const calculateLevel = (xp) =>
    Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1);

  const xpForLevel = (level) =>
    Math.pow(Math.max(1, level) - 1, 2) * 100;

  const getTier = (level) => {
    let tier = TIER_NAMES[0];
    for (const t of TIER_NAMES) {
      if (level >= t.min) tier = t;
    }
    return tier;
  };

  const getLevelInfo = (xp) => {
    const level = calculateLevel(xp);
    const minXP = xpForLevel(level);
    const nextMinXP = xpForLevel(level + 1);
    const tier = getTier(level);
    const range = nextMinXP - minXP;
    const progress = range > 0 ? ((xp - minXP) / range) * 100 : 100;

    return {
      level,
      name: tier.name,
      icon: tier.icon,
      minXP,
      xpInLevel: xp - minXP,
      xpToNext: Math.max(0, nextMinXP - xp),
      nextLevel: { level: level + 1, minXP: nextMinXP },
      progress: Math.min(100, Math.max(0, progress)),
    };
  };

  return { calculateLevel, xpForLevel, getTier, getLevelInfo, TIER_NAMES };
})();

window.EQ_Progression = EQ_Progression;
