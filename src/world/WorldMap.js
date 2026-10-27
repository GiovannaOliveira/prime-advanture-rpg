'use strict';
Prime.WorldMap = class {
  constructor(assets) {
    this.assets = assets;
    this.data = Prime.data.map;
    this.tile = this.data.tile;
    this.width = this.data.width * this.tile;
    this.height = this.data.height * this.tile;
    this.props = this.data.props.map(([kind, x, y]) => ({
      kind,
      x: x * 32,
      y: y * 32
    }));
    this.obstacles = [];
    for (const b of this.data.buildings) this.obstacles.push({
      x: (b.x - b.w / 2) * 32 + 8,
      y: (b.y - b.h / 2) * 32 + 40,
      w: b.w * 32 - 16,
      h: b.h * 16 - 24
    });
    for (const p of this.props) this.obstacles.push({
      x: p.x - (p.kind.includes('rock') || p.kind === 'sandRock' ? 13 : 12),
      y: p.y - 13,
      w: 24,
      h: 18
    });
    const chest = this.data.chest;
    this.obstacles.push({
      x: chest.x * 32 - 14,
      y: chest.y * 32 - 12,
      w: 28,
      h: 22
    });
    this.layer = document.createElement('canvas');
    this.layer.width = this.width;
    this.layer.height = this.height;
    this.buildTerrain();
  }
  insideIsland(tx, ty, i, inset = 0) {
    const x = i.x + inset,
      y = i.y + inset,
      w = i.w - inset * 2,
      h = i.h - inset * 2;
    if (tx < x || ty < y || tx >= x + w || ty >= y + h) return false;
    const r = 1.1;
    const cx = Math.max(x + r, Math.min(tx, x + w - r)),
      cy = Math.max(y + r, Math.min(ty, y + h - r));
    return (tx - cx) ** 2 + (ty - cy) ** 2 <= r * r;
  }
  land(x, y) {
    const tx = x / 32,
      ty = y / 32;
    return this.data.islands.some(i => this.insideIsland(tx, ty, i)) || this.data.bridges.some(b => tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h);
  }
  walkable(x, y) {
    if (x < 10 || y < 10 || x > this.width - 10 || y > this.height - 10) return false;
    for (const [dx, dy] of [
        [-9, -5],
        [9, -5],
        [-9, 5],
        [9, 5]
      ])
      if (!this.land(x + dx, y + dy)) return false;
    return !this.obstacles.some(b => x + 9 > b.x && x - 9 < b.x + b.w && y + 5 > b.y && y - 5 < b.y + b.h);
  }
  area(x, y) {
    return this.data.islands.find(i => this.insideIsland(x / 32, y / 32, i))?.name || 'Wooden Footbridge';
  }
  pattern(ctx, x, y, fallback) {
    if (this.assets.missing.includes('tiles')) return fallback;
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const p = c.getContext('2d');
    p.imageSmoothingEnabled = false;
    p.drawImage(this.assets.images.tiles, x, y, 16, 16, 0, 0, 32, 32);
    return ctx.createPattern(c, 'repeat');
  }
  rounded(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }
  buildTerrain() {
    const c = this.layer.getContext('2d');
    c.imageSmoothingEnabled = false;
    const grass = this.pattern(c, 0, 0, '#adc562'),
      sand = this.pattern(c, 16, 0, '#f2d58a');
    for (const i of this.data.islands) {
      const x = i.x * 32,
        y = i.y * 32,
        w = i.w * 32,
        h = i.h * 32;
      this.rounded(c, x - 11, y - 5, w + 22, h + 16, 45);
      c.fillStyle = '#a5e1d3';
      c.fill();
      this.rounded(c, x - 5, y - 3, w + 10, h + 8, 40);
      c.fillStyle = '#d7ecd0';
      c.fill();
      this.rounded(c, x, y, w, h, 35);
      c.fillStyle = sand;
      c.fill();
      if (i.ground === 'grass') {
        this.rounded(c, x + 17, y + 17, w - 34, h - 34, 26);
        c.fillStyle = grass;
        c.fill();
      }
    }
    c.fillStyle = sand;
    for (const p of this.data.paths) {
      this.rounded(c, p.x * 32, p.y * 32, p.w * 32, p.h * 32, 16);
      c.fill();
    }
    // Warm plank bridges use the same geometry as the walkable grid.
    for (const b of this.data.bridges) {
      const x = b.x * 32,
        y = b.y * 32,
        w = b.w * 32,
        h = b.h * 32,
        vertical = b.h > b.w;
      c.fillStyle = '#765f42';
      c.fillRect(x - 3, y - 3, w + 6, h + 6);
      c.fillStyle = '#bd9967';
      c.fillRect(x, y, w, h);
      c.strokeStyle = '#9b7a50';
      c.lineWidth = 2;
      if (vertical) {
        for (let yy = y; yy < y + h; yy += 12) {
          c.beginPath();
          c.moveTo(x, yy);
          c.lineTo(x + w, yy);
          c.stroke();
        }
        c.fillStyle = '#e1bc80';
        c.fillRect(x - 4, y, 6, h);
        c.fillRect(x + w - 2, y, 6, h);
      } else {
        for (let xx = x; xx < x + w; xx += 12) {
          c.beginPath();
          c.moveTo(xx, y);
          c.lineTo(xx, y + h);
          c.stroke();
        }
        c.fillStyle = '#e1bc80';
        c.fillRect(x, y - 4, w, 6);
        c.fillRect(x, y + h - 2, w, 6);
      }
      c.fillStyle = '#826343';
      for (const [px, py] of [
          [x, y],
          [x + w - 5, y],
          [x, y + h - 5],
          [x + w - 5, y + h - 5]
        ]) c.fillRect(px - 3, py - 3, 9, 9);
    }
    // Subtle flowers, never placed on paths or on encounter patches.
    const rand = n => {
      const v = Math.sin(n * 127.1) * 43758.5453;
      return v - Math.floor(v);
    };
    for (let j = 0; j < 600; j++) {
      const x = Math.floor(rand(j + 1) * this.width),
        y = Math.floor(rand(j + 601) * this.height);
      const island = this.data.islands.find(i => i.ground === 'grass' && this.insideIsland(x / 32, y / 32, i, .85));
      if (!island || this.data.paths.some(p => x >= p.x * 32 - 8 && x < (p.x + p.w) * 32 + 8 && y >= p.y * 32 - 8 && y < (p.y + p.h) * 32 + 8)) continue;
      const color = ['#e9e8a8', '#f7d3a7', '#eff2ce', '#b5ce6c'][j % 4];
      c.fillStyle = '#7f9f53';
      c.fillRect(x, y, 2, 5);
      c.fillStyle = color;
      c.fillRect(x - 2, y - 2, 6, 3);
      c.fillRect(x, y - 4, 2, 7);
    }
    for (const z of this.data.zones) {
      c.fillStyle = '#92ae4d77';
      this.rounded(c, z.x * 32, z.y * 32, z.w * 32, z.h * 32, 10);
      c.fill();
      for (let y = z.y; y < z.y + z.h; y++)
        for (let x = z.x; x < z.x + z.w; x++) {
          if (this.data.islands.some(i => i.ground === 'sand' && this.insideIsland(x, y, i))) {
            c.fillStyle = '#e9bd73';
            c.fillRect(x * 32 + 10, y * 32 + 10, 4, 3);
          } else this.assets.draw(c, 'grass', x * 32 + 1, y * 32 + 3, 28, 28);
        }
    }
    // Beach details, a quiet boat and small benches are original Canvas decorations.
    c.fillStyle = '#ead2a0';
    c.fillRect(23 * 32, 38 * 32, 36, 18);
    c.fillStyle = '#af8762';
    c.fillRect(23 * 32 + 4, 38 * 32 + 17, 4, 14);
    c.fillRect(23 * 32 + 28, 38 * 32 + 17, 4, 14);
    c.strokeStyle = '#a08c61';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(24 * 32 + 30, 37 * 32 + 10);
    c.lineTo(24 * 32 + 30, 38 * 32 + 25);
    c.stroke();
    c.fillStyle = '#ef9c78';
    c.beginPath();
    c.moveTo(24 * 32 + 2, 37 * 32 + 10);
    c.lineTo(24 * 32 + 30, 36 * 32 + 22);
    c.lineTo(24 * 32 + 58, 37 * 32 + 10);
    c.closePath();
    c.fill();
    c.fillStyle = '#fff1c8';
    c.fillRect(24 * 32 + 25, 36 * 32 + 25, 10, 17);
    c.fillStyle = '#9c7750';
    c.fillRect(6 * 32, 36 * 32, 75, 14);
    c.fillStyle = '#d9b77c';
    c.fillRect(6 * 32 + 4, 36 * 32 + 4, 67, 5);
    c.fillStyle = '#65583c';
    c.fillRect(6 * 32 + 10, 36 * 32 + 13, 5, 12);
    c.fillRect(6 * 32 + 60, 36 * 32 + 13, 5, 12);
    c.save();
    c.translate(7 * 32, 38.5 * 32);
    c.fillStyle = '#7e5c3c';
    c.beginPath();
    c.moveTo(-42, -10);
    c.lineTo(40, -10);
    c.lineTo(25, 14);
    c.lineTo(-25, 14);
    c.closePath();
    c.fill();
    c.fillStyle = '#bd9965';
    c.fillRect(-29, -7, 56, 9);
    c.strokeStyle = '#f0ddaa';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, -5);
    c.lineTo(0, -56);
    c.stroke();
    c.fillStyle = '#faf4da';
    c.beginPath();
    c.moveTo(3, -53);
    c.lineTo(3, -15);
    c.lineTo(30, -15);
    c.closePath();
    c.fill();
    c.restore();
  }
  drawWater(ctx, camera, time) {
    ctx.fillStyle = '#57b2c5';
    ctx.fillRect(0, 0, camera.w, camera.h);
    ctx.strokeStyle = '#81cbd177';
    ctx.lineWidth = 2;
    const shift = Math.floor(time / 900) % 3;
    for (let y = Math.floor(camera.y / 48) * 48; y < camera.y + camera.h + 48; y += 48) {
      for (let x = Math.floor(camera.x / 72) * 72; x < camera.x + camera.w + 72; x += 72) {
        const xx = x - camera.x + (Math.floor(y / 48) % 2) * 28,
          yy = y - camera.y;
        ctx.beginPath();
        ctx.moveTo(xx, yy);
        ctx.lineTo(xx + 8 + shift, yy);
        ctx.moveTo(xx + 32, yy + 18);
        ctx.lineTo(xx + 45, yy + 18);
        ctx.stroke();
      }
    }
  }
  drawGround(ctx, camera, time) {
    this.drawWater(ctx, camera, time);
    ctx.drawImage(this.layer, Math.round(-camera.x), Math.round(-camera.y));
  }
  drawProp(ctx, p) {
    const rock = ['rock', 'sandRock'].includes(p.kind),
      palm = p.kind.toLowerCase().includes('palm'),
      small = p.kind.startsWith('small');
    const w = rock ? 30 : palm ? 80 : small ? 58 : 76,
      h = rock ? 30 : palm ? 116 : small ? 78 : 110;
    this.assets.draw(ctx, p.kind, p.x - w / 2, p.y - h + 13, w, h);
  }
  drawBuilding(ctx, b) {
    const w = b.w * 32,
      h = b.h * 32;
    this.assets.draw(ctx, b.kind, b.x * 32 - w / 2, b.y * 32 - h + 36, w, h);
    ctx.fillStyle = '#405e3e';
    ctx.fillRect(b.x * 32 - 5, b.y * 32 + 30, 10, 13);
    ctx.fillStyle = '#fff7dd';
    ctx.fillRect(b.x * 32 - 54, b.y * 32 + 17, 108, 18);
    ctx.strokeStyle = '#b79d6c';
    ctx.strokeRect(b.x * 32 - 54, b.y * 32 + 17, 108, 18);
    ctx.font = 'bold 8px Trebuchet MS';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#65734b';
    ctx.fillText(b.label, b.x * 32, b.y * 32 + 29);
  }
  drawChest(ctx, time, available) {
    const x = this.data.chest.x * 32,
      y = this.data.chest.y * 32;
    ctx.fillStyle = '#3e5b3633';
    ctx.beginPath();
    ctx.ellipse(x, y + 10, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = available ? '#b87b39' : '#9b9373';
    ctx.fillRect(x - 18, y - 12, 36, 26);
    ctx.fillStyle = available ? '#dfb65b' : '#bbb08a';
    ctx.fillRect(x - 20, y - 19, 40, 15);
    ctx.fillStyle = '#f8d987';
    ctx.fillRect(x - 12, y - 19, 4, 33);
    ctx.fillRect(x + 8, y - 19, 4, 33);
    ctx.fillStyle = '#fff4b9';
    ctx.fillRect(x - 4, y - 6, 8, 9);
    ctx.fillStyle = '#725b35';
    ctx.fillRect(x - 1, y - 3, 2, 4);
    if (available) {
      ctx.font = '18px Trebuchet MS';
      ctx.fillStyle = '#fff7b2';
      ctx.textAlign = 'center';
      ctx.fillText('✧', x, y - 30 + Math.sin(time / 450) * 3);
    }
    ctx.font = 'bold 8px Trebuchet MS';
    ctx.fillStyle = '#53663f';
    ctx.textAlign = 'center';
    ctx.fillText('DAILY CHEST', x, y + 29);
  }
  drawSign(ctx, s) {
    const x = s.x * 32,
      y = s.y * 32;
    ctx.fillStyle = '#8a7149';
    ctx.fillRect(x - 3, y - 7, 6, 22);
    ctx.fillStyle = '#e6cb8e';
    ctx.fillRect(x - 15, y - 17, 30, 18);
    ctx.strokeStyle = '#a38b57';
    ctx.strokeRect(x - 15, y - 17, 30, 18);
    ctx.fillStyle = '#7c8452';
    ctx.fillRect(x - 9, y - 12, 18, 2);
    ctx.fillRect(x - 9, y - 7, 11, 2);
  }
};
