import { COUNTRIES_BY_CODE } from '../data/countries.js';
import { isValidGame } from './game.js';

// Bewusst exakt der vom Projekt vorgegebene Schlüssel.
export const STORAGE_KEY = 'flaggenQuiz';

export function defaultState() {
  return {
    version: 1,
    lastMode: 'flagge',
    settings: { sound: true },
    highscore: { flagge: 0, land: 0 },
    stats: { roundsPlayed: 0, totalCorrect: 0, totalAnswered: 0 },
    game: null,
  };
}

const safeNumber = (number) => Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;

export function readState() {
  const fresh = defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const stored = JSON.parse(raw);
    if (!stored || stored.version !== 1 || typeof stored !== 'object') return fresh;
    return {
      version: 1,
      lastMode: ['flagge', 'land'].includes(stored.lastMode) ? stored.lastMode : 'flagge',
      settings: { sound: stored.settings?.sound !== false },
      highscore: {
        flagge: safeNumber(stored.highscore?.flagge),
        land: safeNumber(stored.highscore?.land),
      },
      stats: {
        roundsPlayed: safeNumber(stored.stats?.roundsPlayed),
        totalCorrect: safeNumber(stored.stats?.totalCorrect),
        totalAnswered: safeNumber(stored.stats?.totalAnswered),
      },
      game: isValidGame(stored.game, COUNTRIES_BY_CODE) ? stored.game : null,
    };
  } catch (error) {
    console.warn('Spielstand konnte nicht gelesen werden:', error);
    return fresh;
  }
}

export function writeState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn('Spielstand kann nicht dauerhaft gespeichert werden:', error);
    return false;
  }
}
