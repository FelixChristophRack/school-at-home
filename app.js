// DOM layer. All game rules live in logic.js; this file only renders and stores.
(function () {
  const L = window.GameLogic;
  const LEGACY_KEY = 'johanna-deutsch-v1'; // single-player data from the first version
  const PLAYERS_KEY = 'deutsch-players';
  const LAST_PLAYER_KEY = 'deutsch-last-player';
  const $ = id => document.getElementById(id);

  let playerName = null;
  let stats = L.defaultStats();
  let round = null;

  // ---------- Storage ----------
  function statsKey(name) {
    return 'deutsch-stats-v2:' + L.playerKey(name);
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function loadPlayers() {
    const list = readJson(PLAYERS_KEY, []);
    return Array.isArray(list) ? list : [];
  }

  function loadStats() {
    return { ...L.defaultStats(), ...readJson(statsKey(playerName), {}) };
  }

  function saveStats() {
    if (!playerName) return;
    try { localStorage.setItem(statsKey(playerName), JSON.stringify(stats)); } catch (e) { /* ignore */ }
  }

  // Log in (or create) a player. Old single-player progress is adopted by the first new player.
  function login(rawName) {
    const players = loadPlayers();
    const name = L.resolvePlayerName(players, rawName);
    if (!name) return;
    try {
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy && players.length === 0 && !localStorage.getItem(statsKey(name))) {
        localStorage.setItem(statsKey(name), legacy);
        localStorage.removeItem(LEGACY_KEY);
      }
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(L.addPlayer(players, name)));
      localStorage.setItem(LAST_PLAYER_KEY, name);
    } catch (e) { /* ignore */ }
    playerName = name;
    stats = loadStats();
    renderMenu();
  }

  function logout() {
    saveStats();
    playerName = null;
    try { localStorage.removeItem(LAST_PLAYER_KEY); } catch (e) { /* ignore */ }
    renderLogin();
  }

  function renderLogin() {
    const players = loadPlayers();
    const box = $('knownPlayers');
    box.innerHTML = '';
    if (players.length > 0) {
      const h = document.createElement('h3');
      h.textContent = 'Schon dabei? Tippe auf deinen Namen:';
      box.appendChild(h);
      players.forEach(p => {
        const b = document.createElement('button');
        b.className = 'small player';
        b.textContent = `🎃 ${p}`;
        b.onclick = () => login(p);
        box.appendChild(b);
      });
    }
    $('nameInput').value = '';
    show('login');
  }

  function submitName() {
    const name = L.normalizeName($('nameInput').value);
    if (!name) {
      $('nameInput').focus();
      return;
    }
    login(name);
  }

  function todayString() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // ---------- Screens ----------
  function show(id) {
    ['login', 'menu', 'game', 'result', 'rulebook'].forEach(s => $(s).classList.toggle('hidden', s !== id));
    $('switchBtn').classList.toggle('hidden', id !== 'menu');
  }

  // Build a titled list (steps or examples) for a rule
  function listElement(heading, tag, items) {
    const box = document.createElement('div');
    box.className = 'rule-list';
    const h = document.createElement('div');
    h.className = 'rule-list-title';
    h.textContent = heading;
    const list = document.createElement(tag);
    items.forEach(i => {
      const li = document.createElement('li');
      li.textContent = i;
      list.appendChild(li);
    });
    box.append(h, list);
    return box;
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
    if (rule.steps) el.appendChild(listElement('So gehst du vor:', 'ol', rule.steps));
    if (rule.examples) el.appendChild(listElement('Beispiele:', 'ul', rule.examples));
    return el;
  }

  function renderRulebook() {
    const list = $('rulebookList');
    list.innerHTML = '';
    CATEGORIES.filter(c => c.id !== 'regeln').forEach(c => {
      const rules = RULES.filter(r => r.cat === c.id);
      if (rules.length === 0) return;
      const h = document.createElement('h2');
      h.className = 'mt-8 text-lg font-semibold text-slate-900';
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

  function masteryPercent(catId, subId) {
    return Math.round(L.categoryMastery(QUESTIONS, stats.box, catId, subId) * 100);
  }

  // Build the main button of a category (starts a round with all its questions)
  function categoryButton(c) {
    const b = document.createElement('button');
    b.className = 'cat';
    const mastery = masteryPercent(c.id, null);
    b.innerHTML = `<span class="cat-icon">${c.icon}</span>` +
      `<span class="cat-name"><span class="cat-title"></span>${c.weight >= 3 ? '<span class="hardtag">⭐ Extra-Training</span>' : ''}</span>` +
      '<span class="cat-desc"></span>' +
      `<div class="meter"><div style="width:${mastery}%"></div></div>` +
      `<small class="mt-1 block text-xs text-slate-500">${mastery}% gemeistert</small>`;
    b.querySelector('.cat-title').textContent = c.name;
    b.querySelector('.cat-desc').textContent = c.desc;
    b.onclick = () => startRound(c.id);
    return b;
  }

  // Build one small button for a sub exercise of a category
  function subButton(c, sub) {
    const b = document.createElement('button');
    b.className = 'sub-btn';
    b.title = sub.desc;
    const label = document.createElement('span');
    label.textContent = sub.name;
    const pct = document.createElement('small');
    pct.textContent = `${masteryPercent(c.id, sub.id)}%`;
    b.append(label, pct);
    b.onclick = () => startRound(c.id, sub.id);
    return b;
  }

  // A category card plus (if available) its sub exercises
  function categoryElement(c) {
    const wrap = document.createElement('div');
    wrap.appendChild(categoryButton(c));
    if (c.subs && c.subs.length > 0) {
      const subs = document.createElement('div');
      subs.className = 'subs';
      c.subs.forEach(s => subs.appendChild(subButton(c, s)));
      wrap.appendChild(subs);
    }
    return wrap;
  }

  function renderMenu() {
    $('hello').textContent = `Hallo ${playerName}! Bereit für eine Runde? 🧙‍♀️`;
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
    CATEGORIES.forEach(c => box.appendChild(categoryElement(c)));

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
  function startRound(catId, subId = null) {
    const picked = L.pickQuestions(QUESTIONS, stats, catId, CATEGORIES, L.ROUND_SIZE, Math.random, subId);
    round = {
      catId, subId, queue: picked.slice(), total: picked.length, doneFirst: new Set(), retried: new Set(),
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
    $('progressBar').style.width = `${round.total ? (round.doneFirst.size / round.total) * 100 : 0}%`;
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
    const sub = (cat.subs || []).find(s => s.id === q.sub);
    $('catLabel').textContent = `${cat.icon} ${cat.name}` + (sub ? ` › ${sub.name}` : '') +
      (round.retried.has(q.id) ? '  🔁 Wiederholung!' : '');
    $('prompt').textContent = q.prompt;
    $('display').textContent = q.display || '';
    $('display').classList.toggle('hidden', !q.display);
    $('feedback').classList.add('hidden');
    $('nextBtn').classList.add('hidden');
    const opts = $('options');
    opts.innerHTML = '';
    q.options.forEach(o => {
      const b = document.createElement('button');
      b.className = 'opt';
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
      wrongBox.innerHTML = '<h3 class="font-semibold text-slate-900">Das üben wir weiter:</h3><ul class="mt-2 list-disc space-y-1 pl-6 text-slate-700"></ul>';
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
  $('againBtn').onclick = () => startRound(round.catId, round.subId);
  $('menuBtn').onclick = renderMenu;
  $('startBtn').onclick = submitName;
  $('nameInput').onkeydown = e => { if (e.key === 'Enter') submitName(); };
  $('switchBtn').onclick = logout;

  // Start: log in the last player on this device or ask for a name
  const lastPlayer = (() => { try { return localStorage.getItem(LAST_PLAYER_KEY); } catch (e) { return null; } })();
  if (lastPlayer) login(lastPlayer);
  else renderLogin();
})();












