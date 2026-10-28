'use strict';
Prime.systems.EncounterSystem = class {
  constructor(game) {
    this.game = game;
    this.wild = [];
    this.clock = 0;
    this.next = 4;
    this.lastRegion = null;
    this.refresh();
  }
  available(zone) {
    return this.game.world.isOpen(zone.region) && zone.species.some(id => this.eligible(id));
  }
  eligible(id) {
    const d = Prime.data.creatures[id];
    return d && (!d.requiresNote || this.game.store.state.exploration.claimed.includes(d.requiresNote));
  }
  nearbyZones() {
    const p = this.game.player,
      world = this.game.world;
    return world.data.zones.filter(z => this.available(z) && Math.hypot((z.x + z.w / 2) * 32 - p.x, (z.y + z.h / 2) * 32 - p.y) <= Prime.data.rules.encounterRadius);
  }
  pick(zone, initial = false) {
    const ids = zone.species.filter(id => this.eligible(id));
    if (!ids.length) return null;
    if (initial) {
      const friendly = ids.filter(id => ['Common', 'Uncommon'].includes(Prime.data.creatures[id].rarity));
      return (friendly.length ? friendly : ids)[Math.floor(Math.random() * (friendly.length || ids.length))];
    }
    const weights = Object.entries(Prime.data.rules.rarityWeights).filter(([rarity]) => ids.some(id => Prime.data.creatures[id].rarity === rarity));
    let roll = Math.random() * weights.reduce((sum, [, weight]) => sum + weight, 0),
      rarity = weights.at(-1)[0];
    for (const [name, weight] of weights) {
      roll -= weight;
      if (roll < 0) {
        rarity = name;
        break;
      }
    }
    const choices = ids.filter(id => Prime.data.creatures[id].rarity === rarity);
    return choices[Math.floor(Math.random() * choices.length)];
  }
  spawn(zone, initial = false) {
    if (!zone || !this.available(zone) || this.wild.length >= Prime.data.rules.maxWild || this.wild.filter(c => c.region === zone.region).length >= Prime.data.rules.maxWildPerRegion) return;
    const species = this.pick(zone, initial);
    if (!species) return;
    const world = this.game.world,
      p = this.game.player;
    for (let attempt = 0; attempt < 40; attempt++) {
      const x = (zone.x + .5 + Math.random() * (zone.w - 1)) * 32,
        y = (zone.y + .5 + Math.random() * (zone.h - 1)) * 32;
      if (!world.walkable(x, y) || world.regionAt(x, y)?.id !== zone.region || Math.hypot(x - p.x, y - p.y) < 65 || this.wild.some(c => Math.hypot(c.x - x, c.y - y) < 48)) continue;
      const [min, max] = zone.levels || [1, 3], level = min + Math.floor(Math.random() * (max - min + 1));
      const creature = Prime.data.makeCreature(species, level);
      Object.assign(creature, {
        x,
        y,
        zone: zone.id,
        region: zone.region,
        age: 0,
        walkTimer: Math.random() * 3,
        dx: 0,
        dy: 0
      });
      this.wild.push(creature);
      return creature;
    }
  }
  refresh() {
    const p = this.game.player,
      radius = Prime.data.rules.encounterRadius;
    this.wild = this.wild.filter(c => Math.hypot(c.x - p.x, c.y - p.y) <= radius && this.game.world.isOpen(c.region));
    const region = this.game.world.regionAt(p.x, p.y)?.id;
    this.lastRegion = region || this.lastRegion;
    const zones = this.nearbyZones().sort((a, b) => (a.region === region ? 0 : 1) - (b.region === region ? 0 : 1));
    if (zones.some(z => z.region === region) && !this.wild.some(c => c.region === region)) {
      this.wild.sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y));
      this.wild = this.wild.slice(0, Math.min(this.wild.length, Prime.data.rules.maxWild - 2));
    }
    for (const zone of zones) {
      this.spawn(zone, true);
      this.spawn(zone, true);
    }
  }
  update(dt) {
    const region = this.game.world.regionAt(this.game.player.x, this.game.player.y)?.id;
    if (region && region !== this.lastRegion) this.refresh();
    this.wild = this.wild.filter(c => Math.hypot(c.x - this.game.player.x, c.y - this.game.player.y) <= Prime.data.rules.encounterRadius && (c.age < 210 || Math.hypot(c.x - this.game.player.x, c.y - this.game.player.y) < 150));
    this.clock += dt;
    if (this.clock > this.next) {
      this.clock = 0;
      const [min, max] = Prime.data.rules.spawnSeconds;
      this.next = min + Math.random() * (max - min);
      const zones = this.nearbyZones();
      if (zones.length) {
        const local = zones.filter(z => z.region === region),
          pool = local.length && Math.random() < .65 ? local : zones;
        this.spawn(pool[Math.floor(Math.random() * pool.length)]);
      }
    }
    for (const c of this.wild) {
      c.age += dt;
      c.walkTimer -= dt;
      if (c.walkTimer < 0) {
        c.walkTimer = 2 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        c.dx = Math.cos(angle) * 9;
        c.dy = Math.sin(angle) * 9;
      }
      const x = c.x + c.dx * dt,
        y = c.y + c.dy * dt,
        z = this.game.world.data.zones.find(z => z.id === c.zone);
      if (x > z.x * 32 + 12 && x < (z.x + z.w) * 32 - 12 && y > z.y * 32 + 12 && y < (z.y + z.h) * 32 - 12 && this.game.world.walkable(x, y) && this.game.world.regionAt(x, y)?.id === z.region) {
        c.x = x;
        c.y = y;
      } else {
        c.dx = 0;
        c.dy = 0;
      }
    }
  }
  remove(id) {
    this.wild = this.wild.filter(c => c.id !== id);
  }
  draw(ctx, c, time) {
    const d = Prime.data.creatures[c.species];
    ctx.fillStyle = '#2c52372a';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 2, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    this.game.assets.creatureFrame(ctx, c.species, c.x - 38, c.y - 58, 76, Math.floor(time / 220) % 4);
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px Trebuchet MS';
    const label = d.name + ' · ' + c.level,
      w = ctx.measureText(label).width + 12;
    ctx.fillStyle = '#fff9e7ed';
    ctx.fillRect(c.x - w / 2, c.y - 65, w, 15);
    ctx.fillStyle = d.rarity === 'Legendary' ? '#aa7b2d' : '#526a3e';
    ctx.fillText(label, c.x, c.y - 54);
  }
};
