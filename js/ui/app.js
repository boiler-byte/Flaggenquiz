import { COUNTRIES, COUNTRIES_BY_CODE, flagUrl } from '../data/countries.js';
import { createGame, nextQuestion, ROUND_LENGTH, selectAnswer } from '../core/game.js';
import { defaultState, readState, writeState } from '../core/storage.js';
import { playSound } from '../core/audio.js';
import { celebrate } from './effects.js';

const app = document.querySelector('#app');
const toastElement = document.querySelector('#toast');
let state = readState();
let screen = 'home';
let chosenMode = state.lastMode;
let deferredInstallPrompt = null;
let storageAvailable = true;
let offlineReady = false;
let toastTimer;

const icons = {
  volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m8 5 11 7-11 7V5Z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.35 5.65M20 4v7h-7"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8m-4-4v4M7 3h10v7a5 5 0 0 1-10 0V3ZM7 5H4v3a4 4 0 0 0 4 4m9-7h3v3a4 4 0 0 1-4 4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9M12 3c-3 3-4 6-4 9s1 6 4 9"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg>',
};

const format = (number) => new Intl.NumberFormat('de-DE').format(number ?? 0);
const getCountry = (code) => COUNTRIES_BY_CODE.get(code);
const availableGame = () => Boolean(state.game && !state.game.completed);
const currentMode = () => screen === 'play' || screen === 'results' ? state.game.mode : chosenMode;
const audioEnabled = () => state.settings.sound;

function notify(message) {
  toastElement.textContent = message;
  toastElement.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastElement.classList.remove('visible'), 3000);
}

function persist() {
  storageAvailable = writeState(state);
}

function renderTopbar() {
  const online = navigator.onLine;
  const connectionLabel = online ? (offlineReady ? 'OFFLINE BEREIT' : 'SYSTEM ONLINE') : 'OFFLINE AKTIV';
  return `<header class="topbar">
    <div class="brand" aria-label="Flaggne Quiz">
      <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
      <span class="brand-name">FLAGGNE<span>QUIZ</span><small>WELTWISSEN // 01</small></span>
    </div>
    <div class="header-actions">
      <div class="system-pill"><span class="status-dot"></span><span>${connectionLabel}</span></div>
      <button type="button" class="icon-button install-button ${deferredInstallPrompt ? '' : 'hidden'}" data-action="install" aria-label="App installieren" title="App installieren">${icons.download}</button>
      <button type="button" class="sound-button" data-action="sound" aria-label="Ton ${audioEnabled() ? 'ausschalten' : 'einschalten'}" aria-pressed="${audioEnabled()}">
        ${audioEnabled() ? icons.volume : icons.mute}<span>${audioEnabled() ? 'SOUND ON' : 'SOUND OFF'}</span>
      </button>
    </div>
  </header>`;
}

function renderSidebar() {
  const mode = currentMode();
  const game = (screen === 'play' || screen === 'results') ? state.game : null;
  const modeLocked = screen === 'play';
  const score = game?.score ?? 0;
  const streak = game?.streak ?? 0;
  const best = state.highscore[mode];

  return `<aside class="sidebar">
    <div class="side-intro"><div class="eyebrow"><span class="line-accent"></span> CONTROL PANEL</div>
      <h2>SPIELKONSOLE<span class="header-spark">✳</span></h2>
      <p>Wähle deine Mission und teste dein Wissen.</p>
    </div>
    <div class="mode-label">SPIELMODUS <span>${modeLocked ? 'AKTIV' : 'WÄHLEN'}</span></div>
    <div class="mode-list" role="group" aria-label="Spielmodus auswählen">
      ${renderModeButton('flagge', 'FLAGGE', 'Flagge → Land', '01', mode, modeLocked)}
      ${renderModeButton('land', 'LAND', 'Land → Flagge', '02', mode, modeLocked)}
    </div>
    <div class="sidebar-rule"></div>
    <div class="stats-caption">LIVE-TELEMETRIE</div>
    <div class="stats-grid">
      <div class="stat-item"><span class="stat-title">SCORE</span><strong class="stat-number ${score ? 'lit' : ''}">${format(score)}</strong><span class="stat-sub">PUNKTE</span></div>
      <div class="stat-item"><span class="stat-title">HIGHSCORE</span><strong class="stat-number best">${format(best)}</strong><span class="stat-sub">${mode === 'flagge' ? 'FLAGGE' : 'LAND'}</span></div>
    </div>
    <div class="streak-line"><span><span class="streak-bolt">✧</span> SERIE</span><strong>${streak} <small>IN FOLGE</small></strong></div>
    <div class="side-actions">
      ${screen === 'play'
        ? `<button class="button button-primary" type="button" data-action="pause">${icons.pause}<span>Spiel pausieren</span></button>`
        : screen === 'results'
          ? `<button class="button button-primary" type="button" data-action="start">${icons.refresh}<span>Nochmal spielen</span></button>
             <button class="button button-ghost" type="button" data-action="home">Zur Startseite ${icons.arrow}</button>`
          : `<button class="button button-primary" type="button" data-action="start">${icons.play}<span>Neue Mission starten</span>${icons.arrow}</button>
             ${availableGame() ? `<button class="button button-secondary" type="button" data-action="resume">${icons.refresh}<span>Spiel fortsetzen</span><span class="resume-count">${state.game.index + 1}/${ROUND_LENGTH}</span></button>` : ''}`
      }
    </div>
    <div class="sidebar-bottom"><span class="tiny-indicator"></span> ${storageAvailable ? 'SPIELSTAND LOKAL GESPEICHERT' : 'LOKALER SPEICHER NICHT VERFÜGBAR'}</div>
  </aside>`;
}

function renderModeButton(code, label, detail, num, selected, locked) {
  return `<button type="button" class="mode-button ${selected === code ? 'active' : ''}" data-action="mode" data-mode="${code}" aria-pressed="${selected === code}" ${locked ? 'disabled' : ''}>
    <span class="mode-index">${num}</span><span class="mode-copy"><strong>${label}</strong><small>${detail}</small></span>
    <span class="mode-select-indicator">${selected === code ? icons.check : ''}</span>
  </button>`;
}

function heroGlobe() {
  return `<div class="globe-scene" aria-hidden="true">
    <div class="globe-halo"></div><div class="globe-ring globe-ring-1"></div><div class="globe-ring globe-ring-2"></div>
    <div class="globe-sphere">
      <svg viewBox="0 0 300 300" fill="none" aria-hidden="true">
        <circle cx="150" cy="150" r="116" stroke="currentColor" stroke-opacity=".60" stroke-width="1.1"/>
        <ellipse cx="150" cy="150" rx="54" ry="116" stroke="currentColor" stroke-opacity=".42" stroke-width="1"/>
        <ellipse cx="150" cy="150" rx="96" ry="116" stroke="currentColor" stroke-opacity=".28" stroke-width="1"/>
        <path d="M34 150H266M48 95H252M48 205H252M78 60H222M78 240H222" stroke="currentColor" stroke-opacity=".32" stroke-width="1"/>
        <path d="M92 91c19-16 40-23 68-20l13 18 17 2 8 15-19 20-12 3-15 33-17 13-17-17-8-26-21-8Z" fill="currentColor" fill-opacity=".105" stroke="currentColor" stroke-opacity=".38"/>
        <path d="m183 168 15 5 18 23-14 12-6 27-18-10-2-25-14-10 7-15Z" fill="currentColor" fill-opacity=".14" stroke="currentColor" stroke-opacity=".40"/>
        <path d="M67 181 56 161l11-20 15 12 6 22-8 12Z" fill="currentColor" fill-opacity=".10" stroke="currentColor" stroke-opacity=".3"/>
      </svg>
      <span class="globe-dot d1"></span><span class="globe-dot d2"></span><span class="globe-dot d3"></span>
    </div>
    <div class="globe-tag tag-one">51° N / 10° E</div><div class="globe-tag tag-two">EARTH // 001</div>
  </div>`;
}

function renderHome() {
  const currentSave = availableGame() ? `MISSION GESPEICHERT · FRAGE ${state.game.index + 1}/${ROUND_LENGTH}` : 'BEREIT FÜR DIE NÄCHSTE MISSION';
  return `<section class="stage home-stage" aria-labelledby="main-title">
    <div class="stage-top"><span class="micro-label">/ 001 &nbsp; GEOGRAPHY INTELLIGENCE</span><span class="stage-top-right"><span class="little-circle"></span> ${COUNTRIES.length} NATIONEN IM SYSTEM</span></div>
    <div class="home-content">
      <div class="home-copy">
        <div class="hero-kicker"><span></span> WELCOME TO THE CHALLENGE</div>
        <h1 id="main-title">DIE WELT.<br><span>DEINE <em>MISSION.</em></span></h1>
        <p class="hero-description">Eine Welt voller Flaggen. Wie viele erkennst du? Wähle deinen Modus und knacke deinen Highscore.</p>
        <div class="hero-action">
          <button type="button" class="button button-primary hero-start" data-action="start">MISSION STARTEN ${icons.arrow}</button>
          <span class="hero-action-hint">10 FRAGEN PRO RUNDE<br>KEIN ZEITLIMIT</span>
        </div>
      </div>
      ${heroGlobe()}
    </div>
    <div class="home-lower">
      <div class="feature"><div class="feature-icon">${icons.globe}</div><div><strong>${format(COUNTRIES.length)} LÄNDER</strong><span>WELTWEIT</span></div></div>
      <div class="feature"><div class="feature-icon"><span class="feature-crosshair">◎</span></div><div><strong>2 MODI</strong><span>DOPPELTE CHALLENGE</span></div></div>
      <div class="feature"><div class="feature-icon">${icons.trophy}</div><div><strong>HIGHSCORE</strong><span>SCHLAG DICH SELBST</span></div></div>
    </div>
    <div class="status-bar"><span class="bar-line"></span>${currentSave}<span class="status-time">FLG // V1.0</span></div>
  </section>`;
}

function renderAnswer(code, i, question, mode, selectedCode) {
  const country = getCountry(code);
  const answered = selectedCode !== null;
  const correct = answered && code === question.code;
  const incorrect = answered && code === selectedCode && code !== question.code;
  const faded = answered && !correct && !incorrect;
  const classes = [ 'answer-card', mode === 'land' ? 'flag-choice' : 'text-choice', correct ? 'correct' : '', incorrect ? 'incorrect' : '', faded ? 'faded' : '' ].filter(Boolean).join(' ');
  const badge = String.fromCharCode(65 + i);
  return `<button type="button" class="${classes}" data-action="answer" data-code="${code}" data-index="${i}" ${answered ? 'disabled' : ''}
    aria-label="${badge}: ${mode === 'flagge' ? country.name : 'Flagge von ' + country.name}">
    <span class="answer-letter">${badge}</span>
    ${mode === 'flagge' ? `<span class="answer-name">${country.name}</span>` : `<span class="answer-image"><img src="${flagUrl(code)}" alt="" width="126" height="100"></span>`}
    <span class="answer-result">${correct ? icons.check : incorrect ? icons.close : '<span class="answer-arrow">↗</span>'}</span>
  </button>`;
}

function renderGame() {
  const game = state.game;
  const question = game.questions[game.index];
  const country = getCountry(question.code);
  const answered = game.selectedCode !== null;
  const correct = answered && game.selectedCode === question.code;
  const isFlagMode = game.mode === 'flagge';
  const questionCount = game.index + 1;
  const progress = Math.round((game.index / ROUND_LENGTH) * 100);
  return `<section class="stage game-stage" aria-labelledby="question-title">
    <div class="stage-top"><span class="micro-label">/ ${String(questionCount).padStart(3, '0')} &nbsp; ACTIVE MISSION</span><span class="stage-top-right">${isFlagMode ? 'FLAGGE ERKENNEN' : 'LAND ZUORDNEN'} <span class="little-circle"></span></span><button class="mobile-pause" type="button" data-action="pause" aria-label="Spiel pausieren">${icons.pause}</button></div>
    <div class="mission-progress"><div class="progress-meta"><strong>FRAGE ${String(questionCount).padStart(2, '0')} <span>/ ${ROUND_LENGTH}</span></strong><span class="progress-percent">MISSION ${Math.max(0, progress)}% ABGESCHLOSSEN</span><span class="mobile-score">${format(game.score)} PKT</span></div>
      <div class="progress-track" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${game.index}"><span style="width:${progress}%"></span></div>
    </div>
    <div class="question-header"><div class="eyebrow green">${isFlagMode ? 'IDENTIFIZIERE DIE FLAGGE' : 'FINDE DIE RICHTIGE FLAGGE'}</div>
      <h1 id="question-title">${isFlagMode ? 'Welches Land ist das?' : 'Welche Flagge passt dazu?'}</h1>
      <p>${isFlagMode ? 'Wähle das Land, zu dem diese Flagge gehört.' : 'Wähle die Flagge für das angezeigte Land.'}</p>
    </div>
    <div class="question-display ${answered ? (correct ? 'is-right' : 'is-wrong') : ''}">
      <span class="target-corner corner-tl"></span><span class="target-corner corner-tr"></span><span class="target-corner corner-bl"></span><span class="target-corner corner-br"></span>
      <span class="target-scanline"></span>
      <span class="target-decor target-decor-left">${isFlagMode ? 'VISUAL INPUT' : 'TEXT INPUT'}</span><span class="target-decor target-decor-right">SECURE // 01</span>
      ${isFlagMode
        ? `<img class="target-flag" src="${flagUrl(question.code)}" alt="Gesuchte Länderflagge" width="220" height="170">`
        : `<div class="target-country"><span class="target-country-icon">${icons.globe}</span><strong>${country.name}</strong><small>GESUCHTES LAND</small></div>`}
      <span class="target-id">// SIGNAL ${String(questionCount).padStart(2, '0')}</span>
    </div>
    <div class="answers-heading"><span>WÄHLE DEINE ANTWORT</span><span>01 — 04 <span class="hidden-mobile">/ TASTEN 1–4</span></span></div>
    <div class="answer-grid">${question.options.map((code, i) => renderAnswer(code, i, question, game.mode, game.selectedCode)).join('')}</div>
    ${answered
      ? `<div class="feedback-row ${correct ? 'success' : 'failure'}" role="status" aria-live="polite">
          <div class="feedback-icon">${correct ? icons.check : icons.close}</div>
          <div class="feedback-copy"><strong>${correct ? 'RICHTIG ERKANNT!' : 'LEIDER NICHT RICHTIG'}</strong><span>${correct ? `+${format(game.lastPoints)} Punkte · ${game.streak}er-Serie` : `Richtige Antwort: ${country.name}`}</span></div>
          <button type="button" class="feedback-next" data-action="next">${game.index === ROUND_LENGTH - 1 ? 'ERGEBNIS' : 'WEITER'} ${icons.arrow}</button>
        </div>`
      : `<p class="answer-instruction" aria-live="polite"><span class="instruction-dot"></span> Vier Möglichkeiten. Eine richtige Antwort.</p>`}
  </section>`;
}

function renderResults() {
  const game = state.game;
  const accuracy = Math.round((game.correct / ROUND_LENGTH) * 100);
  const isRecord = game.score > game.startedHighscore;
  let heading = 'MISSION ABGESCHLOSSEN';
  let subtitle = 'Jede Runde macht dich besser.';
  if (game.correct === ROUND_LENGTH) { heading = 'PERFEKTE MISSION.'; subtitle = 'Alle Flaggen richtig erkannt. Weltklasse.'; }
  else if (game.correct >= 8) { heading = 'STARKES ERGEBNIS.'; subtitle = 'Du kennst dich auf der Weltkarte aus.'; }
  else if (game.correct >= 5) { heading = 'GUTER KURS.'; subtitle = 'Du bist auf dem richtigen Weg.'; }
  return `<section class="stage results-stage" aria-labelledby="result-title">
    <div class="stage-top"><span class="micro-label">/ 010 &nbsp; MISSION REPORT</span><span class="stage-top-right"><span class="little-circle"></span> ANALYSE ABGESCHLOSSEN</span></div>
    <div class="result-content">
      <div class="result-kicker">${isRecord ? '✧ &nbsp; NEUER PERSÖNLICHER REKORD' : 'MISSION COMPLETE // 100%'}</div>
      <h1 id="result-title">${heading}</h1><p class="result-description">${subtitle}</p>
      <div class="results-visual"><div class="accuracy-ring" style="--accuracy:${accuracy}%">
          <div class="accuracy-core"><span>RICHTIG</span><strong>${accuracy}<small>%</small></strong><span>GENAUIGKEIT</span></div>
        </div></div>
      <div class="result-metrics">
        <div><small>DEIN SCORE</small><strong>${format(game.score)}</strong><span>PUNKTE</span></div>
        <div><small>RICHTIGE ANTWORTEN</small><strong>${game.correct}<span> / ${ROUND_LENGTH}</span></strong><span>FLAGGEN</span></div>
        <div><small>BESTE SERIE</small><strong>${game.bestStreak}</strong><span>IN FOLGE</span></div>
      </div>
      <div class="result-bottom"><button type="button" class="button button-primary" data-action="start">${icons.refresh} NOCH EINE RUNDE ${icons.arrow}</button>
        <button type="button" class="button button-ghost" data-action="home">ZUR STARTSEITE</button></div>
    </div>
  </section>`;
}

function render() {
  if ((screen === 'play' || screen === 'results') && !state.game) screen = 'home';
  app.innerHTML = `<div class="app-shell">${renderTopbar()}<main class="main-layout ${screen}-layout">${renderSidebar()}${screen === 'play' ? renderGame() : screen === 'results' ? renderResults() : renderHome()}</main>
      <footer class="site-footer"><span>© FLAGGNE QUIZ <i>•</i> BUILT FOR EXPLORERS</span><span><span class="footer-diamond">◇</span> ${screen === 'play' ? 'ESC = PAUSE · M = SOUND · ENTER = WEITER' : 'ENTDECKE DIE WELT, FLAGGE FÜR FLAGGE'}</span></footer>
    </div>`;
}

function startNew() {
  if (screen === 'home' && availableGame()) {
    if (!window.confirm('Dein gespeicherter Spielstand wird durch eine neue Mission ersetzt. Neue Mission starten?')) return;
  }
  state.game = createGame(chosenMode, state.highscore[chosenMode]);
  state.lastMode = chosenMode;
  persist();
  screen = 'play';
  playSound('click', audioEnabled());
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

function answer(code) {
  if (screen !== 'play') return;
  const oldGame = state.game;
  if (oldGame.selectedCode !== null) return;
  const next = selectAnswer(oldGame, code);
  if (next === oldGame) return;
  state.game = next;
  state.highscore[next.mode] = Math.max(state.highscore[next.mode], next.score);
  persist();
  const wasCorrect = next.questions[next.index].code === code;
  playSound(wasCorrect ? 'success' : 'error', audioEnabled());
  render();
  if (wasCorrect) celebrate(document.querySelector('.question-display'));
  const nextButton = document.querySelector('[data-action="next"]');
  if (nextButton) nextButton.focus({ preventScroll: true });
}

function advance() {
  if (screen !== 'play' || state.game.selectedCode === null) return;
  const previous = state.game;
  state.game = nextQuestion(previous);
  if (state.game.completed) {
    state.stats.roundsPlayed++;
    state.stats.totalCorrect += state.game.correct;
    state.stats.totalAnswered += ROUND_LENGTH;
    screen = 'results';
    playSound('complete', audioEnabled());
  } else {
    playSound('click', audioEnabled());
  }
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
}

app.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = button.dataset.action;
  if (action === 'mode') {
    if (screen === 'play') return;
    chosenMode = button.dataset.mode;
    state.lastMode = chosenMode;
    persist();
    playSound('click', audioEnabled());
    render();
  } else if (action === 'start') startNew();
  else if (action === 'resume') {
    if (!availableGame()) return;
    chosenMode = state.game.mode;
    screen = 'play';
    playSound('click', audioEnabled());
    render();
  } else if (action === 'pause') {
    screen = 'home';
    chosenMode = state.game.mode;
    persist();
    render();
    notify('Mission pausiert. Dein Fortschritt ist gespeichert.');
  } else if (action === 'home') {
    screen = 'home';
    chosenMode = state.game?.mode || chosenMode;
    render();
  } else if (action === 'answer') answer(button.dataset.code);
  else if (action === 'next') advance();
  else if (action === 'sound') {
    state.settings.sound = !state.settings.sound;
    persist();
    playSound('click', audioEnabled());
    render();
  } else if (action === 'install' && deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    render();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.repeat) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
  const key = event.key.toLowerCase();
  if (key === 'm') {
    event.preventDefault();
    document.querySelector('[data-action="sound"]')?.click();
  } else if (screen === 'play') {
    if ('1234'.includes(key) && key.length === 1 && state.game.selectedCode === null) {
      event.preventDefault();
      const code = state.game.questions[state.game.index].options[Number(key) - 1];
      answer(code);
    } else if (event.key === 'Enter' && state.game.selectedCode !== null && !event.target.closest('button')) {
      event.preventDefault();
      advance();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      document.querySelector('[data-action="pause"]')?.click();
    }
  } else if (screen === 'home' && event.key === 'Enter' && !event.target.closest('button')) {
    event.preventDefault();
    startNew();
  }
});

window.addEventListener('online', render);
window.addEventListener('offline', render);
window.addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  render();
});
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  render();
  notify('Flaggne Quiz wurde installiert.');
});

if ('serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register('./sw.js');
      await navigator.serviceWorker.ready;
      offlineReady = true;
      render();
    } catch (error) {
      console.warn('Offline-Modus konnte nicht aktiviert werden:', error);
    }
  });
}

persist(); // Erstellt localStorage.flaggenQuiz beim ersten Start.
render();
