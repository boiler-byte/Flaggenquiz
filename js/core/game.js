import { COUNTRIES } from '../data/countries.js';

export const ROUND_LENGTH = 10;

function shuffled(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createGame(mode, startedHighscore = 0) {
  if (!['flagge', 'land'].includes(mode)) throw new Error('Ungültiger Spielmodus');
  const questions = shuffled(COUNTRIES).slice(0, ROUND_LENGTH).map(({ code }) => {
    const distractors = shuffled(COUNTRIES.filter((country) => country.code !== code))
      .slice(0, 3)
      .map((country) => country.code);
    return { code, options: shuffled([code, ...distractors]) };
  });
  return {
    mode, questions, index: 0, score: 0, correct: 0, streak: 0,
    bestStreak: 0, selectedCode: null, lastPoints: 0,
    completed: false, startedHighscore, startedAt: new Date().toISOString(),
  };
}

export function selectAnswer(game, code) {
  if (!game || game.completed || game.selectedCode !== null) return game;
  const question = game.questions[game.index];
  if (!question.options.includes(code)) return game;
  const isCorrect = question.code === code;
  const streak = isCorrect ? game.streak + 1 : 0;
  const points = isCorrect ? 100 + Math.min(streak - 1, 5) * 20 : 0;
  return {
    ...game,
    selectedCode: code,
    score: game.score + points,
    lastPoints: points,
    correct: game.correct + Number(isCorrect),
    streak,
    bestStreak: Math.max(streak, game.bestStreak),
  };
}

export function nextQuestion(game) {
  if (!game || game.completed || game.selectedCode === null) return game;
  if (game.index >= game.questions.length - 1) {
    return { ...game, completed: true };
  }
  return { ...game, index: game.index + 1, selectedCode: null, lastPoints: 0 };
}

export function isValidGame(game, countryCodes) {
  if (!game || !['flagge', 'land'].includes(game.mode)) return false;
  if (!Array.isArray(game.questions) || game.questions.length !== ROUND_LENGTH) return false;
  if (!Number.isInteger(game.index) || game.index < 0 || game.index >= ROUND_LENGTH) return false;
  if (!Number.isFinite(game.score) || !Number.isFinite(game.correct)) return false;
  if (game.selectedCode !== null && typeof game.selectedCode !== 'string') return false;
  return game.questions.every((q) =>
    countryCodes.has(q.code) && Array.isArray(q.options) && q.options.length === 4 &&
    new Set(q.options).size === 4 && q.options.includes(q.code) &&
    q.options.every((code) => countryCodes.has(code))
  );
}
