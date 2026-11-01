const test = require('node:test');
const assert = require('node:assert');
const L = require('./logic.js');
const { CATEGORIES, QUESTIONS, getRule } = require('./questions.js');

test('all questions are valid', () => {
  const ids = new Set();
  for (const q of QUESTIONS) {
    assert.ok(q.options.includes(q.answer), `answer missing in options: ${q.id}`);
    assert.strictEqual(new Set(q.options).size, q.options.length, `duplicate options: ${q.id}`);
    assert.ok(CATEGORIES.some(c => c.id === q.cat), `unknown category: ${q.id}`);
    assert.ok(!ids.has(q.id)); ids.add(q.id);
  }
});

test('pickQuestions returns n unique questions of the category', () => {
  const picked = L.pickQuestions(QUESTIONS, L.defaultStats(), 'sss', CATEGORIES, 10);
  assert.strictEqual(picked.length, 10);
  assert.strictEqual(new Set(picked.map(q => q.id)).size, 10);
  assert.ok(picked.every(q => q.cat === 'sss'));
});

test('updateBox raises on correct and resets on wrong', () => {
  let box = L.updateBox({}, 'a', true);
  box = L.updateBox(box, 'a', true);
  assert.strictEqual(box.a, 2);
  assert.strictEqual(L.updateBox(box, 'a', false).a, 0);
});

test('pointsFor and requeueWrong', () => {
  assert.strictEqual(L.pointsFor(0, false), 10);
  assert.strictEqual(L.pointsFor(50, false), 30);
  assert.strictEqual(L.pointsFor(3, true), 5);
  assert.deepStrictEqual(L.requeueWrong(['a', 'b', 'c'], 'x'), ['a', 'b', 'x', 'c']);
  assert.deepStrictEqual(L.requeueWrong([], 'x'), ['x']);
});

test('day streak', () => {
  const s = { ...L.defaultStats(), streakDays: 2, lastPlayed: '2026-10-30' };
  assert.strictEqual(L.updateDayStreak(s, '2026-10-31').streakDays, 3);
  assert.strictEqual(L.updateDayStreak(s, '2026-11-02').streakDays, 1);
  assert.strictEqual(L.updateDayStreak(s, '2026-10-30').streakDays, 2);
});

test('applyRoundResult updates high score and badges', () => {
  const r = L.applyRoundResult(L.defaultStats(),
    { score: 150, correctFirstTry: 10, answeredFirstTry: 10, bestCombo: 10, wrongCount: 0 }, '2026-10-31');
  assert.strictEqual(r.stats.highScore, 150);
  assert.ok(r.isNewHighScore);
  assert.ok(r.newBadges.includes('perfect') && r.newBadges.includes('combo10'));
});

test('help gives fewer points and does not raise the box', () => {
  assert.strictEqual(L.pointsFor(5, false, true), 5);
  assert.strictEqual(L.updateBox({ a: 1 }, 'a', true, true).a, 1);
  assert.strictEqual(L.updateBox({ a: 1 }, 'a', false, true).a, 0);
});

test('every question has a valid rule (except rule questions)', () => {
  for (const q of QUESTIONS) {
    if (q.cat === 'regeln') assert.strictEqual(q.ruleId, null);
    else assert.ok(getRule(q.ruleId), `missing rule for ${q.id} (${q.ruleId})`);
  }
  assert.ok(QUESTIONS.filter(q => q.cat === 'regeln').length >= 20);
});

test('player names', () => {
  assert.strictEqual(L.normalizeName('  Anna   Lena  '), 'Anna Lena');
  assert.strictEqual(L.normalizeName('x'.repeat(50)).length, 20);
  assert.strictEqual(L.normalizeName(null), '');
  assert.strictEqual(L.playerKey('Anna'), L.playerKey(' anna '));
  assert.deepStrictEqual(L.addPlayer(['Anna'], 'anna'), ['Anna']);
  assert.deepStrictEqual(L.addPlayer(['Anna'], 'Ben'), ['Anna', 'Ben']);
  assert.deepStrictEqual(L.addPlayer(['Anna'], '   '), ['Anna']);
  assert.strictEqual(L.resolvePlayerName(['Anna'], 'ANNA'), 'Anna');
});

test('levelFor', () => {
  assert.strictEqual(L.levelFor(0).index, 0);
  assert.strictEqual(L.levelFor(260).index, 2);
});




