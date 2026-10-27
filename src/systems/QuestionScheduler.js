'use strict';
// Selection and learning records are independent of the UI and battle rewards.
Prime.systems.QuestionScheduler = class {
  static levels = ['Beginner', 'Elementary', 'Intermediate'];
  static emptyHistory() {
    return {
      sequence: 0,
      records: {},
      review: Object.fromEntries(this.levels.map(level => [level, { cycle: 0, seen: [] }]))
    };
  }
  static normalize(raw) {
    const history = this.emptyHistory();
    if (!raw || typeof raw !== 'object') return history;
    const count = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value, 1000000000) : 0;
    const now = Date.now();
    const timestamp = value => Number.isFinite(value) && value >= 0 && value <= now ? value : 0;
    for (const q of Prime.data.questions) {
      const entry = raw.records && Object.hasOwn(raw.records, q.id) ? raw.records[q.id] : null;
      if (!entry || typeof entry !== 'object') continue;
      const presentations = count(entry.presentations);
      if (!presentations) continue;
      const responses = Math.min(presentations, count(entry.responses));
      const completions = Math.min(responses, count(entry.completions));
      const normalized = {
        presentations, responses, completions,
        firstTryCorrect: Math.min(completions, count(entry.firstTryCorrect)),
        mistakes: Math.min(responses * 2, count(entry.mistakes)),
        lastSeen: count(entry.lastSeen),
        lastPresentedAt: timestamp(entry.lastPresentedAt),
        lastAnsweredAt: timestamp(entry.lastAnsweredAt)
      };
      history.records[q.id] = normalized;
      history.sequence = Math.max(history.sequence, normalized.lastSeen);
    }
    history.sequence = Math.max(history.sequence, count(raw.sequence));
    for (const level of this.levels) {
      const saved = raw.review?.[level];
      if (!saved || typeof saved !== 'object') continue;
      const ids = new Set(Prime.data.questions.filter(q => q.level === level).map(q => q.id));
      history.review[level] = {
        cycle: count(saved.cycle),
        seen: Array.isArray(saved.seen) ? [...new Set(saved.seen.filter(id => ids.has(id) && history.records[id]?.presentations))] : []
      };
    }
    return history;
  }
  constructor(store, random = Math.random) {
    this.store = store;
    this.random = random;
  }
  record(id) {
    const h = this.store.state.questionHistory;
    if (!Object.hasOwn(h.records, id)) h.records[id] = {
      presentations: 0, responses: 0, completions: 0, firstTryCorrect: 0,
      mistakes: 0, lastSeen: 0, lastPresentedAt: 0, lastAnsweredAt: 0
    };
    return h.records[id];
  }
  pick(items) {
    return items[Math.min(items.length - 1, Math.floor(this.random() * items.length))];
  }
  next(level) {
    const questions = Prime.data.questions.filter(q => q.level === level);
    if (!questions.length) return null;
    const history = this.store.state.questionHistory;
    const unseen = questions.filter(q => !history.records[q.id]?.presentations);
    const round = history.review[level];
    let candidates = unseen;
    const mode = unseen.length ? 'new' : 'review';
    if (mode === 'review') {
      candidates = questions.filter(q => !round.seen.includes(q.id));
      if (!candidates.length || !round.cycle) {
        round.cycle++;
        round.seen = [];
        candidates = questions;
      }
      const ordered = questions.filter(q => history.records[q.id]?.lastSeen)
        .sort((a, b) => history.records[b.id].lastSeen - history.records[a.id].lastSeen);
      const recentCount = Math.min(12, Math.max(1, Math.floor(questions.length / 4)));
      const recent = new Set(ordered.slice(0, recentCount).map(q => q.id));
      const lessRecent = candidates.filter(q => !recent.has(q.id));
      if (lessRecent.length) candidates = lessRecent;
    }
    const last = questions.reduce((latest, q) =>
      (history.records[q.id]?.lastSeen || 0) > (history.records[latest?.id]?.lastSeen || 0) ? q : latest, null);
    const differentTopic = candidates.filter(q => q.topic !== last?.topic);
    if (differentTopic.length) candidates = differentTopic;
    if (mode === 'review') {
      const withErrors = candidates.filter(q => history.records[q.id]?.mistakes > 0);
      const unfinished = candidates.filter(q => history.records[q.id]?.completions < history.records[q.id]?.presentations);
      if (withErrors.length) candidates = withErrors;
      else if (unfinished.length) candidates = unfinished;
    }
    // Pick a topic first so large topics do not crowd out smaller ones.
    const topic = this.pick([...new Set(candidates.map(q => q.topic))]);
    const source = this.pick(candidates.filter(q => q.topic === topic));
    const options = source.options.map((text, index) => ({ text, correct: index === source.answer }));
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(this.random() * (i + 1)));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const entry = this.record(source.id);
    entry.presentations++;
    entry.lastSeen = ++history.sequence;
    entry.lastPresentedAt = Date.now();
    if (mode === 'review' || round.cycle > 0) round.seen.push(source.id);
    this.store.save(); // Presentation survives cancellation, reload, and browser closure.
    return {
      q: { ...source, options: options.map(o => o.text), answer: options.findIndex(o => o.correct) },
      mode, cycle: mode === 'review' ? round.cycle : 0, attempts: [], solved: false
    };
  }
  answer(session, index) {
    if (!session || session.solved || !Number.isInteger(index) || index < 0 || index >= session.q.options.length || session.attempts.includes(index)) return null;
    session.attempts.push(index);
    const entry = this.record(session.q.id);
    const firstAttempt = session.attempts.length === 1;
    if (firstAttempt) entry.responses++;
    entry.lastAnsweredAt = Date.now();
    const correct = index === session.q.answer;
    if (correct) {
      session.solved = true;
      entry.completions++;
      if (firstAttempt) entry.firstTryCorrect++;
    } else entry.mistakes++;
    this.store.save();
    return { correct, firstAttempt };
  }
  stats(level) {
    const questions = Prime.data.questions.filter(q => q.level === level);
    const records = questions.map(q => this.store.state.questionHistory.records[q.id]);
    return {
      total: questions.length,
      seen: records.filter(r => r?.presentations > 0).length,
      answered: records.filter(r => r?.responses > 0).length,
      firstTry: records.filter(r => r?.firstTryCorrect > 0).length
    };
  }
};
