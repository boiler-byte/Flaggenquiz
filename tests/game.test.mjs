import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COUNTRIES, COUNTRIES_BY_CODE } from '../js/data/countries.js';
import { ROUND_LENGTH, createGame, nextQuestion, selectAnswer, isValidGame } from '../js/core/game.js';
import { STORAGE_KEY, defaultState, readState, writeState } from '../js/core/storage.js';

const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => { memory.set(key, String(value)); },
  removeItem: (key) => memory.delete(key),
};

test('130 Länder ohne doppelten ISO-Code', () => {
  assert.equal(COUNTRIES.length, 130);
  assert.equal(COUNTRIES_BY_CODE.size, COUNTRIES.length);
});

test('beide Spielmodi generieren je 10 eindeutige Fragen mit vier Optionen', () => {
  for (const mode of ['flagge', 'land']) {
    const game = createGame(mode);
    assert.equal(game.questions.length, ROUND_LENGTH);
    assert.equal(new Set(game.questions.map((q) => q.code)).size, ROUND_LENGTH);
    for (const question of game.questions) {
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(question.options.includes(question.code));
      assert.ok(question.options.every((code) => COUNTRIES_BY_CODE.has(code)));
    }
    assert.equal(isValidGame(game, COUNTRIES_BY_CODE), true);
  }
});

test('Score, Serienbonus und Rundenabschluss', () => {
  let game = createGame('flagge');
  for (let index = 0; index < ROUND_LENGTH; index++) {
    game = selectAnswer(game, game.questions[index].code);
    assert.equal(game.correct, index + 1);
    game = nextQuestion(game);
  }
  assert.equal(game.score, 1700);
  assert.equal(game.bestStreak, 10);
  assert.equal(game.completed, true);
});

test('falsche Antwort beendet die Serie und bringt keine Punkte', () => {
  let game = createGame('land');
  const correct = game.questions[0].code;
  game = selectAnswer(game, correct);
  assert.equal(game.score, 100);
  game = nextQuestion(game);
  const wrong = game.questions[1].options.find((code) => code !== game.questions[1].code);
  game = selectAnswer(game, wrong);
  assert.equal(game.score, 100);
  assert.equal(game.streak, 0);
  assert.equal(game.correct, 1);
  assert.equal(selectAnswer(game, game.questions[1].code), game);
});

test('Spielstand wird über localStorage.flaggenQuiz nach jeder Antwort gespeichert', () => {
  const state = defaultState();
  state.game = createGame('flagge');
  state.game = selectAnswer(state.game, state.game.questions[0].code);
  state.highscore.flagge = state.game.score;
  assert.equal(writeState(state), true);
  assert.ok(memory.get(STORAGE_KEY));
  const restored = readState();
  assert.deepEqual(restored.game, state.game);
  assert.equal(restored.highscore.flagge, 100);
  assert.equal(restored.highscore.land, 0);
  assert.equal(restored.game.selectedCode, state.game.questions[0].code);
});

test('ungültiger gespeicherter Fragenkatalog wird verworfen', () => {
  const stored = JSON.parse(memory.get(STORAGE_KEY));
  stored.game.questions[0].options = ['de', 'de', 'de', 'de'];
  memory.set(STORAGE_KEY, JSON.stringify(stored));
  assert.equal(readState().game, null);
});
