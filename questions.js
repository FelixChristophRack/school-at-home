// Question data for the German practice game.
// Every question: { id, cat, sub?, prompt, display?, options[], answer, hint }
// A category may have sub exercises (subs). The sub id of a question is derived in subIdFor().

const CATEGORIES = [
  { id: 'sss', name: 'S-Laute: s / ss / ß', icon: '🔠', weight: 3, desc: 'Besonders wichtig! Hier üben wir extra viel.',
    subs: [
      { id: 'sss-s', name: 's (weich)', desc: 'Summt das s? Dann nur s.' },
      { id: 'sss-ss', name: 'ss (kurzer Vokal)', desc: 'Kurz gesprochen – ss.' },
      { id: 'sss-ß', name: 'ß (langer Vokal)', desc: 'Lang gesprochen – ß.' },
      { id: 'dass', name: 'das oder dass?', desc: 'Mit der Probe „dieses“.' },
    ] },
  { id: 'nominal', name: 'Nominalisierung', icon: '✍️', weight: 3, desc: 'Verben & Adjektive als Nomen – großschreiben?',
    subs: [
      { id: 'nom-noun', name: 'Nomen erkennen', desc: 'Welches Wort ist ein Nomen?' },
      { id: 'nom-verb', name: 'Verben als Nomen', desc: 'beim Laufen, zum Schwimmen, das Lachen' },
      { id: 'nom-adj', name: 'Adjektive als Nomen', desc: 'etwas Neues, nichts Gutes, viel Süßes' },
      { id: 'nom-klein', name: 'Kein Signalwort: klein', desc: 'Wann bleibt das Verb klein?' },
    ] },
  { id: 'silben', name: 'Offene & geschlossene Silben', icon: '🧩', weight: 1, desc: 'Lang oder kurz gesprochen?' },
  { id: 'strategien', name: 'Rechtschreib-Strategien', icon: '🧭', weight: 2, desc: 'Zerlegen, Verlängern, Ableiten' },
  { id: 'doppel', name: 'Doppelkonsonanten', icon: '🔡', weight: 2, desc: 'Kurzer Vokal – doppelter Konsonant?',
    subs: [
      { id: 'doppel-kurz', name: 'Kurzer Vokal: doppelt', desc: 'Kanne, Sonne, Mutter' },
      { id: 'doppel-lang', name: 'Langer Vokal: einfach', desc: 'Nebel, Tafel, Hose' },
    ] },
  { id: 'genus', name: 'Genus & Numerus', icon: '📚', weight: 1, desc: 'der, die, das – Einzahl & Mehrzahl' },
  { id: 'regeln', name: 'Merksätze & Regeln', icon: '📜', weight: 2, desc: 'Kennst du alle Merksätze und Regeln der Rechtschreibung?' },
];

// ---------- Builders (small functions keep the data compact and testable) ----------

function buildQuestion(cat, prompt, display, options, answer, hint, sub) {
  return { cat, sub, prompt, display, options, answer, hint };
}

// Gap question: which letter(s) are missing?
function gap(cat, display, options, answer, hint) {
  return buildQuestion(cat, 'Welche Buchstaben fehlen?', display, options, answer, hint);
}

// Spelling question: which written word is correct?
function spelling(cat, correct, wrong, hint) {
  return buildQuestion(cat, 'Welches Wort ist richtig geschrieben?', '', [correct, wrong], correct, hint);
}

// Syllable question: open or closed first syllable?
function syllable(word, split, answer) {
  const hint = answer === 'offen'
    ? `${split}: Die erste Silbe endet auf einen Vokal und wird lang gesprochen.`
    : `${split}: Die erste Silbe endet auf einen Konsonanten und wird kurz gesprochen.`;
  return buildQuestion('silben', 'Ist die erste Silbe offen oder geschlossen?', word, ['offen', 'geschlossen'], answer, hint);
}

// Genus question: der, die or das?
function genus(noun, article) {
  return buildQuestion('genus', 'Welcher Artikel passt?', `___ ${noun}`, ['der', 'die', 'das'], article,
    `Richtig: ${article} ${noun}. Merke dir das Nomen immer mit Artikel!`);
}

// Plural question
function plural(singular, pl, wrongs) {
  return buildQuestion('genus', `Wie heißt die Mehrzahl (Plural) von „${singular}“?`, '', [pl, ...wrongs], pl,
    `Einzahl: ${singular} – Mehrzahl: ${pl}.`);
}

// Nominalization: capitalized or lowercase?
function nominal(sentenceWithGap, correct, wrong, hint, sub) {
  return buildQuestion('nominal', 'Wie schreibt man es richtig?', sentenceWithGap, [correct, wrong], correct, hint, sub);
}

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function lowerFirst(word) {
  return word.charAt(0).toLowerCase() + word.slice(1);
}

// Help text for a verb that became a noun
function verbHint(signal, word) {
  return `Signalwort „${signal}“ → „${lowerFirst(word)}“ wird zum Nomen: das ${word}. ` +
    `Probe: „das“ passt davor → großschreiben.`;
}

// Help text for an adjective that became a noun
function adjHint(signal, word) {
  return `Signalwort „${signal}“: ${signal} ${word}. Das Adjektiv wird zum Nomen → großschreiben.`;
}

// Help text for a verb without signal word
function smallHint(word) {
  return `Kein Signalwort davor (kein der/die/das, beim, zum, etwas …). „${word}“ bleibt ein Verb → kleinschreiben. ` +
    `Probe: „das ${word}“ passt nicht in den Satz.`;
}

// Verb as noun, e.g. "Beim ___ ..." -> Laufen
function nomVerb(sentence, signal, word) {
  return nominal(sentence, word, lowerFirst(word), verbHint(signal, word), 'nom-verb');
}

// Adjective as noun, e.g. "etwas ___" -> Neues
function nomAdj(sentence, signal, word) {
  return nominal(sentence, word, lowerFirst(word), adjHint(signal, word), 'nom-adj');
}

// Verb without signal word stays lowercase, e.g. "Ich kann gut ___." -> malen
function nomSmall(sentence, word) {
  return nominal(sentence, word, capitalize(word), smallHint(word), 'nom-klein');
}

// Rule question: asks about the rule / mnemonic itself (no help button for these)
function ruleQ(prompt, options, answer, hint) {
  return buildQuestion('regeln', prompt, '', options, answer, hint);
}

// Rules shown as help and in the rule book. memo = short mnemonic.
const RULES = [
  { id: 'sss-ß', cat: 'sss', title: 'ß nach langem Vokal', memo: 'Lang gesprochen – ß!',
    text: 'Nach einem langen Vokal oder einem Doppellaut (au, ei, eu) schreibt man ß, wenn der s-Laut scharf klingt. Beim Verlängern bleibt er scharf: Fuß – Füße, heiß – heißer, Straße.' },
  { id: 'sss-ss', cat: 'sss', title: 'ss nach kurzem Vokal', memo: 'Kurz gesprochen – ss!',
    text: 'Nach einem kurzen Vokal schreibt man ss: Fass – Fässer, Fluss – Flüsse, Wasser, müssen.' },
  { id: 'sss-s', cat: 'sss', title: 's bei weichem s-Laut', memo: 'Summt das s, schreib nur s!',
    text: 'Klingt das s beim Verlängern weich (gesummt), schreibt man ein einfaches s: Haus – Häuser, Glas – Gläser, Rose, Hase.' },
  { id: 'dass', cat: 'sss', title: 'das oder dass?', memo: 'Passt „dieses“ oder „welches“? Dann das – sonst dass!',
    text: 'Ersetze das Wort durch „dieses“ oder „welches“. Passt es, schreibt man „das“ (Das Buch liegt da. – dieses Buch). Passt es nicht, ist es das Bindewort „dass“ (Ich weiß, dass du mutig bist).' },
  { id: 'silben', cat: 'silben', title: 'Offene und geschlossene Silben', memo: 'Offen = lang, geschlossen = kurz.',
    text: 'Eine offene Silbe endet auf einen Vokal und der Vokal wird lang gesprochen (Ha-se). Eine geschlossene Silbe endet auf einen Konsonanten und der Vokal wird kurz gesprochen (Kan-ne).' },
  { id: 'zerlegen', cat: 'strategien', title: 'Zerlegen', memo: 'Sprich in Silben und hör genau hin!',
    text: 'Zerlege das Wort in Silben und sprich es langsam: Gar-ten, Ge-burts-tag. So hörst du jeden Buchstaben besser.' },
  { id: 'verlaengern', cat: 'strategien', title: 'Verlängern', memo: 'Unsicher am Ende – mach das Wort länger!',
    text: 'Am Wortende klingen b/p, d/t und g/k gleich. Verlängere das Wort (Mehrzahl oder Steigern) und höre nach: Hund – Hunde (d), Korb – Körbe (b), Berg – Berge (g).' },
  { id: 'ableiten-ä', cat: 'strategien', title: 'Ableiten (ä oder e?)', memo: 'Gibt es ein verwandtes Wort mit a? Dann ä!',
    text: 'Suche ein verwandtes Wort mit a: Wälder – Wald, Hände – Hand, Nächte – Nacht. Dann schreibt man ä.' },
  { id: 'ableiten-äu', cat: 'strategien', title: 'Ableiten (äu oder eu?)', memo: 'Gibt es ein verwandtes Wort mit au? Dann äu!',
    text: 'Suche ein verwandtes Wort mit au: Häuser – Haus, Mäuse – Maus, Bäume – Baum. Dann schreibt man äu.' },
  { id: 'doppel-kurz', cat: 'doppel', title: 'Doppelkonsonant', memo: 'Kurzer Vokal – zwei Konsonanten!',
    text: 'Nach einem kurzen, betonten Vokal folgt meist ein doppelter Konsonant: Kanne, Sonne, Mutter, Bett.' },
  { id: 'doppel-lang', cat: 'doppel', title: 'Kein Doppelkonsonant', memo: 'Langer Vokal – ein Konsonant!',
    text: 'Nach einem langen Vokal folgt nur ein Konsonant: Nebel, Tafel, Hose. Nach zwei verschiedenen Konsonanten wird nichts verdoppelt: Wolke.' },
  { id: 'genus', cat: 'genus', title: 'Genus (der, die, das)', memo: 'Lerne Nomen immer mit Artikel!',
    text: 'Jedes Nomen hat ein Genus: männlich (der), weiblich (die) oder sächlich (das). Lerne das Nomen immer mit Artikel: der Hund, die Sonne, das Haus.' },
  { id: 'plural', cat: 'genus', title: 'Numerus (Einzahl / Mehrzahl)', memo: 'Singular = einer, Plural = mehrere.',
    text: 'Numerus heißt Einzahl (Singular) oder Mehrzahl (Plural). Die Mehrzahl hat verschiedene Endungen: Katze – Katzen, Kind – Kinder, Maus – Mäuse.' },
  { id: 'nominal-noun', cat: 'nominal', title: 'Nomen erkennen', memo: 'Nomen schreibt man immer groß!',
    text: 'Nomen sind Namenwörter für Lebewesen, Dinge und Gedachtes (Angst, Freude). Nomen-Probe: Du kannst der, die oder das davorsetzen.',
    steps: ['Setze „der“, „die“ oder „das“ vor das Wort.', 'Klingt es richtig (die Freude, der Hund)? Dann ist es ein Nomen.', 'Nomen schreibt man immer groß.'],
    examples: ['der Hund ✔ → Hund', 'die Freude ✔ → Freude', 'das Lachen ✔ (Verb als Nomen) → Lachen', 'die laufen ✘ → laufen ist ein Verb'] },
  { id: 'nominal-signal', cat: 'nominal', title: 'Verben als Nomen', memo: 'Signalwort davor – groß!',
    text: 'Verben werden großgeschrieben, wenn sie zu Nomen werden. Signalwörter: Artikel (das, ein), versteckte Artikel (beim = bei dem, zum = zu dem, im = in dem, vom, aufs) und Adjektive davor (lautes Rufen).',
    steps: ['Suche das Wort vor der Lücke: Ist es das, ein, beim, zum, im, vom oder ein Adjektiv?', 'Dann kannst du „das“ davorsetzen: das Laufen, das Schwimmen.', 'Also wird das Verb zum Nomen → großschreiben!'],
    examples: ['beim Laufen (bei dem Laufen)', 'zum Schwimmen (zu dem Schwimmen)', 'das Lachen der Kinder', 'ein lautes Rufen'] },
  { id: 'nominal-adj', cat: 'nominal', title: 'Adjektive als Nomen', memo: 'etwas, nichts, viel, alles – dann groß!',
    text: 'Adjektive werden großgeschrieben, wenn sie zu Nomen werden. Signalwörter sind Mengenwörter wie etwas, nichts, viel, wenig, alles und Artikel (das Schönste, der Schnellere). Nach etwas, nichts, viel, wenig bekommt das Adjektiv oft die Endung -es: etwas Neues.',
    steps: ['Steht etwas, nichts, viel, wenig oder alles vor dem Wort?', 'Oder steht das / der davor (das Schönste)?', 'Dann ist das Adjektiv ein Nomen → großschreiben.'],
    examples: ['etwas Neues', 'nichts Gutes', 'viel Süßes', 'alles Liebe', 'das Schönste', 'im Dunkeln'] },
  { id: 'nominal-klein', cat: 'nominal', title: 'Kein Signalwort: kleinschreiben', memo: 'Ohne Signalwort bleibt das Verb klein!',
    text: 'Steht kein Signalwort vor dem Verb, bleibt es ein Verb und wird kleingeschrieben. Oft steht davor ein Wort wie wollen, können, müssen, gehen, zu oder ein Adverb (leise, gut).',
    steps: ['Gibt es ein Signalwort (das, beim, zum, im, etwas, nichts …) direkt vor dem Wort?', 'Nein? Dann probiere „das“ davor: Passt es im Satz nicht?', 'Dann ist es ein Verb → kleinschreiben.'],
    examples: ['Ich will schwimmen.', 'Wir müssen leise sprechen.', 'Er hört auf zu weinen.', 'Sie geht tanzen.'] },
];

function getRule(id) {
  return RULES.find(r => r.id === id) || null;
}

// Decide which rule belongs to a question (null for rule questions)
function ruleIdFor(q) {
  switch (q.cat) {
    case 'sss':
      if (q.prompt.startsWith('dass oder das')) return 'dass';
      if (q.answer.includes('ß')) return 'sss-ß';
      if (q.answer.includes('ss')) return 'sss-ss';
      return 'sss-s';
    case 'nominal': return NOMINAL_RULES[q.sub] || 'nominal-signal';
    case 'silben': return 'silben';
    case 'strategien':
      if (/^Zerlegen:/.test(q.hint)) return 'zerlegen';
      if (q.options.includes('äu')) return 'ableiten-äu';
      if (q.options.includes('ä')) return 'ableiten-ä';
      return 'verlaengern';
    case 'doppel': return /^(Langer Vokal|Nach zwei)/.test(q.hint) ? 'doppel-lang' : 'doppel-kurz';
    case 'genus': return q.prompt.startsWith('Welcher Artikel') ? 'genus' : 'plural';
    default: return null;
  }
}

// Maps a nominalization sub exercise to the rule that explains it
const NOMINAL_RULES = {
  'nom-noun': 'nominal-noun',
  'nom-verb': 'nominal-signal',
  'nom-adj': 'nominal-adj',
  'nom-klein': 'nominal-klein',
};

// Decide which sub exercise a question belongs to (null if its category has none)
function subIdFor(q) {
  switch (q.cat) {
    case 'sss':
    case 'doppel':
      return ruleIdFor(q);
    case 'nominal': return q.sub || null;
    default: return null;
  }
}

// Noun recognition
function isNoun(noun, others) {
  return buildQuestion('nominal', 'Welches Wort ist ein Nomen?', '', [noun, ...others], noun,
    `„${noun}“ ist ein Nomen: Man kann der, die oder das davorsetzen. Nomen schreibt man groß!`, 'nom-noun');
}

// ---------- Content ----------

const RAW_QUESTIONS = [
  // --- s / ss / ß (hard area for Johanna: many questions) ---
  gap('sss', 'Fu_', ['s', 'ss', 'ß'], 'ß', 'Verlängern: die Füße. Langer Vokal (u) → ß.'),
  gap('sss', 'Gru_', ['s', 'ss', 'ß'], 'ß', 'Verlängern: die Grüße. Langer Vokal → ß.'),
  gap('sss', 'Fa_', ['s', 'ss', 'ß'], 'ss', 'Verlängern: die Fässer. Kurzer Vokal (a) → ss.'),
  gap('sss', 'Wa_er', ['s', 'ss', 'ß'], 'ss', 'Wasser: Kurzer Vokal → ss.'),
  gap('sss', 'Ro_e', ['s', 'ss', 'ß'], 's', 'Rose: Der s-Laut ist weich (gesummt) → s.'),
  gap('sss', 'Ha_e', ['s', 'ss', 'ß'], 's', 'Hase: Weich gesummter s-Laut → s.'),
  gap('sss', 'Bi_', ['s', 'ss', 'ß'], 'ss', 'Verlängern: die Bisse. Kurzer Vokal → ss.'),
  gap('sss', 'Stra_e', ['s', 'ss', 'ß'], 'ß', 'Straße: Langer Vokal (a) → ß.'),
  gap('sss', 'Spa_', ['s', 'ss', 'ß'], 'ß', 'Spaß: Langer Vokal → ß.'),
  gap('sss', 'Schlo_', ['s', 'ss', 'ß'], 'ss', 'Verlängern: die Schlösser. Kurzer Vokal → ss.'),
  gap('sss', 'Flu_', ['s', 'ss', 'ß'], 'ss', 'Verlängern: die Flüsse. Kurzer Vokal → ss.'),
  gap('sss', 'Mau_', ['s', 'ss', 'ß'], 's', 'Verlängern: die Mäuse (weiches s) → s. Nach Doppellaut (au) kommt kein ss.'),
  gap('sss', 'Hau_', ['s', 'ss', 'ß'], 's', 'Verlängern: die Häuser (weiches s) → s.'),
  gap('sss', 'Gla_', ['s', 'ss', 'ß'], 's', 'Verlängern: die Gläser (weiches s) → s.'),
  gap('sss', 'Nu_', ['s', 'ss', 'ß'], 'ss', 'Verlängern: die Nüsse. Kurzer Vokal → ss.'),
  gap('sss', 'Sü_igkeiten', ['s', 'ss', 'ß'], 'ß', 'Süß: Langer Vokal (ü) → ß.'),
  gap('sss', 'wei_', ['s', 'ss', 'ß'], 'ß', 'Ich weiß: Doppellaut (ei) → ß.'),
  gap('sss', 'hei_', ['s', 'ss', 'ß'], 'ß', 'heiß: Doppellaut (ei) → ß.'),
  gap('sss', 'gro_', ['s', 'ss', 'ß'], 'ß', 'groß: Langer Vokal → ß.'),
  gap('sss', 'Ki_en', ['s', 'ss', 'ß'], 'ss', 'Kissen: Kurzer Vokal (i) → ss.'),
  gap('sss', 'Wie_e', ['s', 'ss', 'ß'], 's', 'Wiese: Weiches s nach langem Vokal → s.'),
  gap('sss', 'Fen_ter', ['s', 'ss', 'ß'], 's', 'Fenster: Hier hört man ein s vor dem t.'),
  gap('sss', 'mu_', ['s', 'ss', 'ß'], 'ss', 'Ich muss: Kurzer Vokal → ss. (müssen)'),
  gap('sss', 'Fü_e', ['s', 'ss', 'ß'], 'ß', 'Füße: Langer Vokal → ß.'),
  gap('sss', 'Kü_chen', ['s', 'ss', 'ß'], 'ss', 'küssen: Kurzer Vokal (ü) → ss.'),
  gap('sss', 'Ra_en', ['s', 'ss', 'ß'], 's', 'Rasen: Weiches s → s.'),
  gap('sss', 'Mei_ter', ['s', 'ss', 'ß'], 's', 'Meister: s vor t.'),
  gap('sss', 'Bi_chen', ['s', 'ss', 'ß'], 'ss', 'Bisschen: Kurzer Vokal (i) → ss.'),
  buildQuestion('sss', 'dass oder das?', 'Ich glaube, ___ es morgen regnet.', ['das', 'dass'], 'dass',
    'Probe: „dieses/welches“ passt nicht → dass (Bindewort).'),
  buildQuestion('sss', 'dass oder das?', '___ Heft liegt auf dem Tisch.', ['das', 'dass'], 'das',
    'Probe: „dieses Heft“ passt → das (Artikel).'),
  buildQuestion('sss', 'dass oder das?', 'Ich weiß, ___ du mutig bist.', ['das', 'dass'], 'dass',
    'Probe: „dieses“ passt nicht → dass.'),
  buildQuestion('sss', 'dass oder das?', 'Ich sehe ___ Auto vor dem Haus.', ['das', 'dass'], 'das',
    'Probe: „dieses Auto“ passt → das.'),
  spelling('sss', 'Fuß', 'Fus', 'Füße – langer Vokal, ß.'),
  spelling('sss', 'Schloss', 'Schloß', 'Schlösser – kurzer Vokal, ss.'),
  spelling('sss', 'Haus', 'Hauss', 'Häuser – weiches s.'),
  spelling('sss', 'Straße', 'Strasse', 'Langer Vokal → ß.'),
  spelling('sss', 'Fluss', 'Fluß', 'Flüsse – kurzer Vokal, ss.'),
  spelling('sss', 'heiß', 'heiss', 'Doppellaut ei → ß.'),

  // --- Nominalization (hard area) ---
  nomVerb('Beim ___ verliere ich die Luft.', 'beim', 'Laufen'),
  nomVerb('Ich gehe zum ___.', 'zum', 'Schwimmen'),
  nomVerb('Das ___ der Kinder ist laut.', 'das', 'Lachen'),
  nomSmall('Wir wollen heute Abend ___.', 'feiern'),
  nomSmall('Ich will ___ gehen.', 'schwimmen'),
  nomAdj('Er hat etwas ___ erlebt.', 'etwas', 'Interessantes'),
  nomAdj('Sie hat nichts ___ gesehen.', 'nichts', 'Neues'),
  nomAdj('Ich wünsche dir alles ___.', 'alles', 'Gute'),
  nomAdj('Ich esse viel ___.', 'viel', 'Süßes'),
  nomVerb('Zum ___ brauche ich eine Schere.', 'zum', 'Basteln'),
  nomVerb('Beim ___ habe ich viel Spaß.', 'beim', 'Malen'),
  nomVerb('Ich höre ein leises ___.', 'leises', 'Flüstern'),
  nomVerb('Ein lautes ___ kommt von draußen.', 'lautes', 'Rufen'),
  nomAdj('Das ___ an den Ferien ist die Freiheit.', 'das', 'Schönste'),
  nomSmall('Die Kinder dürfen heute lange ___.', 'aufbleiben'),
  nomAdj('Im ___ sieht man schlecht.', 'im', 'Dunkeln'),
  nomVerb('Das ___ macht mir Spaß.', 'das', 'Tanzen'),
  nomSmall('Wir müssen ___ und nicht nur zuschauen.', 'mitmachen'),
  nomVerb('Das ___ von Briefmarken macht Spaß.', 'das', 'Sammeln'),
  nomVerb('Sie freut sich auf das ___.', 'das', 'Wandern'),
  isNoun('Hund', ['laufen', 'freundlich', 'schnell']),
  isNoun('Schule', ['lernen', 'müde', 'leise']),
  isNoun('Freude', ['lachen', 'fröhlich', 'singen']),

  // --- Open and closed syllables ---
  syllable('Hase', 'Ha-se', 'offen'),
  syllable('Rose', 'Ro-se', 'offen'),
  syllable('Wiese', 'Wie-se', 'offen'),
  syllable('Nebel', 'Ne-bel', 'offen'),
  syllable('Tafel', 'Ta-fel', 'offen'),
  syllable('Kuchen', 'Ku-chen', 'offen'),
  syllable('Dose', 'Do-se', 'offen'),
  syllable('Biene', 'Bie-ne', 'offen'),
  syllable('Süßigkeiten', 'Sü-ßig-kei-ten', 'offen'),
  syllable('Garten', 'Gar-ten', 'geschlossen'),
  syllable('Fenster', 'Fens-ter', 'geschlossen'),
  syllable('Sonne', 'Son-ne', 'geschlossen'),
  syllable('Mutter', 'Mut-ter', 'geschlossen'),
  syllable('Wolke', 'Wol-ke', 'geschlossen'),
  syllable('Lampe', 'Lam-pe', 'geschlossen'),
  syllable('Ratte', 'Rat-te', 'geschlossen'),
  syllable('Lehrer', 'Leh-rer', 'offen'),
  syllable('Katze', 'Kat-ze', 'geschlossen'),
  syllable('Schule', 'Schu-le', 'offen'),

  // --- Strategies: Zerlegen, Verlängern, Ableiten ---
  gap('strategien', 'Gar_en', ['t', 'd'], 't', 'Zerlegen: Gar-ten. Das t hört man am Silbenanfang.'),
  gap('strategien', 'Ge_urtstag', ['b', 'p'], 'b', 'Zerlegen: Ge-burts-tag.'),
  gap('strategien', 'Hun_', ['d', 't'], 'd', 'Zerlegen & Verlängern: Hund – Hunde.'),
  gap('strategien', 'Ber_', ['g', 'k'], 'g', 'Verlängern: Berg – Berge.'),
  gap('strategien', 'Kor_', ['b', 'p'], 'b', 'Verlängern: Korb – Körbe.'),
  gap('strategien', 'Bil_', ['d', 't'], 'd', 'Verlängern: Bild – Bilder.'),
  gap('strategien', 'Ta_', ['g', 'k'], 'g', 'Verlängern: Tag – Tage.'),
  gap('strategien', 'Sta_', ['b', 'p'], 'b', 'Verlängern: Stab – Stäbe.'),
  gap('strategien', 'We_', ['g', 'k'], 'g', 'Verlängern: Weg – Wege.'),
  gap('strategien', 'Ra_', ['d', 't'], 'd', 'Verlängern: Rad – Räder.'),
  gap('strategien', 'Wal_', ['d', 't'], 'd', 'Verlängern: Wald – Wälder.'),
  gap('strategien', 'gel_', ['b', 'p'], 'b', 'Verlängern: gelb – gelbe.'),
  gap('strategien', 'M_use', ['äu', 'eu'], 'äu', 'Ableiten: Mäuse kommt von Maus → äu.'),
  gap('strategien', 'H_user', ['äu', 'eu'], 'äu', 'Ableiten: Häuser kommt von Haus → äu.'),
  gap('strategien', 'B_me', ['äu', 'eu'], 'äu', 'Ableiten: Bäume kommt von Baum → äu.'),
  gap('strategien', 'R_me', ['äu', 'eu'], 'äu', 'Ableiten: Räume kommt von Raum → äu.'),
  gap('strategien', 'W_lder', ['ä', 'e'], 'ä', 'Ableiten: Wälder kommt von Wald → ä.'),
  gap('strategien', 'N_chte', ['ä', 'e'], 'ä', 'Ableiten: Nächte kommt von Nacht → ä.'),
  gap('strategien', 'Z_hne', ['ä', 'e'], 'ä', 'Ableiten: Zähne kommt von Zahn → ä.'),
  gap('strategien', 'H_nde', ['ä', 'e'], 'ä', 'Ableiten: Hände kommt von Hand → ä.'),
  gap('strategien', 'St_dte', ['ä', 'e'], 'ä', 'Ableiten: Städte kommt von Stadt → ä.'),
  gap('strategien', 'St_rke', ['ä', 'e'], 'ä', 'Ableiten: Stärke kommt von stark → ä.'),

  // --- Double consonants ---
  spelling('doppel', 'Kanne', 'Kane', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Mutter', 'Muter', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Sonne', 'Sone', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Brille', 'Brile', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Kette', 'Kete', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Treppe', 'Trepe', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Wetter', 'Weter', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Bett', 'Bet', 'Kurzer Vokal → Verlängern: Betten.'),
  spelling('doppel', 'Hammer', 'Hamer', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Zimmer', 'Zimer', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Himmel', 'Himel', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'kommen', 'komen', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Mittag', 'Mitag', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Löffel', 'Löfel', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Gitter', 'Giter', 'Kurzer Vokal → doppelter Konsonant.'),
  spelling('doppel', 'Tafel', 'Taffel', 'Langer Vokal → nur ein Konsonant.'),
  spelling('doppel', 'Nebel', 'Nebbel', 'Langer Vokal → nur ein Konsonant.'),
  spelling('doppel', 'Hose', 'Hosse', 'Langer Vokal → nur ein Konsonant.'),
  spelling('doppel', 'Wolke', 'Wollke', 'Nach zwei verschiedenen Konsonanten (lk) wird nichts verdoppelt.'),

  // --- Genus ---
  genus('Hund', 'der'), genus('Sonne', 'die'), genus('Haus', 'das'),
  genus('Tisch', 'der'), genus('Lampe', 'die'), genus('Fenster', 'das'),
  genus('Mond', 'der'), genus('Blume', 'die'), genus('Heft', 'das'),
  genus('Garten', 'der'), genus('Tasche', 'die'), genus('Buch', 'das'),
  genus('Schule', 'die'), genus('Lehrer', 'der'), genus('Auto', 'das'),
  plural('Blume', 'Blumen', ['Blumer', 'Blume']),
  plural('Apfel', 'Äpfel', ['Apfeln', 'Apfels']),
  plural('Maus', 'Mäuse', ['Mause', 'Meuse']),
  plural('Kind', 'Kinder', ['Kinden', 'Kinde']),
  plural('Haus', 'Häuser', ['Hausen', 'Heuser']),
  plural('Heft', 'Hefte', ['Heften', 'Heftes']),
  plural('Lampe', 'Lampen', ['Lamper', 'Lampe']),
  plural('Hase', 'Hasen', ['Häser', 'Hase']),
  plural('Nacht', 'Nächte', ['Nachten', 'Nechte']),
  plural('Zahn', 'Zähne', ['Zahnen', 'Zehne']),
  plural('Buch', 'Bücher', ['Buchen', 'Buche']),
  plural('Stuhl', 'Stühle', ['Stuhlen', 'Stuhle']),
  plural('Hand', 'Hände', ['Handen', 'Hende']),
  plural('Katze', 'Katzen', ['Katzer', 'Katzes']),

  // --- Rules and mnemonics (appended last so existing ids stay stable) ---
  ruleQ('Nach einem KURZEN Vokal schreibt man (beim scharfen s-Laut) …', ['ss', 'ß'], 'ss', 'Kurz gesprochen – ss! (Fass – Fässer)'),
  ruleQ('Nach einem LANGEN Vokal oder Doppellaut (z. B. ei) schreibt man (beim scharfen s-Laut) …', ['ss', 'ß'], 'ß', 'Lang gesprochen – ß! (Fuß – Füße, heiß)'),
  ruleQ('Wenn das s beim Verlängern weich gesummt klingt (Haus – Häuser), schreibt man …', ['s', 'ss', 'ß'], 's', 'Summt das s, schreib nur s! (Rose, Hase, Glas)'),
  ruleQ('Fuß – Füße: Warum schreibt man ß?', ['Langer Vokal', 'Kurzer Vokal', 'Weiches s'], 'Langer Vokal', 'Lang gesprochen – ß!'),
  ruleQ('Fass – Fässer: Warum schreibt man ss?', ['Kurzer Vokal', 'Langer Vokal', 'Weiches s'], 'Kurzer Vokal', 'Kurz gesprochen – ss!'),
  ruleQ('Rose: Warum schreibt man nur ein s?', ['Das s wird weich gesummt', 'Der Vokal ist kurz', 'Es ist ein Verb'], 'Das s wird weich gesummt', 'Summt das s, schreib nur s!'),
  ruleQ('Wann schreibt man „das“ mit einem s?', ['Wenn man „dieses“ oder „welches“ einsetzen kann', 'Wenn „dieses“ nicht passt'], 'Wenn man „dieses“ oder „welches“ einsetzen kann', 'das = Artikel oder Pronomen. Probe: dieses/welches.'),
  ruleQ('Wann schreibt man „dass“ mit ss?', ['Wenn „dieses“ nicht passt', 'Wenn „dieses“ passt'], 'Wenn „dieses“ nicht passt', 'dass ist ein Bindewort. Probe: dieses/welches passt nicht.'),
  ruleQ('Eine OFFENE Silbe endet auf …', ['einen Vokal', 'einen Konsonanten'], 'einen Vokal', 'Offene Silbe: Ha-se – der Vokal wird lang gesprochen.'),
  ruleQ('Eine GESCHLOSSENE Silbe endet auf …', ['einen Konsonanten', 'einen Vokal'], 'einen Konsonanten', 'Geschlossene Silbe: Kan-ne – der Vokal wird kurz gesprochen.'),
  ruleQ('In einer offenen Silbe wird der Vokal …', ['lang gesprochen', 'kurz gesprochen'], 'lang gesprochen', 'Offen = lang (Ha-se).'),
  ruleQ('In einer geschlossenen Silbe wird der Vokal …', ['kurz gesprochen', 'lang gesprochen'], 'kurz gesprochen', 'Geschlossen = kurz (Kan-ne).'),
  ruleQ('Welche Strategie hilft bei „Hun_“ (Hunde)?', ['Zerlegen', 'Verlängern', 'Ableiten'], 'Verlängern', 'Am Wortende hört man b/p, d/t, g/k nicht. Mach das Wort länger: Hund – Hunde.'),
  ruleQ('Welche Strategie hilft bei „M_use“ (Maus)?', ['Zerlegen', 'Verlängern', 'Ableiten'], 'Ableiten', 'Ableiten: Suche ein verwandtes Wort. Mäuse – Maus → äu.'),
  ruleQ('Welche Strategie hilft bei „Gar_en“ (Gar-ten)?', ['Zerlegen', 'Verlängern', 'Ableiten'], 'Zerlegen', 'Zerlegen: Sprich in Silben und hör genau hin: Gar-ten.'),
  ruleQ('Wann verlängert man ein Wort?', ['Wenn man am Wortende b/p, d/t oder g/k nicht unterscheiden kann', 'Wenn man ä oder e nicht unterscheiden kann', 'Wenn das Wort sehr kurz ist'], 'Wenn man am Wortende b/p, d/t oder g/k nicht unterscheiden kann', 'Verlängern: Berg – Berge.'),
  ruleQ('Wann leitet man ab?', ['Wenn man nicht weiß, ob ä/e oder äu/eu', 'Wenn man b/p am Wortende nicht hört'], 'Wenn man nicht weiß, ob ä/e oder äu/eu', 'Ableiten: Wälder – Wald, Häuser – Haus.'),
  ruleQ('Nach einem KURZEN Vokal folgt meist …', ['ein Doppelkonsonant', 'ein einzelner Konsonant'], 'ein Doppelkonsonant', 'Kurzer Vokal – zwei Konsonanten (Kanne, Sonne).'),
  ruleQ('Nach einem LANGEN Vokal folgt meist …', ['ein einzelner Konsonant', 'ein Doppelkonsonant'], 'ein einzelner Konsonant', 'Langer Vokal – ein Konsonant (Nebel, Tafel).'),
  ruleQ('Nomen schreibt man immer …', ['groß', 'klein'], 'groß', 'Nomen = Namenwörter, immer großschreiben.'),
  ruleQ('Woran erkennt man ein Nomen?', ['Man kann der, die oder das davorsetzen', 'Man kann es steigern', 'Man kann es in die Vergangenheit setzen'], 'Man kann der, die oder das davorsetzen', 'Nomen-Probe: der/die/das davor.'),
  ruleQ('Welche Wörter sind Signalwörter für ein Nomen?', ['das, beim, zum, im', 'und, aber, oder', 'schnell, laut, leise'], 'das, beim, zum, im', 'Signalwort davor – groß! Auch etwas, nichts, viel, alles und Adjektive.'),
  ruleQ('Nach „etwas“, „nichts“, „viel“, „alles“ wird ein Adjektiv …', ['großgeschrieben', 'kleingeschrieben'], 'großgeschrieben', 'etwas Gutes, nichts Neues, viel Süßes.'),
  ruleQ('„Genus“ bedeutet …', ['grammatisches Geschlecht (der, die, das)', 'Einzahl und Mehrzahl'], 'grammatisches Geschlecht (der, die, das)', 'Genus: der, die, das.'),
  ruleQ('„Numerus“ bedeutet …', ['Einzahl und Mehrzahl', 'grammatisches Geschlecht (der, die, das)'], 'Einzahl und Mehrzahl', 'Numerus: Singular und Plural.'),
];

// Additional questions. They are appended AFTER all others so existing question ids (and saved progress) stay stable.
const EXTRA_QUESTIONS = [
  // --- Nomen erkennen ---
  isNoun('Angst', ['rennen', 'mutig', 'schnell']),
  isNoun('Lehrerin', ['rechnen', 'klug', 'fröhlich']),
  isNoun('Mut', ['mutig', 'springen', 'laut']),
  isNoun('Katze', ['miauen', 'weich', 'schlafen']),
  isNoun('Spiel', ['spielen', 'lustig', 'schön']),
  isNoun('Idee', ['denken', 'klug', 'neu']),
  isNoun('Kälte', ['kalt', 'frieren', 'eisig']),
  isNoun('Traum', ['träumen', 'müde', 'leise']),
  isNoun('Ärger', ['ärgern', 'wütend', 'böse']),
  isNoun('Wärme', ['warm', 'wärmen', 'heiß']),
  isNoun('Lachen', ['lustig', 'freundlich', 'fröhlich']),

  // --- Verben als Nomen (Signalwort davor) ---
  nomVerb('Beim ___ wird mir warm.', 'beim', 'Rennen'),
  nomVerb('Das ___ macht mich müde.', 'das', 'Lernen'),
  nomVerb('Zum ___ brauche ich Ruhe.', 'zum', 'Schlafen'),
  nomVerb('Im ___ bin ich gut.', 'im', 'Zeichnen'),
  nomVerb('Beim ___ hört er Musik.', 'beim', 'Kochen'),
  nomVerb('Das ___ am Abend ist gemütlich.', 'das', 'Lesen'),
  nomVerb('Wir gehen zum ___ an den See.', 'zum', 'Angeln'),
  nomVerb('Vor dem ___ wasche ich die Hände.', 'dem', 'Essen'),
  nomVerb('Das ___ im Flur ist verboten.', 'das', 'Schreien'),
  nomVerb('Beim ___ darf man nicht schummeln.', 'beim', 'Spielen'),
  nomVerb('Mit lautem ___ rennt er davon.', 'lautem', 'Lachen'),
  nomVerb('Ein lautes ___ weckt mich auf.', 'lautes', 'Klopfen'),
  nomVerb('Zum ___ brauchst du Geduld.', 'zum', 'Backen'),
  nomVerb('Beim ___ der Zähne soll man nicht schlucken.', 'beim', 'Putzen'),
  nomVerb('Das ___ der Vögel höre ich gern.', 'das', 'Zwitschern'),
  nomVerb('Ich freue mich aufs ___.', 'aufs', 'Reiten'),
  nomVerb('Vom ___ bekomme ich Muskelkater.', 'vom', 'Turnen'),
  nomVerb('Beim ___ hilft mir meine Oma.', 'beim', 'Nähen'),
  nomVerb('Das ___ im Chor macht Freude.', 'das', 'Singen'),
  nomVerb('Beim ___ bin ich gern allein.', 'beim', 'Nachdenken'),

  // --- Adjektive als Nomen (etwas, nichts, viel, alles, das ...) ---
  nomAdj('Ich habe etwas ___ gehört.', 'etwas', 'Lustiges'),
  nomAdj('Er erzählt nichts ___.', 'nichts', 'Wichtiges'),
  nomAdj('Es gibt viel ___ zu entdecken.', 'viel', 'Neues'),
  nomAdj('Sie hat etwas ___ gefunden.', 'etwas', 'Seltsames'),
  nomAdj('Ich möchte etwas ___ trinken.', 'etwas', 'Kaltes'),
  nomAdj('Zum Geburtstag gibt es etwas ___.', 'etwas', 'Leckeres'),
  nomAdj('Auf dem Bild ist nichts ___ zu sehen.', 'nichts', 'Besonderes'),
  nomAdj('Er hat wenig ___ gesagt.', 'wenig', 'Gutes'),
  nomAdj('Das ___ an ihm ist seine Ehrlichkeit.', 'das', 'Beste'),
  nomAdj('Das ___ kommt zum Schluss.', 'das', 'Wichtigste'),
  nomAdj('Ich suche etwas ___ zum Anziehen.', 'etwas', 'Warmes'),
  nomAdj('Mama kocht etwas ___.', 'etwas', 'Gesundes'),
  nomAdj('Zum Glück ist nichts ___ passiert.', 'nichts', 'Schlimmes'),
  nomAdj('Der ___ von beiden gewinnt.', 'der', 'Schnellere'),
  nomAdj('Wir erleben viel ___.', 'viel', 'Aufregendes'),

  // --- Kein Signalwort: Verb bleibt klein ---
  nomSmall('Ich kann gut ___.', 'malen'),
  nomSmall('Du darfst heute ___.', 'mitspielen'),
  nomSmall('Wir müssen leise ___.', 'sprechen'),
  nomSmall('Sie liebt es zu ___.', 'tanzen'),
  nomSmall('Er will schnell ___.', 'rennen'),
  nomSmall('Hier darf man nicht ___.', 'parken'),
  nomSmall('Kannst du mir bitte ___?', 'helfen'),
  nomSmall('Wir wollen im Garten ___.', 'grillen'),
  nomSmall('Ich werde dich morgen ___.', 'besuchen'),
  nomSmall('Die Katze will ___.', 'schlafen'),
  nomSmall('Wir fangen gleich an zu ___.', 'singen'),
  nomSmall('Er hört auf zu ___.', 'weinen'),
  nomSmall('Mia geht gern ___.', 'reiten'),
  nomSmall('Ich muss noch ___.', 'aufräumen'),
  nomSmall('Wir dürfen heute draußen ___.', 'toben'),
];

// Assign stable ids (category + running number)
const QUESTIONS = [...RAW_QUESTIONS, ...EXTRA_QUESTIONS]
  .map((q, i) => ({ ...q, id: `${q.cat}-${i}` }))
  .map(q => ({ ...q, ruleId: ruleIdFor(q), sub: subIdFor(q) }));

if (typeof module !== 'undefined') {
  module.exports = { CATEGORIES, QUESTIONS, RULES, ruleIdFor, subIdFor, getRule, nomVerb, nomAdj, nomSmall };
}





