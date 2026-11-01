// Question data for the German practice game.
// Every question: { id, cat, prompt, display?, options[], answer, hint }

const CATEGORIES = [
  { id: 'sss', name: 'S-Laute: s / ss / ß', icon: '🕷️', weight: 3, desc: 'Gruselig wichtig! Hier üben wir extra viel.' },
  { id: 'nominal', name: 'Nominalisierung', icon: '🧙‍♀️', weight: 3, desc: 'Verben & Adjektive als Nomen – großschreiben?' },
  { id: 'silben', name: 'Offene & geschlossene Silben', icon: '🦇', weight: 1, desc: 'Lang oder kurz gesprochen?' },
  { id: 'strategien', name: 'Rechtschreib-Strategien', icon: '🔮', weight: 2, desc: 'Zerlegen, Verlängern, Ableiten' },
  { id: 'doppel', name: 'Doppelkonsonanten', icon: '🎃', weight: 2, desc: 'Kurzer Vokal – doppelter Konsonant?' },
  { id: 'genus', name: 'Genus & Numerus', icon: '👻', weight: 1, desc: 'der, die, das – Einzahl & Mehrzahl' },
  { id: 'regeln', name: 'Merksätze & Regeln', icon: '📜', weight: 2, desc: 'Kennst du alle Zaubersprüche der Rechtschreibung?' },
];

// ---------- Builders (small functions keep the data compact and testable) ----------

function buildQuestion(cat, prompt, display, options, answer, hint) {
  return { cat, prompt, display, options, answer, hint };
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
function nominal(sentenceWithGap, correct, wrong, hint) {
  return buildQuestion('nominal', 'Wie schreibt man es richtig?', sentenceWithGap, [correct, wrong], correct, hint);
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
    text: 'Ersetze das Wort durch „dieses“ oder „welches“. Passt es, schreibt man „das“ (Das Gespenst spukt. – dieses Gespenst). Passt es nicht, ist es das Bindewort „dass“ (Ich weiß, dass du mutig bist).' },
  { id: 'silben', cat: 'silben', title: 'Offene und geschlossene Silben', memo: 'Offen = lang, geschlossen = kurz.',
    text: 'Eine offene Silbe endet auf einen Vokal und der Vokal wird lang gesprochen (Ha-se). Eine geschlossene Silbe endet auf einen Konsonanten und der Vokal wird kurz gesprochen (Kan-ne).' },
  { id: 'zerlegen', cat: 'strategien', title: 'Zerlegen', memo: 'Sprich in Silben und hör genau hin!',
    text: 'Zerlege das Wort in Silben und sprich es langsam: Kür-bis, Ge-burts-tag. So hörst du jeden Buchstaben besser.' },
  { id: 'verlaengern', cat: 'strategien', title: 'Verlängern', memo: 'Unsicher am Ende – mach das Wort länger!',
    text: 'Am Wortende klingen b/p, d/t und g/k gleich. Verlängere das Wort (Mehrzahl oder Steigern) und höre nach: Hund – Hunde (d), Korb – Körbe (b), Berg – Berge (g).' },
  { id: 'ableiten-ä', cat: 'strategien', title: 'Ableiten (ä oder e?)', memo: 'Gibt es ein verwandtes Wort mit a? Dann ä!',
    text: 'Suche ein verwandtes Wort mit a: Wälder – Wald, Hände – Hand, Nächte – Nacht. Dann schreibt man ä.' },
  { id: 'ableiten-äu', cat: 'strategien', title: 'Ableiten (äu oder eu?)', memo: 'Gibt es ein verwandtes Wort mit au? Dann äu!',
    text: 'Suche ein verwandtes Wort mit au: Häuser – Haus, Mäuse – Maus, Bäume – Baum. Dann schreibt man äu.' },
  { id: 'doppel-kurz', cat: 'doppel', title: 'Doppelkonsonant', memo: 'Kurzer Vokal – zwei Konsonanten!',
    text: 'Nach einem kurzen, betonten Vokal folgt meist ein doppelter Konsonant: Kanne, Sonne, Mutter, Bett.' },
  { id: 'doppel-lang', cat: 'doppel', title: 'Kein Doppelkonsonant', memo: 'Langer Vokal – ein Konsonant!',
    text: 'Nach einem langen Vokal folgt nur ein Konsonant: Nebel, Rabe, Besen. Nach zwei verschiedenen Konsonanten wird nichts verdoppelt: Wolke.' },
  { id: 'genus', cat: 'genus', title: 'Genus (der, die, das)', memo: 'Lerne Nomen immer mit Artikel!',
    text: 'Jedes Nomen hat ein Genus: männlich (der), weiblich (die) oder sächlich (das). Lerne das Nomen immer mit Artikel: der Kürbis, die Hexe, das Gespenst.' },
  { id: 'plural', cat: 'genus', title: 'Numerus (Einzahl / Mehrzahl)', memo: 'Singular = einer, Plural = mehrere.',
    text: 'Numerus heißt Einzahl (Singular) oder Mehrzahl (Plural). Die Mehrzahl hat verschiedene Endungen: Hexe – Hexen, Geist – Geister, Maus – Mäuse.' },
  { id: 'nominal-noun', cat: 'nominal', title: 'Nomen erkennen', memo: 'Nomen schreibt man immer groß!',
    text: 'Nomen sind Namenwörter für Lebewesen, Dinge und Gedachtes (Angst, Freude). Nomen-Probe: Du kannst der, die oder das davorsetzen.' },
  { id: 'nominal-signal', cat: 'nominal', title: 'Nominalisierung', memo: 'Signalwort davor – groß!',
    text: 'Verben und Adjektive werden großgeschrieben, wenn sie zu Nomen werden. Signalwörter: Artikel (das, ein), versteckte Artikel (beim, zum, im), Adjektive (lautes Heulen) und Mengenwörter (etwas, nichts, viel, alles). Steht kein Signalwort davor, bleibt das Verb klein.' },
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
    case 'nominal':
      return q.prompt.startsWith('Welches Wort ist ein Nomen') ? 'nominal-noun' : 'nominal-signal';
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

// Noun recognition
function isNoun(noun, others) {
  return buildQuestion('nominal', 'Welches Wort ist ein Nomen?', '', [noun, ...others], noun,
    `„${noun}“ ist ein Nomen: Man kann der, die oder das davorsetzen. Nomen schreibt man groß!`);
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
  gap('sss', 'Be_en', ['s', 'ss', 'ß'], 's', 'Besen: Weiches s nach langem Vokal → s.'),
  gap('sss', 'Gespen_t', ['s', 'ss', 'ß'], 's', 'Gespenst: Hier hört man ein s vor dem t.'),
  gap('sss', 'mu_', ['s', 'ss', 'ß'], 'ss', 'Ich muss: Kurzer Vokal → ss. (müssen)'),
  gap('sss', 'Fü_e', ['s', 'ss', 'ß'], 'ß', 'Füße: Langer Vokal → ß.'),
  gap('sss', 'Kü_chen', ['s', 'ss', 'ß'], 'ss', 'küssen: Kurzer Vokal (ü) → ss.'),
  gap('sss', 'Ra_en', ['s', 'ss', 'ß'], 's', 'Rasen: Weiches s → s.'),
  gap('sss', 'Mei_ter', ['s', 'ss', 'ß'], 's', 'Meister: s vor t.'),
  gap('sss', 'Bi_chen', ['s', 'ss', 'ß'], 'ss', 'Bisschen: Kurzer Vokal (i) → ss.'),
  buildQuestion('sss', 'dass oder das?', 'Ich glaube, ___ Gespenster nachts spuken.', ['das', 'dass'], 'dass',
    'Probe: „dieses/welches“ passt nicht → dass (Bindewort).'),
  buildQuestion('sss', 'dass oder das?', '___ Gespenst sitzt im Schrank.', ['das', 'dass'], 'das',
    'Probe: „dieses Gespenst“ passt → das (Artikel).'),
  buildQuestion('sss', 'dass oder das?', 'Ich weiß, ___ du mutig bist.', ['das', 'dass'], 'dass',
    'Probe: „dieses“ passt nicht → dass.'),
  buildQuestion('sss', 'dass oder das?', 'Ich sehe ___ Skelett im Garten.', ['das', 'dass'], 'das',
    'Probe: „dieses Skelett“ passt → das.'),
  spelling('sss', 'Fuß', 'Fus', 'Füße – langer Vokal, ß.'),
  spelling('sss', 'Schloss', 'Schloß', 'Schlösser – kurzer Vokal, ss.'),
  spelling('sss', 'Haus', 'Hauss', 'Häuser – weiches s.'),
  spelling('sss', 'Straße', 'Strasse', 'Langer Vokal → ß.'),
  spelling('sss', 'Fluss', 'Fluß', 'Flüsse – kurzer Vokal, ss.'),
  spelling('sss', 'heiß', 'heiss', 'Doppellaut ei → ß.'),

  // --- Nominalization (hard area) ---
  nominal('Beim ___ verliere ich die Luft.', 'Laufen', 'laufen', 'Signalwort „beim“ → das Verb wird zum Nomen → großschreiben.'),
  nominal('Ich gehe zum ___.', 'Schwimmen', 'schwimmen', 'Signalwort „zum“ → Nomen → großschreiben.'),
  nominal('Das ___ der Kinder ist laut.', 'Lachen', 'lachen', 'Signalwort „das“ → Nomen.'),
  nominal('Wir wollen heute Abend ___.', 'feiern', 'Feiern', 'Hier steht kein Signalwort. Es ist ein Verb → kleinschreiben.'),
  nominal('Ich will ___ gehen.', 'schwimmen', 'Schwimmen', 'Kein Artikel davor → Verb → kleinschreiben.'),
  nominal('Er hat etwas ___ erlebt.', 'Gruseliges', 'gruseliges', 'Signalwort „etwas“ → Adjektiv wird zum Nomen.'),
  nominal('Sie hat nichts ___ gesehen.', 'Neues', 'neues', 'Signalwort „nichts“ → Nomen.'),
  nominal('Ich wünsche dir alles ___.', 'Gute', 'gute', 'Signalwort „alles“ → Nomen.'),
  nominal('Ich esse viel ___.', 'Süßes', 'süßes', 'Signalwort „viel“ → Nomen.'),
  nominal('Zum ___ brauche ich eine Schere.', 'Basteln', 'basteln', 'Signalwort „zum“ → Nomen.'),
  nominal('Beim ___ habe ich viel Spaß.', 'Verkleiden', 'verkleiden', 'Signalwort „beim“ → Nomen.'),
  nominal('Ich höre ein leises ___.', 'Kratzen', 'kratzen', 'Adjektiv „leises“ steht davor → Nomen.'),
  nominal('Ein lautes ___ kommt aus dem Keller.', 'Heulen', 'heulen', 'Adjektiv „lautes“ davor → Nomen.'),
  nominal('Das ___ an Halloween ist die Verkleidung.', 'Schönste', 'schönste', 'Signalwort „das“ → Nomen.'),
  nominal('Die Kinder dürfen heute lange ___.', 'aufbleiben', 'Aufbleiben', 'Kein Signalwort → Verb → kleinschreiben.'),
  nominal('Im ___ der Nacht heult ein Wolf.', 'Dunkel', 'dunkel', 'Signalwort „im“ → Nomen.'),
  nominal('Das ___ macht mir keine Angst.', 'Gruseln', 'gruseln', 'Signalwort „das“ → Nomen.'),
  nominal('Wir müssen ___ und nicht nur zuschauen.', 'mitmachen', 'Mitmachen', 'Kein Signalwort → Verb.'),
  nominal('Das ___ von Süßigkeiten macht Spaß.', 'Sammeln', 'sammeln', 'Signalwort „das“ → Nomen.'),
  nominal('Sie freut sich auf das ___.', 'Verkleiden', 'verkleiden', 'Signalwort „das“ → Nomen.'),
  isNoun('Gespenst', ['laufen', 'gruselig', 'schnell']),
  isNoun('Kürbis', ['leuchten', 'dunkel', 'leise']),
  isNoun('Angst', ['fürchten', 'mutig', 'heulen']),

  // --- Open and closed syllables ---
  syllable('Hase', 'Ha-se', 'offen'),
  syllable('Rose', 'Ro-se', 'offen'),
  syllable('Besen', 'Be-sen', 'offen'),
  syllable('Nebel', 'Ne-bel', 'offen'),
  syllable('Rabe', 'Ra-be', 'offen'),
  syllable('Kuchen', 'Ku-chen', 'offen'),
  syllable('Dose', 'Do-se', 'offen'),
  syllable('Fledermaus', 'Fle-der-maus', 'offen'),
  syllable('Süßigkeiten', 'Sü-ßig-kei-ten', 'offen'),
  syllable('Kerze', 'Ker-ze', 'geschlossen'),
  syllable('Kürbis', 'Kür-bis', 'geschlossen'),
  syllable('Spinne', 'Spin-ne', 'geschlossen'),
  syllable('Mutter', 'Mut-ter', 'geschlossen'),
  syllable('Wolke', 'Wol-ke', 'geschlossen'),
  syllable('Lampe', 'Lam-pe', 'geschlossen'),
  syllable('Ratte', 'Rat-te', 'geschlossen'),
  syllable('Gespenst', 'Ge-spenst', 'offen'),
  syllable('Katze', 'Kat-ze', 'geschlossen'),
  syllable('Zauberer', 'Zau-be-rer', 'offen'),

  // --- Strategies: Zerlegen, Verlängern, Ableiten ---
  gap('strategien', 'Kür_is', ['b', 'p'], 'b', 'Zerlegen: Kür-bis. Das b hört man am Silbenanfang.'),
  gap('strategien', 'Ge_urtstag', ['b', 'p'], 'b', 'Zerlegen: Ge-burts-tag.'),
  gap('strategien', 'Hun_', ['d', 't'], 'd', 'Zerlegen & Verlängern: Hund – Hunde.'),
  gap('strategien', 'Ber_', ['g', 'k'], 'g', 'Verlängern: Berg – Berge.'),
  gap('strategien', 'Kor_', ['b', 'p'], 'b', 'Verlängern: Korb – Körbe.'),
  gap('strategien', 'Bil_', ['d', 't'], 'd', 'Verlängern: Bild – Bilder.'),
  gap('strategien', 'Sar_', ['g', 'k'], 'g', 'Verlängern: Sarg – Särge.'),
  gap('strategien', 'Gra_', ['b', 'p'], 'b', 'Verlängern: Grab – Gräber.'),
  gap('strategien', 'Zwer_', ['g', 'k'], 'g', 'Verlängern: Zwerg – Zwerge.'),
  gap('strategien', 'Ra_', ['d', 't'], 'd', 'Verlängern: Rad – Räder.'),
  gap('strategien', 'Wal_', ['d', 't'], 'd', 'Verlängern: Wald – Wälder.'),
  gap('strategien', 'Die_', ['b', 'p'], 'b', 'Verlängern: Dieb – Diebe.'),
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
  spelling('doppel', 'Spinne', 'Spine', 'Kurzer Vokal → doppelter Konsonant.'),
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
  spelling('doppel', 'Rabe', 'Rabbe', 'Langer Vokal → nur ein Konsonant.'),
  spelling('doppel', 'Nebel', 'Nebbel', 'Langer Vokal → nur ein Konsonant.'),
  spelling('doppel', 'Besen', 'Bessen', 'Langer Vokal → nur ein Konsonant.'),
  spelling('doppel', 'Wolke', 'Wollke', 'Nach zwei verschiedenen Konsonanten (lk) wird nichts verdoppelt.'),

  // --- Genus ---
  genus('Kürbis', 'der'), genus('Hexe', 'die'), genus('Gespenst', 'das'),
  genus('Besen', 'der'), genus('Fledermaus', 'die'), genus('Skelett', 'das'),
  genus('Mond', 'der'), genus('Spinne', 'die'), genus('Spinnennetz', 'das'),
  genus('Friedhof', 'der'), genus('Kerze', 'die'), genus('Monster', 'das'),
  genus('Nacht', 'die'), genus('Zauberer', 'der'), genus('Kostüm', 'das'),
  plural('Hexe', 'Hexen', ['Hexe', 'Hexes']),
  plural('Kürbis', 'Kürbisse', ['Kürbisen', 'Kürbis']),
  plural('Maus', 'Mäuse', ['Mause', 'Meuse']),
  plural('Gespenst', 'Gespenster', ['Gespensten', 'Gespänster']),
  plural('Fledermaus', 'Fledermäuse', ['Fledermausen', 'Fledermeuse']),
  plural('Skelett', 'Skelette', ['Skeletten', 'Skelettes']),
  plural('Kerze', 'Kerzen', ['Kerzer', 'Kerze']),
  plural('Rabe', 'Raben', ['Räber', 'Rabe']),
  plural('Nacht', 'Nächte', ['Nachten', 'Nechte']),
  plural('Zahn', 'Zähne', ['Zahnen', 'Zehne']),
  plural('Buch', 'Bücher', ['Buchen', 'Buche']),
  plural('Geist', 'Geister', ['Geisten', 'Geiste']),
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
  ruleQ('Welche Strategie hilft bei „Kür_is“ (Kür-bis)?', ['Zerlegen', 'Verlängern', 'Ableiten'], 'Zerlegen', 'Zerlegen: Sprich in Silben und hör genau hin: Kür-bis.'),
  ruleQ('Wann verlängert man ein Wort?', ['Wenn man am Wortende b/p, d/t oder g/k nicht unterscheiden kann', 'Wenn man ä oder e nicht unterscheiden kann', 'Wenn das Wort sehr kurz ist'], 'Wenn man am Wortende b/p, d/t oder g/k nicht unterscheiden kann', 'Verlängern: Berg – Berge.'),
  ruleQ('Wann leitet man ab?', ['Wenn man nicht weiß, ob ä/e oder äu/eu', 'Wenn man b/p am Wortende nicht hört'], 'Wenn man nicht weiß, ob ä/e oder äu/eu', 'Ableiten: Wälder – Wald, Häuser – Haus.'),
  ruleQ('Nach einem KURZEN Vokal folgt meist …', ['ein Doppelkonsonant', 'ein einzelner Konsonant'], 'ein Doppelkonsonant', 'Kurzer Vokal – zwei Konsonanten (Kanne, Sonne).'),
  ruleQ('Nach einem LANGEN Vokal folgt meist …', ['ein einzelner Konsonant', 'ein Doppelkonsonant'], 'ein einzelner Konsonant', 'Langer Vokal – ein Konsonant (Nebel, Rabe).'),
  ruleQ('Nomen schreibt man immer …', ['groß', 'klein'], 'groß', 'Nomen = Namenwörter, immer großschreiben.'),
  ruleQ('Woran erkennt man ein Nomen?', ['Man kann der, die oder das davorsetzen', 'Man kann es steigern', 'Man kann es in die Vergangenheit setzen'], 'Man kann der, die oder das davorsetzen', 'Nomen-Probe: der/die/das davor.'),
  ruleQ('Welche Wörter sind Signalwörter für ein Nomen?', ['das, beim, zum, im', 'und, aber, oder', 'schnell, laut, leise'], 'das, beim, zum, im', 'Signalwort davor – groß! Auch etwas, nichts, viel, alles und Adjektive.'),
  ruleQ('Nach „etwas“, „nichts“, „viel“, „alles“ wird ein Adjektiv …', ['großgeschrieben', 'kleingeschrieben'], 'großgeschrieben', 'etwas Gutes, nichts Neues, viel Süßes.'),
  ruleQ('„Genus“ bedeutet …', ['grammatisches Geschlecht (der, die, das)', 'Einzahl und Mehrzahl'], 'grammatisches Geschlecht (der, die, das)', 'Genus: der, die, das.'),
  ruleQ('„Numerus“ bedeutet …', ['Einzahl und Mehrzahl', 'grammatisches Geschlecht (der, die, das)'], 'Einzahl und Mehrzahl', 'Numerus: Singular und Plural.'),
];

// Assign stable ids (category + running number)
const QUESTIONS = RAW_QUESTIONS.map((q, i) => ({ ...q, id: `${q.cat}-${i}` }))
  .map(q => ({ ...q, ruleId: ruleIdFor(q) }));

if (typeof module !== 'undefined') {
  module.exports = { CATEGORIES, QUESTIONS, RULES, ruleIdFor, getRule };
}





