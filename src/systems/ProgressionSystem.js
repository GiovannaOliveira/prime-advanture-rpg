'use strict';
Prime.systems.ProgressionSystem = class {
  constructor() {
    this.available = true;
    this.state = this.load();
  }
  defaults() {
    return {
      version: 1,
      coins: 50,
      orbs: 8,
      potions: 3,
      party: [],
      activeId: null,
      playerXp: 0,
      answers: 0,
      wins: 0,
      captures: 0,
      difficulty: 'Beginner',
      lastClaim: 0,
      streak: 0,
      history: [],
      position: null,
      questionHistory: Prime.systems.QuestionScheduler.emptyHistory()
    };
  }
  load() {
    let raw;
    try {
      raw = JSON.parse(localStorage.getItem(Prime.data.rules.saveKey));
    } catch {
      this.available = false;
      return this.defaults();
    }
    return this.normalize(raw);
  }
  normalize(raw) {
    const s = this.defaults();
    if (!raw || typeof raw !== 'object' || raw.version !== 1) return s;
    const num = (v, min = 0, max = 100000) => Number.isFinite(v) ? Math.max(min, Math.min(max, Math.floor(v))) : min;
    for (const key of ['coins', 'orbs', 'potions', 'playerXp', 'answers', 'wins', 'captures', 'streak']) s[key] = num(raw[key]);
    if (['Beginner', 'Elementary', 'Intermediate'].includes(raw.difficulty)) s.difficulty = raw.difficulty;
    const ids = new Set();
    if (Array.isArray(raw.party))
      for (const c of raw.party.slice(0, 100)) {
        if (!c || !Object.hasOwn(Prime.data.creatures, c.species)) continue;
        const level = num(c.level, 1, 50),
          d = Prime.data.creatures[c.species],
          maxHp = d.hp + (level - 1) * 5;
        const id = typeof c.id === 'string' && c.id.length < 100 && !ids.has(c.id) ? c.id : Prime.data.makeCreature(c.species).id;
        ids.add(id);
        s.party.push({
          id,
          species: c.species,
          level,
          maxHp,
          hp: num(c.hp, 0, maxHp),
          xp: num(c.xp, 0, level * 25 - 1)
        });
      }
    s.activeId = s.party.find(c => c.id === raw.activeId)?.id || s.party[0]?.id || null;
    if (Number.isFinite(raw.lastClaim) && raw.lastClaim > 0 && raw.lastClaim <= Date.now()) s.lastClaim = raw.lastClaim;
    s.history = Array.isArray(raw.history) ? raw.history.filter(h => h && Number.isFinite(h.at) && h.at > 0 && h.at <= Date.now() && typeof h.reward === 'string').slice(-14).map(h => ({
      at: h.at,
      reward: h.reward.slice(0, 120)
    })) : [];
    if (raw.position && Number.isFinite(raw.position.x) && Number.isFinite(raw.position.y)) s.position = {
      x: raw.position.x,
      y: raw.position.y
    };
    s.questionHistory = Prime.systems.QuestionScheduler.normalize(raw.questionHistory);
    return s;
  }
  save() {
    try {
      localStorage.setItem(Prime.data.rules.saveKey, JSON.stringify(this.state));
      this.available = true;
    } catch {
      this.available = false;
    }
    const el = document.getElementById('save-status');
    if (el) el.innerHTML = this.available ? '<i class="live-dot"></i> Progress saved on this browser' : 'Saving unavailable · keep this tab open';
  }
  active() {
    return this.state.party.find(c => c.id === this.state.activeId) || this.state.party[0];
  }
  addStarter(species) {
    if (this.state.party.length) return false;
    const c = Prime.data.makeCreature(species);
    this.state.party.push(c);
    this.state.activeId = c.id;
    this.save();
    return true;
  }
  addXp(creature, amount) {
    creature.xp += amount;
    let levels = 0;
    while (creature.xp >= creature.level * 25 && creature.level < 50) {
      creature.xp -= creature.level * 25;
      creature.level++;
      creature.maxHp += 5;
      creature.hp = Math.min(creature.maxHp, creature.hp + 12);
      levels++;
    }
    this.state.playerXp += amount;
    this.save();
    return levels;
  }
  heal() {
    this.state.party.forEach(c => c.hp = c.maxHp);
    this.save();
  }
  dailyRemaining() {
    return Math.max(0, this.state.lastClaim + Prime.data.rules.dayMs - Date.now());
  }
  claim() {
    if (this.dailyRemaining() > 0) return null;
    const now = Date.now();
    this.state.streak = this.state.lastClaim && now - this.state.lastClaim < Prime.data.rules.dayMs * 2 ? this.state.streak + 1 : 1;
    this.state.lastClaim = now;
    const bonus = [3, 7, 14].includes(this.state.streak);
    const coins = bonus ? 60 : 25,
      orbs = bonus ? 5 : 2;
    this.state.coins += coins;
    this.state.orbs += orbs;
    this.state.potions++;
    this.state.playerXp += 10;
    const reward = `${coins} coins · ${orbs} capture orbs · 1 potion · 10 XP`;
    this.state.history.push({
      at: now,
      reward
    });
    this.state.history = this.state.history.slice(-14);
    this.save();
    return {
      reward,
      streak: this.state.streak,
      bonus
    };
  }
};
