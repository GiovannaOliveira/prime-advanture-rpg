'use strict';
Prime.Player = class {
  constructor(game) {
    this.game = game;
    const saved = game.store.state.position;
    this.x = Prime.data.map.spawn[0] * 32;
    this.y = Prime.data.map.spawn[1] * 32;
    if (saved && game.world.walkable(saved.x, saved.y)) {
      this.x = saved.x;
      this.y = saved.y;
    }
    this.direction = 0;
    this.moving = false;
    this.step = 0;
    this.trail = [{
      x: this.x - 24,
      y: this.y + 18
    }];
    this.pet = {
      x: this.x - 24,
      y: this.y + 18
    };
    this.trailTime = 0;
  }
  update(dt) {
    const axis = this.game.input.axis();
    let {
      x,
      y
    } = axis;
    const length = Math.hypot(x, y);
    this.moving = length > 0;
    if (!length) return;
    x /= length;
    y /= length;
    const speed = 145 * dt;
    if (x !== 0) this.direction = x < 0 ? 1 : 2;
    else if (y !== 0) this.direction = y < 0 ? 3 : 0;
    if (this.game.world.walkable(this.x + x * speed, this.y)) this.x += x * speed;
    if (this.game.world.walkable(this.x, this.y + y * speed)) this.y += y * speed;
    this.step += dt * 7;
    this.trailTime += dt;
    if (this.trailTime > .045) {
      this.trailTime = 0;
      this.trail.push({
        x: this.x,
        y: this.y
      });
      if (this.trail.length > 13) this.trail.shift();
    }
  }
  updatePet(dt) {
    const target = this.trail[0];
    const dist = Math.hypot(this.pet.x - target.x, this.pet.y - target.y);
    if (dist > 160) {
      this.pet.x = target.x;
      this.pet.y = target.y;
    } else if (dist > 3) {
      const t = Math.min(1, dt * 8);
      this.pet.x += (target.x - this.pet.x) * t;
      this.pet.y += (target.y - this.pet.y) * t;
    }
  }
  draw(ctx, time) {
    ctx.fillStyle = '#38533330';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 3, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    this.game.assets.frame(ctx, 'player', this.x - 32, this.y - 52, 64, this.moving ? Math.floor(this.step) % 4 : 0, this.direction, 128);
  }
  drawPet(ctx, time) {
    const {
      x,
      y
    } = this.pet;
    ctx.fillStyle = '#38533320';
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    this.game.assets.draw(ctx, 'buddy', x - 18, y - 29 + (this.moving ? Math.sin(time / 100) * 1.5 : 0), 36, 36);
  }
};
