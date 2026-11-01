// Pure game logic (no DOM access) so it can be unit tested with Node.

const MAX_BOX = 3; // Leitner-style box: 0 = new/wrong, 3 = mastered
const ROUND_SIZE = 10;

const LEVELS = [
  { xp: 0, title: 'Starter 🌱' },
  { xp: 100, title: 'Entdecker 🧭' },
  { xp: 250, title: 'Lernprofi 📘' },
  { xp: 450, title: 'Wortkünstler ✏️' },
  { xp: 700, title: 'Rechtschreib-Ass 🎯' },
  { xp: 1000, title: 'Sprachtalent 🚀' },
  { xp: 1400, title: 'Expertin 🔬' },
  { xp: 1900, title: 'Meisterin 👑' },
  { xp: 2500, title: 'Rechtschreib-Legende 🏆' },
];

const BADGES = [
  { id: 'first', name: 'Erste Runde', icon: '🎉', test: s => s.rounds >= 1 },
  { id: 'combo5', name: 'Serie: 5 in Folge', icon: '🔥', test: s => s.bestCombo >= 5 },
  { id: 'combo10', name: 'Serie: 10 in Folge', icon: '⚡', test: s => s.bestCombo >= 10 },
  { id: 'perfect', name: 'Fehlerlose Runde', icon: '💎', test: s => s.perfectRounds >= 1 },
  { id: 'streak3', name: '3 Tage in Folge', icon: '📅', test: s => s.streakDays >= 3 },
  { id: 'correct100', name: '100 richtige Antworten', icon: '✅', test: s => s.totalCorrect >= 100 },
  { id: 'master30', name: '30 Fragen gemeistert', icon: '🧠', test: s => countMastered(s.box) >= 30 },
  { id: 'rounds10', name: '10 Runden gespielt', icon: '🏅', test: s => s.rounds >= 10 },
];

function defaultStats() {
  return {
    xp: 0, highScore: 0, rounds: 0, perfectRounds: 0, bestCombo: 0,
    totalCorrect: 0, totalAnswered: 0, streakDays: 0, lastPlayed: null,
    box: {}, badges: [],
  };
}

// Fisher-Yates shuffle returning a new array
function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function countMastered(box) {
  return Object.values(box || {}).filter(b => b >= MAX_BOX).length;
}

// Weight of a question: unknown / wrong questions and hard categories come up more often
function questionWeight(question, box, categories) {
  const cat = categories.find(c => c.id === question.cat);
  const catWeight = cat ? cat.weight : 1;
  const b = (box && box[question.id]) || 0;
  return (MAX_BOX + 1 - b) * catWeight;
}

// Weighted random sampling without replacement
function weightedSample(items, weights, n, rng = Math.random) {
  const pool = items.map((item, i) => ({ item, w: weights[i] }));
  const result = [];
  while (result.length < n && pool.length > 0) {
    const total = pool.reduce((sum, p) => sum + p.w, 0);
    let r = rng() * total;
    let idx = 0;
    for (; idx < pool.length - 1; idx++) {
      r -= pool[idx].w;
      if (r < 0) break;
    }
    result.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return result;
}

// Select the questions of a category, optionally narrowed to one sub exercise.
// catId = 'mix' uses all questions.
function filterPool(all, catId, subId = null) {
  if (catId === 'mix') return all;
  const inCat = all.filter(q => q.cat === catId);
  return subId ? inCat.filter(q => q.sub === subId) : inCat;
}

// Choose the questions for a round. catId = 'mix' uses all categories, subId narrows to a sub exercise.
function pickQuestions(all, stats, catId, categories, n = ROUND_SIZE, rng = Math.random, subId = null) {
  const pool = filterPool(all, catId, subId);
  const weights = pool.map(q => questionWeight(q, stats.box, categories));
  return weightedSample(pool, weights, n, rng);
}

// Shuffle options of a question (returns a copy)
function withShuffledOptions(question, rng = Math.random) {
  return { ...question, options: shuffle(question.options, rng) };
}

function isCorrect(question, chosen) {
  return question.answer === chosen;
}

// Update the Leitner box after the FIRST attempt of a question.
// A correct answer with help does not raise the box (the question must be known without help).
function updateBox(box, id, correct, helped = false) {
  const current = box[id] || 0;
  if (correct && helped) return { ...box, [id]: current };
  return { ...box, [id]: correct ? Math.min(MAX_BOX, current + 1) : 0 };
}

// Points for a correct answer: base 10 + combo bonus (max +20). Repeated or helped questions give 5.
function pointsFor(combo, isRetry, helped = false) {
  if (isRetry || helped) return 5;
  return 10 + 2 * Math.min(combo, 10);
}

// A wrong question comes back after two other questions (repetition within the round)
function requeueWrong(queue, question, gapSize = 2) {
  const copy = queue.slice();
  copy.splice(Math.min(gapSize, copy.length), 0, question);
  return copy;
}

function levelFor(xp) {
  let index = 0;
  LEVELS.forEach((l, i) => { if (xp >= l.xp) index = i; });
  const next = LEVELS[index + 1] || null;
  return { index, title: LEVELS[index].title, nextXp: next ? next.xp : null, currentXp: LEVELS[index].xp };
}

// Difference in days between two YYYY-MM-DD strings
function dayDiff(a, b) {
  return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
}

function updateDayStreak(stats, today) {
  if (stats.lastPlayed === today) return stats;
  const streak = stats.lastPlayed && dayDiff(stats.lastPlayed, today) === 1 ? stats.streakDays + 1 : 1;
  return { ...stats, streakDays: streak, lastPlayed: today };
}

// Mastery (0..1) of a category based on the Leitner boxes
function categoryMastery(all, box, catId, subId = null) {
  const qs = filterPool(all, catId, subId);
  if (qs.length === 0) return 0;
  const sum = qs.reduce((s, q) => s + ((box[q.id] || 0) / MAX_BOX), 0);
  return sum / qs.length;
}

// Apply a finished round to the stats. result: { score, correctFirstTry, answeredFirstTry, bestCombo, wrongCount }
function applyRoundResult(stats, result, today) {
  let s = updateDayStreak(stats, today);
  const perfect = result.wrongCount === 0;
  s = {
    ...s,
    xp: s.xp + result.score,
    rounds: s.rounds + 1,
    perfectRounds: s.perfectRounds + (perfect ? 1 : 0),
    bestCombo: Math.max(s.bestCombo, result.bestCombo),
    highScore: Math.max(s.highScore, result.score),
    totalCorrect: s.totalCorrect + result.correctFirstTry,
    totalAnswered: s.totalAnswered + result.answeredFirstTry,
  };
  const earned = BADGES.filter(b => b.test(s)).map(b => b.id);
  const newBadges = earned.filter(id => !s.badges.includes(id));
  return { stats: { ...s, badges: earned }, newBadges, isNewHighScore: result.score > stats.highScore };
}

function motivationText(correct, total) {
  const ratio = total === 0 ? 0 : correct / total;
  if (ratio === 1) return 'Fehlerlos! Stark gemacht! ✨';
  if (ratio >= 0.7) return 'Super gemacht! Noch eine Runde und du steigst weiter auf! 🚀';
  if (ratio >= 0.4) return 'Gut gekämpft! Die Fehler kommen wieder – so lernst du sie! 💪';
  return 'Nicht aufgeben! Jeder fängt mal klein an – weiter geht’s! 🌱';
}

const MAX_NAME_LENGTH = 20;

// Trim, collapse whitespace and limit the length of a player name
function normalizeName(name) {
  return String(name || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim();
}

// Case-insensitive key so "Anna" and "anna" are the same player
function playerKey(name) {
  return normalizeName(name).toLowerCase();
}

// Add a player to the list unless one with the same key already exists. Returns a new list.
function addPlayer(players, name) {
  const clean = normalizeName(name);
  if (!clean || players.some(p => playerKey(p) === playerKey(clean))) return players.slice();
  return [...players, clean];
}

// Find the stored spelling of a name (or the normalized input if new)
function resolvePlayerName(players, name) {
  const clean = normalizeName(name);
  return players.find(p => playerKey(p) === playerKey(clean)) || clean;
}

const api = {
  normalizeName, playerKey, addPlayer, resolvePlayerName,
  MAX_BOX, ROUND_SIZE, LEVELS, BADGES, defaultStats, shuffle, countMastered, questionWeight,
  weightedSample, filterPool, pickQuestions, withShuffledOptions, isCorrect, updateBox, pointsFor,
  requeueWrong, levelFor, dayDiff, updateDayStreak, categoryMastery, applyRoundResult, motivationText,
};

if (typeof module !== 'undefined') module.exports = api;
else window.GameLogic = api;



