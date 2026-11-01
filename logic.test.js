const test = require('node:test');
const assert = require('node:assert');
const L = require('./logic.js');
const { CATEGORIES, QUESTIONS, getRule } = require('./questions.js');

test('levelFor uses gender-neutral titles by default', () => {
  assert.ok(!/Expertin|Experte/.test(L.levelFor(1500).title));
  assert.ok(L.levelFor(1500, 'female').title.includes('Expertin'));
  assert.ok(L.levelFor(1500, 'male').title.includes('Experte'));
  assert.strictEqual(L.levelFor(0, 'female').title, L.levelFor(0).title);
});

test('normalizeProfile falls back to defaults', () => {
  assert.deepStrictEqual(L.normalizeProfile(null), L.defaultProfile());
  assert.deepStrictEqual(L.normalizeProfile({ avatar: 'x', gender: 'y' }), L.defaultProfile());
  assert.deepStrictEqual(L.normalizeProfile({ avatar: '🦄', gender: 'male' }), { avatar: '🦄', gender: 'male' });
});

test('renamePlayerInList', () => {
  assert.deepStrictEqual(L.renamePlayerInList(['Anna', 'Ben'], 'Anna', ' Anni '), { players: ['Anni', 'Ben'], name: 'Anni' });
  assert.strictEqual(L.renamePlayerInList(['Anna', 'Ben'], 'Anna', 'ben'), null);
  assert.strictEqual(L.renamePlayerInList(['Anna'], 'Anna', '  '), null);
  assert.deepStrictEqual(L.renamePlayerInList(['Anna'], 'Anna', 'ANNA'), { players: ['ANNA'], name: 'ANNA' });
});

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

test('every sub exercise has questions and every sub id is known', () => {
  for (const c of CATEGORIES.filter(c => c.subs)) {
    for (const s of c.subs) {
      assert.ok(QUESTIONS.some(q => q.cat === c.id && q.sub === s.id), `no questions for sub ${s.id}`);
    }
    const ids = c.subs.map(s => s.id);
    assert.ok(QUESTIONS.filter(q => q.cat === c.id).every(q => ids.includes(q.sub)), `unknown sub in ${c.id}`);
  }
});

test('filterPool and pickQuestions narrow down to a sub exercise', () => {
  const pool = L.filterPool(QUESTIONS, 'nominal', 'nom-adj');
  assert.ok(pool.length >= 10 && pool.every(q => q.sub === 'nom-adj'));
  const picked = L.pickQuestions(QUESTIONS, L.defaultStats(), 'nominal', CATEGORIES, 5, Math.random, 'nom-klein');
  assert.strictEqual(picked.length, 5);
  assert.ok(picked.every(q => q.sub === 'nom-klein'));
  assert.strictEqual(L.filterPool(QUESTIONS, 'mix', 'nom-adj'), QUESTIONS);
});

test('nominalization has many examples and each one has a rule', () => {
  const nominal = QUESTIONS.filter(q => q.cat === 'nominal');
  assert.ok(nominal.length >= 80);
  for (const q of nominal) assert.ok(getRule(q.ruleId), q.id);
});

test('categoryMastery can be limited to a sub exercise', () => {
  const ids = QUESTIONS.filter(q => q.sub === 'nom-adj').map(q => q.id);
  const box = Object.fromEntries(ids.map(id => [id, L.MAX_BOX]));
  assert.strictEqual(L.categoryMastery(QUESTIONS, box, 'nominal', 'nom-adj'), 1);
  assert.strictEqual(L.categoryMastery(QUESTIONS, box, 'nominal', 'nom-klein'), 0);
});
