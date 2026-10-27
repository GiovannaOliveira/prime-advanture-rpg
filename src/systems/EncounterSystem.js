'use strict';
Prime.systems.EncounterSystem = class {
  constructor(game) {
    this.game = game;
    this.wild = [];
    this.clock = 0;
    this.next = 4;
    for (const z of game.world.data.zones) {
      this.spawn(z, true);
      this.spawn(z, true);
    }
  }
  pick(zone) {
    const weights = Object.entries(Prime.data.rules.rarityWeights);
    let roll = Math.random() * weights.reduce((sum, [, w]) => sum + w, 0);
    let rarity = weights.at(-1)[0];
    for (const [name, weight] of weights) {
      roll -= weight;
      if (roll < 0) {
        rarity = name;
        break;
      }
    }
    const candidates = zone.species.filter(s => Prime.data.creatures[s].rarity === rarity);
    if (!candidates.length && rarity !== 'Common') return null;
    return (candidates.length ? candidates : zone.species)[Math.floor(Math.random() * (candidates.length || zone.species.length))];
  }
  spawn(zone, initial = false) {
    if (this.wild.length >= Prime.data.rules.maxWild) return;
    const species = initial ? zone.species[Math.floor(Math.random() * Math.min(2, zone.species.length))] : this.pick(zone);
    if (!species) return;
    for (let i = 0; i < 30; i++) {
      const x = (zone.x + .5 + Math.random() * (zone.w - 1)) * 32,
        y = (zone.y + .5 + Math.random() * (zone.h - 1)) * 32;
      if (!this.game.world.walkable(x, y) || Math.hypot(x - this.game.player.x, y - this.game.player.y) < 65 || this.wild.some(c => Math.hypot(c.x - x, c.y - y) < 48)) continue;
      const c = Prime.data.makeCreature(species, 1 + Math.floor(Math.random() * 3));
      Object.assign(c, {
        x,
        y,
        homeX: x,
        homeY: y,
        zone: zone.id,
        age: 0,
        walkTimer: Math.random() * 3,
        dx: 0,
        dy: 0
      });
      this.wild.push(c);
      return;
    }
  }
  update(dt) {
    this.clock += dt;
    if (this.clock > this.next) {
      this.clock = 0;
      this.next = 3 + Math.random() * 3;
      const zones = this.game.world.data.zones;
      this.spawn(zones[Math.floor(Math.random() * zones.length)]);
    }
    for (const c of this.wild) {
      c.age += dt;
      c.walkTimer -= dt;
      if (c.walkTimer < 0) {
        c.walkTimer = 2 + Math.random() * 3;
        const a = Math.random() * Math.PI * 2;
        c.dx = Math.cos(a) * 9;
        c.dy = Math.sin(a) * 9;
      }
      const nx = c.x + c.dx * dt,
        ny = c.y + c.dy * dt,
        z = this.game.world.data.zones.find(z => z.id === c.zone);
      if (nx > z.x * 32 + 12 && nx < (z.x + z.w) * 32 - 12 && ny > z.y * 32 + 12 && ny < (z.y + z.h) * 32 - 12 && this.game.world.walkable(nx, ny)) {
        c.x = nx;
        c.y = ny;
      } else {
        c.dx = 0;
        c.dy = 0;
      }
    }
    this.wild = this.wild.filter(c => c.age < 210 || Math.hypot(c.x - this.game.player.x, c.y - this.game.player.y) < 150);
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
    this.game.assets.frame(ctx, c.species + 'Idle', c.x - 38, c.y - 58, 76, Math.floor(time / 220) % 4);
    ctx.textAlign = 'center';
    ctx.font = 'bold 9px Trebuchet MS';
    const w = ctx.measureText(d.name).width + 12;
    ctx.fillStyle = '#fff9e7e8';
    ctx.fillRect(c.x - w / 2, c.y - 65, w, 15);
    ctx.fillStyle = d.rarity === 'Legendary' ? '#aa7b2d' : '#526a3e';
    ctx.fillText(d.name, c.x, c.y - 54);
  }
};
