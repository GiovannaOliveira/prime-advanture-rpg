'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const scripts = [
  'src/data/assets.js', 'src/data/creatures.js', 'src/data/pokemon.js', 'src/data/questions.js',
  'src/data/questions/beginner.js', 'src/data/questions/elementary.js',
  'src/data/questions/intermediate.js', 'src/data/map.js', 'src/data/world-expansion.js', 'src/systems/QuestionScheduler.js',
  'src/systems/ProgressionSystem.js'
];
function setup() {
  const storage = new Map();
  const context = vm.createContext({
    console, crypto: webcrypto, document: { getElementById: () => null },
    localStorage: { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v) }
  });
  context.window = context;
  for (const file of scripts) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context, { filename: file });
  const Prime = context.Prime;
  const Store = Prime.systems.ProgressionSystem;
  const Scheduler = Prime.systems.QuestionScheduler;
  const store = new Store();
  let seed = 89;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  return { Prime, Store, Scheduler, store, scheduler: new Scheduler(store, random), storage };
}
const plain = value => JSON.parse(JSON.stringify(value));
const normalize = text => text.normalize('NFKC').toLowerCase().replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();

test('bank: exactly 300 unique authored questions, 150/100/50, valid answers and metadata', () => {
  const { Prime } = setup();
  const counts = { Beginner: 0, Elementary: 0, Intermediate: 0 };
  const ids = new Set(), stems = new Set();
  for (const q of Prime.data.questions) {
    assert.match(q.id, /^[bei]\d{3}$/);
    assert.ok(!ids.has(q.id), `Duplicate ID ${q.id}`); ids.add(q.id);
    const stem = normalize(q.text).replace(/\d+/g, '#');
    assert.ok(!stems.has(stem), `Repeated or number-only stem: ${q.id}`); stems.add(stem);
    assert.ok(Object.hasOwn(counts, q.level)); counts[q.level]++;
    assert.ok(['Nature', 'Creatures', 'Friendship', 'Exploration', 'Everyday life'].includes(q.topic));
    assert.ok(['Vocabulary', 'Grammar', 'Reading', 'Dialogue'].includes(q.skill));
    assert.equal(q.options.length, 3);
    assert.equal(new Set(q.options.map(normalize)).size, 3, q.id);
    assert.ok(q.options.every(o => typeof o === 'string' && o.trim()));
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 3);
    assert.ok(q.text.length >= 15 && q.text.length < 260, q.id);
    assert.ok(q.explanation.length >= 15 && q.explanation.length < 220, q.id);
  }
  assert.deepEqual(counts, { Beginner: 150, Elementary: 100, Intermediate: 50 });
  for (const level of Object.keys(counts)) {
    const bank = Prime.data.questions.filter(q => q.level === level);
    assert.equal(new Set(bank.map(q => q.topic)).size, 5);
    assert.equal(new Set(bank.map(q => q.skill)).size, 4);
  }
});

test('all levels: exhaust unseen questions, alternate available topics, then complete review rounds', () => {
  const { Prime, store, scheduler } = setup();
  for (const level of ['Beginner', 'Elementary', 'Intermediate']) {
    const bank = Prime.data.questions.filter(q => q.level === level);
    const seen = new Set();
    let lastTopic;
    for (let i = 0; i < bank.length; i++) {
      const remaining = bank.filter(q => !seen.has(q.id));
      const alternate = remaining.some(q => q.topic !== lastTopic);
      const s = scheduler.next(level);
      assert.equal(s.mode, 'new'); assert.equal(s.q.level, level);
      assert.ok(!seen.has(s.q.id), s.q.id);
      if (lastTopic && alternate) assert.notEqual(s.q.topic, lastTopic);
      seen.add(s.q.id); lastTopic = s.q.topic;
      if (i % 7 === 0) scheduler.answer(s, (s.q.answer + 1) % 3);
      scheduler.answer(s, s.q.answer);
    }
    const mostRecent = Object.entries(store.state.questionHistory.records)
      .filter(([id]) => bank.some(q => q.id === id))
      .sort((a, b) => b[1].lastSeen - a[1].lastSeen).slice(0, 12).map(([id]) => id);
    const round = new Set();
    for (let i = 0; i < bank.length; i++) {
      const s = scheduler.next(level);
      assert.equal(s.mode, 'review'); assert.equal(s.cycle, 1);
      assert.ok(!round.has(s.q.id));
      if (i === 0) assert.ok(!mostRecent.includes(s.q.id));
      round.add(s.q.id);
    }
    const nextRound = scheduler.next(level);
    assert.equal(nextRound.mode, 'review'); assert.equal(nextRound.cycle, 2);
    assert.notEqual(nextRound.q.id, [...round].at(-1));
  }
});

test('shuffle preserves the correct option and never mutates the authored bank', () => {
  const { Prime, Scheduler, store } = setup();
  const original = JSON.stringify(Prime.data.questions);
  const correctPositions = new Set();
  for (const random of [() => 0, () => .4, () => .999]) {
    const s = new Scheduler(store, random).next('Beginner');
    const source = Prime.data.questions.find(q => q.id === s.q.id);
    assert.equal(s.q.options[s.q.answer], source.options[source.answer]);
    assert.deepEqual([...s.q.options].sort(), [...source.options].sort());
    correctPositions.add(s.q.answer);
  }
  assert.deepEqual([...correctPositions].sort(), [0, 1, 2]);
  assert.equal(JSON.stringify(Prime.data.questions), original);
});

test('history: presentation, retry, first-try success and double-submit protection survive reload', () => {
  const { Store, Scheduler, store, scheduler } = setup();
  const s = scheduler.next('Beginner');
  let r = store.state.questionHistory.records[s.q.id];
  assert.equal(r.presentations, 1); assert.equal(r.responses, 0);
  const wrong = (s.q.answer + 1) % 3;
  assert.equal(scheduler.answer(s, wrong).correct, false);
  assert.equal(scheduler.answer(s, wrong), null);
  assert.equal(r.responses, 1); assert.equal(r.mistakes, 1);
  assert.equal(scheduler.answer(s, s.q.answer).correct, true);
  assert.equal(scheduler.answer(s, s.q.answer), null);
  assert.equal(r.completions, 1); assert.equal(r.firstTryCorrect, 0);
  const first = scheduler.next('Beginner');
  scheduler.answer(first, first.q.answer);
  assert.equal(store.state.questionHistory.records[first.q.id].firstTryCorrect, 1);
  const cancelled = scheduler.next('Beginner');
  const reloaded = new Store();
  assert.deepEqual(plain(reloaded.state.questionHistory), plain(store.state.questionHistory));
  const next = new Scheduler(reloaded, () => .3).next('Beginner');
  assert.ok(![s.q.id, first.q.id, cancelled.q.id].includes(next.q.id));
  assert.equal(reloaded.state.questionHistory.records[cancelled.q.id].responses, 0);
  assert.equal(scheduler.answer(next, -1), null);
  assert.equal(scheduler.answer(next, 3), null);
});

test('review prefers earlier errors among eligible topics and avoids recently seen questions', () => {
  const { Prime, store, scheduler } = setup();
  const questions = Prime.data.questions.filter(q => q.level === 'Beginner');
  for (const [index, q] of questions.entries()) {
    const r = scheduler.record(q.id);
    Object.assign(r, { presentations: 1, responses: 1, completions: 1, firstTryCorrect: 1, lastSeen: index + 1 });
  }
  const weak = questions.find(q => q.topic === 'Creatures');
  Object.assign(scheduler.record(weak.id), { mistakes: 1, firstTryCorrect: 0 });
  const latest = questions.find(q => q.topic === 'Everyday life');
  scheduler.record(latest.id).lastSeen = 1000;
  store.state.questionHistory.sequence = 1000;
  const s = scheduler.next('Beginner');
  assert.equal(s.mode, 'review'); assert.equal(s.q.id, weak.id);
  const roundState = plain(store.state.questionHistory.review);
  scheduler.next('Elementary');
  assert.deepEqual(plain(store.state.questionHistory.review), roundState);
});

test('legacy save keeps all previous progress and starts an empty question history', () => {
  const { Prime, Store, store, storage } = setup();
  store.addStarter('ripple');
  const legacy = plain(store.state);
  delete legacy.questionHistory;
  Object.assign(legacy, { coins: 123, orbs: 14, potions: 5, playerXp: 87, answers: 9, difficulty: 'Elementary', position: { x: 864, y: 736 }, lastClaim: Date.now() - 10000, streak: 3, history: [{ at: Date.now() - 10000, reward: 'legacy gift' }] });
  storage.set(Prime.data.rules.saveKey, JSON.stringify(legacy));
  const loaded = new Store();
  const withoutHistory = plain(loaded.state); delete withoutHistory.questionHistory;
  assert.deepEqual(withoutHistory, legacy);
  assert.deepEqual(plain(loaded.state.questionHistory.records), {});
  loaded.save();
  assert.equal(new Store().state.coins, 123);
});

test('malformed question history is normalized without resetting coins or creatures', () => {
  const { store } = setup();
  const clean = store.normalize({ ...store.state, coins: 55, questionHistory: {
    sequence: -5,
    records: {
      b001: { presentations: 2, responses: 999, completions: 999, firstTryCorrect: 999, mistakes: 999, lastSeen: 15, lastPresentedAt: Infinity },
      b002: { presentations: 'bad' }, unknown: { presentations: 500 }
    },
    review: { Beginner: { cycle: -1, seen: ['b001', 'b001', 'e001', 'unknown', 99] } }
  } });
  assert.equal(clean.coins, 55);
  assert.equal(clean.questionHistory.records.b001.responses, 2);
  assert.equal(clean.questionHistory.records.b001.firstTryCorrect, 2);
  assert.equal(clean.questionHistory.records.b001.mistakes, 4);
  assert.equal(clean.questionHistory.records.b001.lastPresentedAt, 0);
  assert.equal(clean.questionHistory.sequence, 15);
  assert.deepEqual(plain(clean.questionHistory.review.Beginner.seen), ['b001']);
  assert.deepEqual(Object.keys(clean.questionHistory.records), ['b001']);
});

test('new bank entries are selected before review and not repeated at the next round boundary', () => {
  const { Prime, store, scheduler } = setup();
  for (let i = 0; i < 150; i++) scheduler.next('Beginner');
  for (let i = 0; i < 150; i++) scheduler.next('Beginner');
  const source = Prime.data.questions.find(q => q.level === 'Beginner');
  Prime.data.registerQuestions('Beginner', [{ ...source, id: 'b151', text: 'A newly authored challenge.' }]);
  const added = scheduler.next('Beginner');
  assert.equal(added.mode, 'new'); assert.equal(added.q.id, 'b151');
  const review = scheduler.next('Beginner');
  assert.equal(review.mode, 'review'); assert.equal(review.cycle, 2);
  assert.notEqual(review.q.id, 'b151');
  assert.equal(scheduler.stats('Beginner').total, 151);
  assert.equal(store.state.coins, 50); // Scheduling does not change game rewards.
});

test('empty or unknown levels return no question without corrupting progress', () => {
  const { store, scheduler } = setup();
  const before = JSON.stringify(store.state);
  assert.equal(scheduler.next('Unknown'), null);
  assert.equal(JSON.stringify(store.state), before);
});
