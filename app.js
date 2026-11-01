// DOM layer. All game rules live in logic.js; this file only renders and stores.
(function () {
  const L = window.GameLogic;
  const STORAGE_KEY = 'johanna-deutsch-v1';
  const $ = id => document.getElementById(id);

  let stats = loadStats();
  let round = null;

  // ---------- Storage ----------
  function loadStats() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...L.defaultStats(), ...JSON.parse(raw) } : L.defaultStats();
    } catch (e) {
      return L.defaultStats();
    }
  }

  function saveStats() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(stats)); } catch (e) { /* ignore */ }
  }

  function todayString() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // ---------- Screens ----------
  function show(id) {
    ['menu', 'game', 'result', 'rulebook'].forEach(s => $(s).classList.toggle('hidden', s !== id));
  }

  // Build a DOM block for a rule (title, text, mnemonic)
  function ruleElement(rule, className) {
    const el = document.createElement('div');
    el.className = className;
    const title = document.createElement(className === 'rule-item' ? 'h4' : 'div');
    title.textContent = rule.title;
    const memo = document.createElement('div');
    memo.className = 'memo';
    memo.textContent = `🧠 ${rule.memo}`;
    const text = document.createElement('div');
    text.textContent = rule.text;
    el.append(title, memo, text);
    return el;
  }

  function renderRulebook() {
    const list = $('rulebookList');
    list.innerHTML = '';
    CATEGORIES.filter(c => c.id !== 'regeln').forEach(c => {
      const rules = RULES.filter(r => r.cat === c.id);
      if (rules.length === 0) return;
      const h = document.createElement('h2');
      h.textContent = `${c.icon} ${c.name}`;
      list.appendChild(h);
      rules.forEach(r => list.appendChild(ruleElement(r, 'rule-item')));
    });
    show('rulebook');
  }

  function toggleHelp() {
    if (!round || round.locked) return;
    const rule = getRule(round.current.ruleId);
    if (!rule) return;
    round.helpUsed = true;
    const box = $('ruleBox');
    box.innerHTML = '';
    box.appendChild(ruleElement(rule, 'rulebox-inner'));
    box.querySelector('div').firstChild.style.fontWeight = 'bold';
    box.classList.remove('hidden');
    $('helpBtn').classList.add('hidden');
  }

  function renderMenu() {
    const lvl = L.levelFor(stats.xp);
    $('levelTitle').textContent = lvl.title;
    $('highScore').textContent = stats.highScore;
    $('streak').textContent = stats.streakDays;
    const span = lvl.nextXp ? lvl.nextXp - lvl.currentXp : 1;
    const pct = lvl.nextXp ? ((stats.xp - lvl.currentXp) / span) * 100 : 100;
    $('xpFill').style.width = pct + '%';
    $('xpText').textContent = lvl.nextXp ? `${stats.xp} / ${lvl.nextXp} XP bis zum nächsten Level` : `${stats.xp} XP – höchstes Level!`;

    const box = $('categories');
    box.innerHTML = '';
    CATEGORIES.forEach(c => {
      const b = document.createElement('button');
      b.className = 'cat';
      const mastery = Math.round(L.categoryMastery(QUESTIONS, stats.box, c.id) * 100);
      b.innerHTML = `<span class="icon">${c.icon}</span><span class="name"></span><span class="desc"></span>` +
        `${c.weight >= 3 ? '<span class="hardtag">⭐ Extra-Training</span>' : ''}` +
        `<div class="meter"><div style="width:${mastery}%"></div></div><small>${mastery}% gemeistert</small>`;
      b.querySelector('.name').textContent = c.name;
      b.querySelector('.desc').textContent = c.desc;
      b.onclick = () => startRound(c.id);
      box.appendChild(b);
    });

    $('badges').innerHTML = '';
    L.BADGES.forEach(bd => {
      const el = document.createElement('span');
      el.className = 'badge' + (stats.badges.includes(bd.id) ? '' : ' locked');
      el.textContent = `${bd.icon} ${bd.name}`;
      $('badges').appendChild(el);
    });
    show('menu');
  }

  // ---------- Round ----------
  function startRound(catId) {
    const picked = L.pickQuestions(QUESTIONS, stats, catId, CATEGORIES);
    round = {
      catId, queue: picked.slice(), total: picked.length, doneFirst: new Set(), retried: new Set(),
      score: 0, combo: 0, bestCombo: 0, correctFirstTry: 0, answeredFirstTry: 0, wrong: [], current: null, locked: false,
    };
    $('score').textContent = '0';
    show('game');
    nextQuestion();
  }

  function updateHud() {
    $('score').textContent = round.score;
    $('combo').textContent = `🔥 x${round.combo}`;
    $('progress').textContent = `Frage ${Math.min(round.doneFirst.size + 1, round.total)} / ${round.total}`;
  }

  function nextQuestion() {
    if (round.queue.length === 0) return finishRound();
    const q = L.withShuffledOptions(round.queue.shift());
    round.current = q;
    round.locked = false;
    round.helpUsed = false;
    $('ruleBox').classList.add('hidden');
    $('helpBtn').classList.toggle('hidden', !q.ruleId);
    const cat = CATEGORIES.find(c => c.id === q.cat);
    $('catLabel').textContent = `${cat.icon} ${cat.name}` + (round.retried.has(q.id) ? '  👻 Wiederholung!' : '');
    $('prompt').textContent = q.prompt;
    $('display').textContent = q.display || '';
    $('display').classList.toggle('hidden', !q.display);
    $('feedback').classList.add('hidden');
    $('nextBtn').classList.add('hidden');
    const opts = $('options');
    opts.innerHTML = '';
    q.options.forEach(o => {
      const b = document.createElement('button');
      b.textContent = o;
      b.onclick = () => answer(b, o);
      opts.appendChild(b);
    });
    updateHud();
  }

  function answer(button, chosen) {
    if (round.locked) return;
    round.locked = true;
    $('helpBtn').classList.add('hidden');
    const q = round.current;
    const ok = L.isCorrect(q, chosen);
    const isRetry = round.retried.has(q.id);
    const first = !round.doneFirst.has(q.id) && !isRetry;

    if (first) {
      round.doneFirst.add(q.id);
      round.answeredFirstTry++;
      stats.box = L.updateBox(stats.box, q.id, ok, round.helpUsed);
      if (ok) round.correctFirstTry++;
    }
    [...$('options').children].forEach(b => {
      if (b.textContent === q.answer) b.classList.add('right');
    });
    const fb = $('feedback');
    fb.classList.remove('hidden', 'ok', 'bad');

    if (ok) {
      round.combo++;
      round.bestCombo = Math.max(round.bestCombo, round.combo);
      round.score += L.pointsFor(round.combo, isRetry, round.helpUsed);
      fb.classList.add('ok');
      fb.textContent = `✅ Richtig! ${q.hint}`;
    } else {
      button.classList.add('wrong');
      round.combo = 0;
      fb.classList.add('bad');
      fb.textContent = `❌ Fast! Richtig ist „${q.answer}“. ${q.hint} Die Frage kommt gleich nochmal.`;
      if (first) round.wrong.push(q);
      round.retried.add(q.id);
      round.queue = L.requeueWrong(round.queue, q);
    }
    $('score').classList.remove('pop'); void $('score').offsetWidth; $('score').classList.add('pop');
    updateHud();
    saveStats();
    $('nextBtn').classList.remove('hidden');
    $('nextBtn').focus();
  }

  function finishRound() {
    const before = stats.badges.slice();
    const res = L.applyRoundResult(stats, {
      score: round.score, correctFirstTry: round.correctFirstTry, answeredFirstTry: round.answeredFirstTry,
      bestCombo: round.bestCombo, wrongCount: round.wrong.length,
    }, todayString());
    stats = res.stats;
    saveStats();

    $('resultScore').textContent = `${round.score} Punkte`;
    $('resultNew').textContent = res.isNewHighScore ? '🏆 NEUER HIGHSCORE! 🎉' : `Dein Highscore: ${stats.highScore}`;
    $('resultText').textContent = `${round.correctFirstTry} von ${round.answeredFirstTry} gleich richtig – längste Serie: ${round.bestCombo}. ` +
      L.motivationText(round.correctFirstTry, round.answeredFirstTry);

    $('resultBadges').innerHTML = '';
    res.newBadges.filter(id => !before.includes(id)).forEach(id => {
      const bd = L.BADGES.find(b => b.id === id);
      const el = document.createElement('span');
      el.className = 'badge pop';
      el.textContent = `Neu: ${bd.icon} ${bd.name}`;
      $('resultBadges').appendChild(el);
    });

    const wrongBox = $('resultWrong');
    wrongBox.innerHTML = '';
    if (round.wrong.length > 0) {
      wrongBox.innerHTML = '<h3>Das üben wir weiter:</h3><ul></ul>';
      round.wrong.forEach(q => {
        const li = document.createElement('li');
        li.textContent = `${q.display || q.prompt} → ${q.answer}`;
        wrongBox.querySelector('ul').appendChild(li);
      });
    }
    show('result');
  }

  // ---------- Events ----------
  $('mixBtn').onclick = () => startRound('mix');
  $('helpBtn').onclick = toggleHelp;
  $('rulebookBtn').onclick = renderRulebook;
  $('rulebookTrainBtn').onclick = () => startRound('regeln');
  $('rulebookBackBtn').onclick = renderMenu;
  $('nextBtn').onclick = nextQuestion;
  $('quitBtn').onclick = () => { saveStats(); renderMenu(); };
  $('againBtn').onclick = () => startRound(round.catId);
  $('menuBtn').onclick = renderMenu;

  renderMenu();
})();








