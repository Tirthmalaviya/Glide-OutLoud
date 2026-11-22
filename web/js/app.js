/* Glide Game - shared app code used by every page.
   Holds: the two languages, the word lists, saved data, guild levels, badges and small helpers.
   Android data is saved in private on-device preferences; browser previews use localStorage. */

const GG = (() => {
  const KEY = "guild-game-v1";

  /* ---------- text in both languages ---------- */
  const TEXT = {
    en: {
      appName: "Glide Game", tagline: "Join the Glide voice heroes",
      whoPlays: "How old is the player?", years: "years", letsPlay: "Let's play",
      therapistArea: "Therapist and parent area", player: "Player",
      pickGame: "Pick a quest", level0: "Short words", level1: "Longer words", level2: "Sentences",
      g1: "Say the word", g1d: "Look at the picture and say it out loud",
      g2: "Listen and find", g2d: "Listen, then tap the right picture",
      g3: "Voice balloon", g3d: "Hold a long sound to fill the balloon",
      guildLevel: "Glide level", xpToNext: "XP to next level", badges: "Badges", maxLevel: "Top level reached",
      back: "Back", hear: "Hear it", tapMic: "Tap the microphone and say it", tapMicSent: "Tap the microphone and read it out loud",
      preparing: "Getting the microphone ready…", finishMic: "Finish recording", listening: "Listening… Tap Speak to finish.", checking: "Checking…", great: "Great job!", tryAgain: "Good try. Say it once more.",
      listenFirst: "Listen first, then say it.", heard: "I heard",
      forAdult: "For the grown-up", saidRight: "Said it right", skip: "Skip",
      modeLocal: "Offline speech · on this device", modeBrowser: "Browser check (demo, uses internet)", modeAdult: "Grown-up checks the answer",
      find: "Find the", first: "First the", then: "then the", listenAgain: "Listen again", tapPicture: "Listen, then tap the picture",
      showWords: "Show the words", found: "You found it!",
      balloonSay: "Say a long “aaaa”", keepGoing: "Keep going!", flewAway: "It flew away! Breathe in.",
      micOn: "Turn on the microphone", holdHere: "Hold here instead", justRight: "Just right", tooQuiet: "A bit louder",
      noMic: "The microphone is not available. Hold the button to play.", seconds: "seconds",
      done: "Quest complete!", newBadge: "New badge", xpGained: "XP gained", playAgain: "Play again", allGames: "All quests",
      heardByGame: "Heard by the game", markedAdult: "Marked by adult", skipped: "Skipped", firstTap: "Right first time", balloons: "Balloons filled",
      levelUp: "Level up!",
      /* therapist */
      clinicTitle: "Therapist area", players: "Players", addPlayer: "Add a player", backToChild: "Back to the child app",
      privacy: "Offline Android: speech stays on this device. Audio is discarded; results and recognised text are saved locally.",
      startSession: "Start a session", exportPdf: "Export PDF", sessions: "Sessions", wordsPractised: "Words practised",
      successRate: "Success rate", lastSession: "Last session", noSessions: "No sessions yet. Start a session to see results here.",
      latestSession: "Latest session", word: "Word", heardAs: "Heard as", tries: "Tries", result: "Result",
      progress: "Progress over sessions", settings: "Session settings", language: "Language", ageLevel: "Age level",
      targetSound: "Target sound (optional)", holdTime: "Balloon hold time", auto: "Set by age level",
      checkSpeech: "Let the game check speech", backendUrl: "Backend address", backendOk: "Offline Android speech ready", backendOff: "Browser preview · adult marking only",
      name: "Nickname", age: "Age", save: "Save", deletePlayer: "Delete player",
      r_heard: "Heard", r_adult: "Therapist", r_helped: "Practise again", r_assisted: "Touch assisted", r_skip: "Skipped", r_correct: "Correct", r_wrong: "Completed after retry", game: "Quest", date: "Date"
    },
    fi: {
      appName: "Glide Game", tagline: "Liity Gliden äänisankareihin",
      whoPlays: "Kuinka vanha pelaaja on?", years: "vuotta", letsPlay: "Pelataan",
      therapistArea: "Terapeutin ja vanhemman alue", player: "Pelaaja",
      pickGame: "Valitse tehtävä", level0: "Lyhyet sanat", level1: "Pidemmät sanat", level2: "Lauseet",
      g1: "Sano sana", g1d: "Katso kuvaa ja sano se ääneen",
      g2: "Kuuntele ja etsi", g2d: "Kuuntele ja paina oikeaa kuvaa",
      g3: "Ääni-ilmapallo", g3d: "Sano pitkä ääni, niin pallo täyttyy",
      guildLevel: "Glide-taso", xpToNext: "XP seuraavaan tasoon", badges: "Merkit", maxLevel: "Ylin taso saavutettu",
      back: "Takaisin", hear: "Kuuntele", tapMic: "Paina mikrofonia ja sano se", tapMicSent: "Paina mikrofonia ja lue se ääneen",
      preparing: "Valmistellaan mikrofonia…", finishMic: "Lopeta tallennus", listening: "Kuuntelen… Lopeta painamalla Puhu.", checking: "Tarkistan…", great: "Hienoa!", tryAgain: "Hyvä yritys. Sano vielä kerran.",
      listenFirst: "Kuuntele ensin ja sano sitten.", heard: "Kuulin",
      forAdult: "Aikuiselle", saidRight: "Meni oikein", skip: "Ohita",
      modeLocal: "Offline-puhe · tällä laitteella", modeBrowser: "Selaimen tarkistus (demo, käyttää internetiä)", modeAdult: "Aikuinen tarkistaa vastauksen",
      find: "Etsi", first: "Ensin", then: "sitten", listenAgain: "Kuuntele uudelleen", tapPicture: "Kuuntele ja paina kuvaa",
      showWords: "Näytä sanat", found: "Löysit sen!",
      balloonSay: "Sano pitkä ”aaaa”", keepGoing: "Jatka vielä!", flewAway: "Se lensi pois! Hengitä sisään.",
      micOn: "Käynnistä mikrofoni", holdHere: "Pidä tästä pohjassa", justRight: "Juuri sopiva", tooQuiet: "Vähän kovempaa",
      noMic: "Mikrofoni ei ole käytössä. Pelaa pitämällä painiketta pohjassa.", seconds: "sekuntia",
      done: "Tehtävä suoritettu!", newBadge: "Uusi merkki", xpGained: "XP saatu", playAgain: "Pelaa uudelleen", allGames: "Kaikki tehtävät",
      heardByGame: "Peli kuuli", markedAdult: "Aikuinen merkitsi", skipped: "Ohitettu", firstTap: "Oikein heti", balloons: "Täytetyt pallot",
      levelUp: "Uusi taso!",
      r_assisted: "Painikkeella autettu", clinicTitle: "Terapeutin alue", players: "Pelaajat", addPlayer: "Lisää pelaaja", backToChild: "Takaisin lapsen sovellukseen",
      privacy: "Android-sovellus toimii offline-tilassa. Ääntä ei tallenneta. Tulokset ja tunnistettu teksti tallennetaan laitteelle.",
      startSession: "Aloita harjoitus", exportPdf: "Vie PDF", sessions: "Harjoitukset", wordsPractised: "Harjoitellut sanat",
      successRate: "Onnistumisprosentti", lastSession: "Viimeisin harjoitus", noSessions: "Ei vielä harjoituksia. Aloita harjoitus, niin tulokset näkyvät tässä.",
      latestSession: "Viimeisin harjoitus", word: "Sana", heardAs: "Kuultiin", tries: "Yritykset", result: "Tulos",
      progress: "Edistyminen", settings: "Harjoituksen asetukset", language: "Kieli", ageLevel: "Ikätaso",
      targetSound: "Harjoiteltava äänne (valinnainen)", holdTime: "Ilmapallon pitoaika", auto: "Ikätason mukaan",
      checkSpeech: "Peli tarkistaa puheen", backendUrl: "Taustapalvelun osoite", backendOk: "Androidin offline-puhe käytössä", backendOff: "Selainversio · aikuinen tarkistaa",
      name: "Lempinimi", age: "Ikä", save: "Tallenna", deletePlayer: "Poista pelaaja",
      r_heard: "Kuultu", r_adult: "Terapeutti", r_helped: "Harjoittele lisää", r_skip: "Ohitettu", r_correct: "Oikein", r_wrong: "Valmis uudella yrityksellä", game: "Tehtävä", date: "Päivä"
    }
  };

  /* ---------- word lists: pic = picture, en/fi = accepted answers (first is shown), lv = age level ---------- */
  const WORDS = [
    { pic: "🐱", en: ["cat", "kitty"], fi: ["kissa"], lv: 0 }, { pic: "🐶", en: ["dog", "puppy"], fi: ["koira"], lv: 0 },
    { pic: "☀️", en: ["sun"], fi: ["aurinko"], lv: 0 }, { pic: "⚽", en: ["ball"], fi: ["pallo"], lv: 0 },
    { pic: "🚗", en: ["car"], fi: ["auto"], lv: 0 }, { pic: "🐟", en: ["fish"], fi: ["kala"], lv: 0 },
    { pic: "🍎", en: ["apple"], fi: ["omena"], lv: 0 }, { pic: "🌙", en: ["moon"], fi: ["kuu"], lv: 0 },
    { pic: "🐮", en: ["cow"], fi: ["lehmä"], lv: 0 }, { pic: "🏠", en: ["house", "home"], fi: ["talo"], lv: 0 },
    { pic: "🌳", en: ["tree"], fi: ["puu"], lv: 0 }, { pic: "📕", en: ["book"], fi: ["kirja"], lv: 0 },
    { pic: "🐘", en: ["elephant"], fi: ["norsu"], lv: 1 }, { pic: "🦋", en: ["butterfly"], fi: ["perhonen"], lv: 1 },
    { pic: "🍓", en: ["strawberry"], fi: ["mansikka"], lv: 1 }, { pic: "☂️", en: ["umbrella"], fi: ["sateenvarjo"], lv: 1 },
    { pic: "🌈", en: ["rainbow"], fi: ["sateenkaari"], lv: 1 }, { pic: "🐿️", en: ["squirrel"], fi: ["orava"], lv: 1 },
    { pic: "✈️", en: ["airplane", "plane"], fi: ["lentokone"], lv: 1 }, { pic: "🚲", en: ["bicycle", "bike"], fi: ["polkupyörä", "pyörä"], lv: 1 },
    { pic: "🚀", en: ["rocket"], fi: ["raketti"], lv: 1 }, { pic: "🦒", en: ["giraffe"], fi: ["kirahvi"], lv: 1 },
    { pic: "⛄", en: ["snowman"], fi: ["lumiukko"], lv: 1 }, { pic: "🐸", en: ["frog"], fi: ["sammakko"], lv: 1 },
    { pic: "🐰", en: ["rabbit", "bunny"], fi: ["pupu", "kani", "jänis"], lv: 1 }, { pic: "🚂", en: ["train"], fi: ["juna"], lv: 1 }
  ];
  const SENTENCES = [
    { pic: "🐱💤", en: "The cat sleeps", fi: "Kissa nukkuu" },
    { pic: "🐶💨", en: "The dog runs fast", fi: "Koira juoksee nopeasti" },
    { pic: "☀️😊", en: "The sun is shining", fi: "Aurinko paistaa" },
    { pic: "🍎😋", en: "I eat a red apple", fi: "Syön punaisen omenan" },
    { pic: "🐸💦", en: "The frog jumps into the water", fi: "Sammakko hyppää veteen" },
    { pic: "🐦☁️", en: "The bird flies high", fi: "Lintu lentää korkealla" },
    { pic: "🚀🌙", en: "The rocket flies to the moon", fi: "Raketti lentää kuuhun" },
    { pic: "🐿️🌳", en: "The squirrel climbs the tree", fi: "Orava kiipeää puuhun" }
  ];

  /* ---------- guild levels and badges ---------- */
  const LEVELS = [
    { xp: 0, en: "Apprentice", fi: "Oppilas", crest: "🌱" },
    { xp: 50, en: "Explorer", fi: "Tutkija", crest: "🧭" },
    { xp: 150, en: "Voice Hero", fi: "Äänisankari", crest: "🛡️" },
    { xp: 300, en: "Glide Master", fi: "Glide-mestari", crest: "👑" }
  ];
  const BADGES = [
    { id: "first-quest", icon: "⭐", en: "First quest", fi: "Ensimmäinen tehtävä" },
    { id: "word-wizard", icon: "🪄", en: "Word wizard", fi: "Sanavelho" },
    { id: "sharp-ears", icon: "👂", en: "Sharp ears", fi: "Tarkat korvat" },
    { id: "big-breath", icon: "🎈", en: "Big breath", fi: "Iso henkäys" },
    { id: "perfect", icon: "🏆", en: "Perfect quest", fi: "Täydellinen tehtävä" },
    { id: "bilingual", icon: "🌍", en: "Two languages", fi: "Kaksi kieltä" }
  ];

  /* ---------- small inline icons ---------- */
  const s = (d, w = 24, c = "currentColor", sw = 2.6) =>
    `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    back: s('<path d="M15 5l-7 7 7 7"/>', 22),
    arrow: s('<path d="M5 12h13"/><path d="M12 5l7 7-7 7"/>', 24, "#fff", 3),
    mic: s('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>', 46, "#fff", 2.4),
    micSmall: s('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>', 38, "#D6336C", 2.4),
    speaker: s('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>', 30, "#1E2F52", 2.4),
    speakerWhite: s('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/>', 34, "#fff", 2.4),
    ear: s('<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0"/><path d="M10 9a2 2 0 0 1 4 0"/>', 38, "#1F5FBF", 2.4),
    balloon: s('<path d="M12 3a6 6 0 0 1 6 6c0 4-3.5 7-6 7s-6-3-6-7a6 6 0 0 1 6-6z"/><path d="M11 16l1 2 1-2"/><path d="M12 18c0 2-2 2-2 4"/>', 38, "#1A7A43", 2.4),
    check: s('<path d="M5 12l5 5L20 7"/>', 20, "#fff", 3),
    lock: s('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 18, "currentColor", 2.4),
    shield: s('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', 18, "currentColor", 2.4),
    plus: s('<path d="M12 5v14M5 12h14"/>', 18, "currentColor", 3)
  };
  const OWL = `<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="64" r="52" fill="#CFEAFF"/><path d="M30 40 L60 18 L90 40 Z" fill="#D6336C"/><circle cx="60" cy="18" r="5" fill="#FFD23F"/><ellipse cx="60" cy="72" rx="36" ry="34" fill="#FFD23F"/><ellipse cx="60" cy="84" rx="22" ry="18" fill="#FFF1B3"/><circle cx="47" cy="62" r="9" fill="#fff"/><circle cx="73" cy="62" r="9" fill="#fff"/><circle cx="49" cy="63" r="4.5" fill="#1E2F52"/><circle cx="75" cy="63" r="4.5" fill="#1E2F52"/><path d="M54 73 L66 73 L60 82 Z" fill="#FF8A3D"/><ellipse cx="27" cy="78" rx="8" ry="14" fill="#F2B800" transform="rotate(18 27 78)"/><ellipse cx="93" cy="78" rx="8" ry="14" fill="#F2B800" transform="rotate(-18 93 78)"/></svg>`;

  /* ---------- saved data ---------- */
  function defaults() {
    return {
      lang: "en",
      playerId: "p1",
      players: [{ id: "p1", name: "Player 1", age: 6, xp: 0, badges: [] }],
      settings: { hold: "auto", targetSound: "", checkSpeech: true, backend: "http://localhost:8000" },
      sessions: []
    };
  }
  let data;
  function load() {
    try { data = Object.assign(defaults(), JSON.parse((window.GuildBridge?.native ? window.GuildNative.loadData() : localStorage.getItem(KEY)) || "{}")); }
    catch (e) { data = defaults(); }
    if (!data.players.length) data.players = defaults().players;
    if (!data.players.find(p => p.id === data.playerId)) data.playerId = data.players[0].id;
    data.settings = Object.assign(defaults().settings, data.settings);
    return data;
  }
  function save() {
    const json = JSON.stringify(data);
    if (window.GuildBridge?.native) window.GuildNative.saveData(json);
    try { localStorage.setItem(KEY, json); } catch (e) {
      if (!window.GuildBridge?.native) alert(data.lang === 'fi' ? 'Tallennus epäonnistui.' : 'Progress could not be saved. Storage may be full.');
    }
  }
  load();

  /* ---------- helpers ---------- */
  const t = k => (TEXT[data.lang] && TEXT[data.lang][k]) || TEXT.en[k] || k;
  const player = () => data.players.find(p => p.id === data.playerId);
  const levelOfAge = age => (age <= 4 ? 0 : age <= 7 ? 1 : 2);
  const ageLevel = () => levelOfAge(player().age);
  const shown = item => (typeof item[data.lang] === "string" ? item[data.lang] : item[data.lang][0]);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = v => String(v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function guild(xp) {
    let i = 0;
    LEVELS.forEach((l, k) => { if (xp >= l.xp) i = k; });
    const cur = LEVELS[i], next = LEVELS[i + 1];
    const pct = next ? Math.round(((xp - cur.xp) / (next.xp - cur.xp)) * 100) : 100;
    return { index: i, name: cur[data.lang], crest: cur.crest, pct, toNext: next ? next.xp - xp : 0 };
  }

  /* fills every element with data-i18n="key" and data-icon="name" */
  function paint(root = document) {
    document.documentElement.lang = data.lang;
    root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll("[data-i18n-label]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nLabel)); });
    root.querySelectorAll("[data-icon]").forEach(el => { el.innerHTML = ICONS[el.dataset.icon] || ""; });
  }

  function setLang(lang) { data.lang = lang === "fi" ? "fi" : "en"; save(); if(window.GuildBridge?.native) GuildBridge.call("warm",{lang:data.lang}).catch(()=>{}); }

  /* Android speaks the written prompt with an installed offline locale voice.
     No unverified synthesized recordings are used as a pronunciation reference. */
  let speakToken = 0;
  async function speak(text) {
    const token=++speakToken;
    if(window.GuildBridge?.native){
      try { await GuildBridge.call('say',{text,lang:data.lang}); }
      catch(e) { if(token===speakToken) alert(data.lang==='fi'?'Puheääni ei ole valmis. Tarkista Androidin offline-puheääni.':'Voice is not ready. Check the Android offline voice settings.'); }
      return;
    }
    if(!window.speechSynthesis)return;
    speechSynthesis.cancel();
    const voices=speechSynthesis.getVoices().filter(v=>v.localService && v.lang.toLowerCase().startsWith(data.lang));
    if(!voices.length){alert(data.lang==='fi'?'Asenna suomen paikallinen puheääni selaimen tai käyttöjärjestelmän asetuksista.':'Install a local English voice in your system speech settings.');return;}
    await new Promise(resolve=>{const u=new SpeechSynthesisUtterance(text);u.voice=voices[0];u.lang=data.lang==='fi'?'fi-FI':'en-US';u.rate=.9;u.onend=resolve;u.onerror=resolve;speechSynthesis.speak(u);});
  }
  function stopSpeaking() {
    speakToken++;
    if(window.GuildBridge?.native)return GuildBridge.call('stopVoice').catch(()=>{});
    if(window.speechSynthesis)speechSynthesis.cancel();
    return Promise.resolve();
  }
  window.addEventListener('pagehide', stopSpeaking);
  window.addEventListener('guild-paused', stopSpeaking);

  /* does the heard text match one of the accepted answers? */
  function norm(x) { return x.toLowerCase().replace(/[.,!?;:"“”'’]/g, " ").replace(/\s+/g, " ").trim(); }
  function matches(item, heardList) {
    const answers = typeof item[data.lang] === 'string' ? [item[data.lang]] : item[data.lang];
    return heardList.some(h => answers.some(a => {
      const expected = norm(a), heard = norm(h);
      if (!expected || !heard) return false;
      // Exact whole-token phrase only: no substring or partial-sentence success.
      return expected === heard;
    }));
  }

  /* saves a finished quest, gives XP and badges, returns what changed */
  function finishSession(session) {
    const p = player();
    const before = guild(p.xp).index;
    const xp = session.stars * 10 + 5;
    p.xp += xp;
    const earned = [];
    const give = id => { if (!p.badges.includes(id)) { p.badges.push(id); earned.push(id); } };
    give("first-quest");
    if (session.game === "say" && session.stars >= 4) give("word-wizard");
    if (session.game === "find" && session.items.every(i => i.result === "correct")) give("sharp-ears");
    if (session.game === "balloon" && session.stars >= session.total) give("big-breath");
    if (session.stars === session.total && session.items.every(i => ["heard", "correct"].includes(i.result) && !i.assisted)) give("perfect");
    const langs = new Set(data.sessions.filter(x => x.playerId === p.id).map(x => x.lang).concat(session.lang));
    if (langs.size > 1) give("bilingual");
    session.playerId = p.id;
    session.date = new Date().toISOString();
    session.xp = xp;
    data.sessions.push(session);
    save();
    const result = { session, xp, earned, levelUp: guild(p.xp).index > before };
    try { sessionStorage.setItem("gg-last", JSON.stringify(result)); } catch (e) { /* ignore */ }
    if (window.API) API.saveSession(session);
    return result;
  }

  function dots(el, done, total) {
    el.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const d = document.createElement("span");
      if (i < done) d.className = "done"; else if (i === done) d.className = "now";
      el.appendChild(d);
    }
    el.setAttribute("aria-label", `${Math.min(done + 1, total)} / ${total}`);
  }

  return { TEXT, WORDS, SENTENCES, LEVELS, BADGES, ICONS, OWL, get data() { return data; },
    load, save, t, player, ageLevel, levelOfAge, shown, shuffle, esc, guild, paint, setLang, speak, stopSpeaking, matches, finishSession, dots };
})();
