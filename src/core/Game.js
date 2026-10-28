'use strict';
Prime.Game = class {
  constructor() {
    this.canvas = document.getElementById('world');
    this.ctx = this.canvas.getContext('2d');
    this.assets = new Prime.AssetLoader();
    this.store = new Prime.systems.ProgressionSystem();
    this.camera = {
      x: 0,
      y: 0,
      w: 1200,
      h: 700
    };
    this.time = 0;
    this.autosave = 0;
    this.lastFrame = 0;
    this.nearby = null;
  }
  async init() {
    await this.assets.load();
    this.world = new Prime.WorldMap(this.assets, this.store);
    this.player = new Prime.Player(this);
    this.ui = new Prime.ui.UI(this);
    this.input = new Prime.InputManager(this);
    this.encounters = new Prime.systems.EncounterSystem(this);
    this.english = new Prime.systems.EnglishChallengeSystem(this);
    this.battle = new Prime.systems.BattleSystem(this);
    this.recordRegion();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pagehide', () => this.savePosition());
    document.addEventListener('visibilitychange', () => {
      this.input.keys.clear();
      if (document.hidden) this.savePosition();
    });
    document.getElementById('loading').hidden = true;
    this.ui.updateHUD();
    this.store.save();
    this.canvas.focus({
      preventScroll: true
    });
    requestAnimationFrame(t => this.loop(t));
    if (this.assets.missing.length) this.ui.toast('Some artwork could not load. Friendly placeholders are here to help.');
  }
  resize() {
    const bounds = this.canvas.getBoundingClientRect(),
      ratio = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(bounds.width * ratio);
    this.canvas.height = Math.round(bounds.height * ratio);
    this.pixelRatio = ratio;
    this.camera.w = bounds.width;
    this.camera.h = bounds.height;
  }
  loop(t) {
    const dt = Math.min((t - (this.lastFrame || t)) / 1000, .04);
    this.lastFrame = t;
    this.time = t;
    if (!this.ui.isOpen() && !document.hidden) {
      this.player.update(dt);
      this.player.updatePet(dt);
      this.recordRegion();
      this.encounters.update(dt);
      this.autosave += dt;
      if (this.autosave > 3) {
        this.autosave = 0;
        this.savePosition();
      }
      this.updateInteraction();
    }
    this.camera.x = Math.max(0, Math.min(this.world.width - this.camera.w, this.player.x - this.camera.w / 2));
    this.camera.y = Math.max(0, Math.min(this.world.height - this.camera.h, this.player.y - this.camera.h / 2 + 20));
    this.render(t);
    document.getElementById('area-name').textContent = this.world.area(this.player.x, this.player.y);
    requestAnimationFrame(next => this.loop(next));
  }
  render(time) {
    const ctx = this.ctx,
      camera = this.camera;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.imageSmoothingEnabled = false;
    this.world.drawGround(ctx, camera, time);
    ctx.save();
    ctx.translate(-Math.round(camera.x), -Math.round(camera.y));
    const drawables = [];
    for (const p of this.world.props) drawables.push({
      y: p.y,
      draw: () => this.world.drawProp(ctx, p)
    });
    for (const b of this.world.data.buildings) drawables.push({
      y: b.y * 32 + 18,
      draw: () => this.world.drawBuilding(ctx, b)
    });
    for (const s of this.world.data.signs) drawables.push({
      y: s.y * 32,
      draw: () => this.world.drawSign(ctx, s)
    });
    drawables.push({
      y: this.world.data.chest.y * 32,
      draw: () => this.world.drawChest(ctx, time, this.store.dailyRemaining() === 0)
    });
    for (const n of this.world.data.npcs) drawables.push({
      y: n.y * 32,
      draw: () => {
        ctx.fillStyle = '#345b3c22';
        ctx.beginPath();
        ctx.ellipse(n.x * 32, n.y * 32 + 3, 13, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        this.assets.frame(ctx, n.id, n.x * 32 - 30, n.y * 32 - 48, 60, 0, 0, 128);
        ctx.fillStyle = '#fff8df';
        ctx.strokeStyle = '#bac891';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(n.x * 32 - 8, n.y * 32 - 60, 16, 16, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#7d8c59';
        ctx.font = 'bold 11px Trebuchet MS';
        ctx.textAlign = 'center';
        ctx.fillText(n.action === 'academy' ? '!' : n.action === 'heal' ? '+' : '$', n.x * 32, n.y * 32 - 48);
      }
    });
    for (const gate of this.world.data.gates || []) drawables.push({
      y: gate.y * 32,
      draw: () => this.world.drawGate(ctx, gate, time)
    });
    for (const region of this.world.data.islands) drawables.push({
      y: region.note[1] * 32,
      draw: () => this.world.drawDiscovery(ctx, region, time, this.store.state.exploration.claimed.includes(region.id))
    });
    for (const c of this.encounters.wild) drawables.push({
      y: c.y,
      draw: () => this.encounters.draw(ctx, c, time)
    });
    drawables.push({
      y: this.player.pet.y,
      draw: () => this.player.drawPet(ctx, time)
    }, {
      y: this.player.y,
      draw: () => this.player.draw(ctx, time)
    });
    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables)
      if (d.y > camera.y - 200 && d.y < camera.y + camera.h + 200) d.draw();
    // Gentle location markers let the grass stay readable.
    ctx.font = 'bold 9px Trebuchet MS';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#557444';
    for (const z of this.world.data.zones) ctx.fillText(z.label, (z.x + z.w / 2) * 32, z.y * 32 - 8);
    ctx.restore();
  }
  updateInteraction() {
    const targets = [];
    for (const n of this.world.data.npcs) targets.push({
      x: n.x * 32,
      y: n.y * 32,
      label: n.name,
      kind: n.action
    });
    for (const s of this.world.data.signs) targets.push({
      x: s.x * 32,
      y: s.y * 32,
      label: 'Read the sign',
      kind: 'sign',
      data: s
    });
    const chest = this.world.data.chest;
    targets.push({
      x: chest.x * 32,
      y: chest.y * 32,
      label: this.store.dailyRemaining() === 0 ? 'Open your daily gift' : 'Check the daily chest',
      kind: 'chest'
    });
    for (const c of this.encounters.wild) targets.push({
      x: c.x,
      y: c.y,
      label: `Meet ${Prime.data.creatures[c.species].name}`,
      kind: 'creature',
      data: c
    });
    for (const gate of this.world.data.gates || [])
      if (!this.world.isOpen(gate.region)) targets.push({
        x: gate.x * 32,
        y: gate.y * 32,
        label: 'Open the explorer gate',
        kind: 'gate',
        data: gate
      });
    for (const region of this.world.data.islands) targets.push({
      x: region.note[0] * 32,
      y: region.note[1] * 32,
      label: 'Read the discovery post',
      kind: 'discovery',
      data: region
    });
    targets.push({
      x: 7 * 32,
      y: 37.5 * 32,
      label: 'Travel with the harbor boat',
      kind: 'travel'
    });
    targets.forEach(t => t.distance = Math.hypot(t.x - this.player.x, t.y - this.player.y));
    this.nearby = targets.filter(t => t.distance < 65).sort((a, b) => a.distance - b.distance)[0] || null;
    const el = document.getElementById('interact-prompt');
    el.hidden = !this.nearby;
    if (this.nearby) {
      el.querySelector('span').textContent = this.nearby.label;
      el.style.left = Math.max(150, Math.min(this.camera.w - 150, this.player.x - this.camera.x)) + 'px';
      el.style.top = Math.max(100, Math.min(this.camera.h - 145, this.player.y - this.camera.y + 60)) + 'px';
    }
  }
  interact() {
    if (this.ui.isOpen()) return;
    this.updateInteraction();
    const t = this.nearby;
    if (!t) {
      this.ui.toast('Walk a little closer to a friend, a sign, or a chest, then press E.');
      return;
    }
    switch (t.kind) {
      case 'academy':
        if (!this.store.state.party.length) this.ui.starters();
        else this.ui.dialogue('Professor Willow', 'Hello, explorer! Every new word makes your adventure a little brighter. Meet wild friends in the tall grass, and visit our English club to practice.', [{
          label: 'Visit the English club',
          action: () => this.ui.englishClub()
        }, {
          label: 'Back to exploring',
          action: () => this.ui.close(true)
        }]);
        break;
      case 'shop':
        this.ui.shop();
        break;
      case 'heal':
        this.store.heal();
        this.ui.updateHUD();
        this.ui.dialogue('Nora · Healing House', this.store.state.party.length ? 'Hello, friend! Your creatures are feeling happy and healthy again. Come back any time. Healing is always free!' : 'Hello, explorer! Choose your first creature, then come back whenever your friends need a little rest.');
        break;
      case 'chest':
        this.ui.daily();
        break;
      case 'sign':
        this.ui.dialogue(t.data.title, t.data.text);
        break;
      case 'gate':
        this.openGate(t.data.region);
        break;
      case 'discovery':
        this.discovery(t.data);
        break;
      case 'travel':
        this.ui.map();
        break;
      case 'creature':
        this.battle.start(t.data);
        break;
    }
  }
  recordRegion() {
    const region = this.world.regionAt(this.player.x, this.player.y);
    if (region && this.store.visit(region.id)) {
      this.ui?.updateHUD();
      if (this.store.state.exploration.visited.length > 1) this.ui?.toast('Discovered: ' + region.name);
    }
  }
  openGate(id) {
    const region = this.world.data.islands.find(r => r.id === id),
      status = this.store.unlockStatus(id);
    if (!status.ready) {
      this.ui.dialogue(region.name + ' · Explorer gate', status.hint + ' Come back when you are ready.', [{
        label: 'Practice English',
        action: () => this.ui.englishClub()
      }, {
        label: 'Back to exploring',
        action: () => this.ui.close(true)
      }]);
      return;
    }
    this.english.open('Open the path to ' + region.name + '!', () => {
      this.store.unlockRegion(id);
      this.ui.close(true);
      this.ui.toast('The path to ' + region.name + ' is open!');
    }, () => this.ui.close(true));
  }
  discovery(region) {
    this.recordRegion();
    const claimed = this.store.state.exploration.claimed.includes(region.id);
    this.ui.dialogue(region.name + ' · Field notes', region.lesson, [{
      label: claimed ? 'Back to exploring' : 'Try a discovery challenge',
      action: () => {
        if (claimed) {
          this.ui.close(true);
          return;
        }
        this.english.open('A discovery at ' + region.name, () => {
          if (this.store.claimDiscovery(region.id)) this.ui.toast('Discovery recorded! +15 coins · +1 orb · +10 XP');
          this.ui.updateHUD();
          this.ui.close(true);
        }, () => this.ui.close(true));
      }
    }, ...(!claimed ? [{
      label: 'Maybe later',
      action: () => this.ui.close(true)
    }] : [])]);
  }
  travelTo(id) {
    const region = this.world.data.islands.find(r => r.id === id);
    if (!region || !this.world.isOpen(id) || !this.store.state.exploration.visited.includes(id)) return false;
    const [x, y] = region.arrival.map(n => n * 32);
    if (!this.world.walkable(x, y)) return false;
    this.player.x = x;
    this.player.y = y;
    this.player.trail = [{
      x: x - 20,
      y: y + 15
    }];
    this.player.pet = {
      ...this.player.trail[0]
    };
    this.encounters.refresh();
    this.savePosition();
    this.ui.close(true);
    this.ui.toast('Welcome back to ' + region.name + '!');
    return true;
  }
  savePosition() {
    if (this.player) {
      this.store.state.position = {
        x: this.player.x,
        y: this.player.y
      };
      this.store.save();
    }
  }
  resetPosition() {
    this.player.x = Prime.data.map.spawn[0] * 32;
    this.player.y = Prime.data.map.spawn[1] * 32;
    this.player.trail = [{
      x: this.player.x - 25,
      y: this.player.y + 15
    }];
    this.player.pet = {
      ...this.player.trail[0]
    };
    this.savePosition();
    this.ui.toast('Welcome back to the meadow!');
  }
  resetProgress() {
    this.store.state = this.store.defaults();
    this.player.x = Prime.data.map.spawn[0] * 32;
    this.player.y = Prime.data.map.spawn[1] * 32;
    this.store.save();
    location.reload();
  }
};
