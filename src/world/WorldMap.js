'use strict';
Prime.WorldMap = class {
  constructor(assets, store) {
    this.store = store;
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
    for (const wall of this.data.walls || []) this.obstacles.push({
      x: wall.x * 32,
      y: wall.y * 32,
      w: wall.w * 32,
      h: wall.h * 32
    });
    for (const fence of this.data.fences || []) this.obstacles.push({
      x: fence.x * 32,
      y: fence.y * 32,
      w: fence.w * 32,
      h: 8
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
    if (i.shape) {
      let inside = false;
      for (let a = 0, b = i.shape.length - 1; a < i.shape.length; b = a++) {
        const [ax, ay] = i.shape[a], [bx, by] = i.shape[b];
        if ((ay > ty) !== (by > ty) && tx < (bx - ax) * (ty - ay) / (by - ay) + ax) inside = !inside;
      }
      return inside;
    }
    const r = 1.1;
    const cx = Math.max(x + r, Math.min(tx, x + w - r)),
      cy = Math.max(y + r, Math.min(ty, y + h - r));
    return (tx - cx) ** 2 + (ty - cy) ** 2 <= r * r;
  }
  regionAt(x, y) {
    return this.data.islands.find(i => this.insideIsland(x / 32, y / 32, i));
  }
  isOpen(id) {
    const region = this.data.islands.find(i => i.id === id);
    return !!region && (!region.requirement || !!this.store?.state.exploration.unlocked.includes(id));
  }
  onBridge(tx, ty) {
    return this.data.bridges.some(b => tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h);
  }
  waterAt(tx, ty) {
    return (this.data.water || []).find(w => {
      if (!w.points) return Math.hypot(tx - w.x, ty - w.y) < w.radius;
      return w.points.slice(1).some((p, i) => {
        const a = w.points[i],
          dx = p[0] - a[0],
          dy = p[1] - a[1];
        const t = Math.max(0, Math.min(1, ((tx - a[0]) * dx + (ty - a[1]) * dy) / (dx * dx + dy * dy)));
        return Math.hypot(tx - a[0] - t * dx, ty - a[1] - t * dy) < w.width / 2;
      });
    });
  }
  land(x, y) {
    const tx = x / 32,
      ty = y / 32;
    if (this.onBridge(tx, ty)) return true;
    return !!this.regionAt(x, y) && !this.waterAt(tx, ty);
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
    const region = this.regionAt(x, y);
    if (region && !this.isOpen(region.id)) return false;
    for (const gate of this.data.gates || []) {
      if (this.isOpen(gate.region)) continue;
      const w = gate.vertical ? 14 : 70,
        h = gate.vertical ? 70 : 14;
      if (Math.abs(x - gate.x * 32) < w / 2 + 9 && Math.abs(y - gate.y * 32) < h / 2 + 5) return false;
    }
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
  traceRegion(c, r) {
    c.beginPath();
    if (r.shape) {
      r.shape.forEach(([x, y], i) => i ? c.lineTo(x * 32, y * 32) : c.moveTo(x * 32, y * 32));
      c.closePath();
    } else c.roundRect(r.x * 32, r.y * 32, r.w * 32, r.h * 32, 35);
  }
  traceWater(c, w) {
    c.beginPath();
    if (w.points) w.points.forEach(([x, y], i) => i ? c.lineTo(x * 32, y * 32) : c.moveTo(x * 32, y * 32));
    else c.arc(w.x * 32, w.y * 32, w.radius * 32, 0, Math.PI * 2);
  }
  pixelPattern(c, base, detail) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 32;
    const t = tile.getContext('2d');
    t.fillStyle = base;
    t.fillRect(0, 0, 32, 32);
    t.fillStyle = detail;
    for (const [x, y, w, h] of [
        [3, 4, 4, 2],
        [21, 10, 3, 3],
        [10, 25, 6, 2],
        [28, 30, 2, 2]
      ]) t.fillRect(x, y, w, h);
    return c.createPattern(tile, 'repeat');
  }
  buildTerrain() {
    const c = this.layer.getContext('2d');
    c.imageSmoothingEnabled = false;
    const grass = this.pattern(c, 0, 0, '#aec86a'),
      sand = this.pattern(c, 16, 0, '#f1d797');
    const grounds = {
      grass,
      sand,
      ember: this.pixelPattern(c, '#b88b68', '#cfa67a'),
      stone: this.pixelPattern(c, '#9e98b2', '#b4acc6'),
      snow: this.pixelPattern(c, '#e4f0eb', '#d1e4e6'),
      mystic: this.pixelPattern(c, '#91b49b', '#9ec0a5')
    };
    const edge = {
      grass: '#ead293',
      sand: '#eed6a1',
      ember: '#805e4d',
      stone: '#6b687e',
      snow: '#9bc4d5',
      mystic: '#baa89a'
    };
    for (const r of this.data.islands) {
      this.traceRegion(c, r);
      c.lineJoin = 'round';
      c.lineWidth = 22;
      c.strokeStyle = '#8bcecb';
      c.stroke();
      this.traceRegion(c, r);
      c.fillStyle = grounds[r.ground] || grass;
      c.fill();
      c.save();
      this.traceRegion(c, r);
      c.clip();
      c.lineWidth = 20;
      c.strokeStyle = edge[r.ground];
      c.stroke();
      if (r.id === 'forest') {
        c.fillStyle = '#487c3930';
        c.fillRect(r.x * 32, r.y * 32, r.w * 32, r.h * 32);
      }
      c.restore();
    }
    // Paths remain visual surfaces; the same land, water and obstacles define collisions.
    for (const p of this.data.paths) {
      c.fillStyle = sand;
      this.rounded(c, p.x * 32, p.y * 32, p.w * 32, p.h * 32, 16);
      c.fill();
    }
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const trail of this.data.trails || []) {
      const r = this.regionAt(trail.points[0][0] * 32, trail.points[0][1] * 32);
      c.strokeStyle = r?.ground === 'snow' ? '#ccdfda' : r?.ground === 'stone' ? '#c3bac7' : r?.ground === 'ember' ? '#d6b084' : r?.ground === 'mystic' ? '#d8c7a1' : sand;
      c.lineWidth = trail.width * 32;
      c.beginPath();
      trail.points.forEach(([x, y], i) => i ? c.lineTo(x * 32, y * 32) : c.moveTo(x * 32, y * 32));
      c.stroke();
    }
    for (const w of this.data.water || []) {
      this.traceWater(c, w);
      c.strokeStyle = w.lava ? '#f2bc69' : w.ice ? '#c1e9e8' : '#e5dfbb';
      c.fillStyle = w.lava ? '#d97850' : w.ice ? '#8bc5da' : '#66b9cb';
      if (w.points) {
        c.lineWidth = w.width * 32 + 10;
        c.stroke();
        this.traceWater(c, w);
        c.lineWidth = w.width * 32;
        c.strokeStyle = c.fillStyle;
        c.stroke();
      } else {
        c.lineWidth = 8;
        c.fill();
        c.stroke();
      }
    }
    // Planks cross both open sea and the streams inside a region.
    for (const b of this.data.bridges) {
      const x = b.x * 32,
        y = b.y * 32,
        w = b.w * 32,
        h = b.h * 32,
        vertical = b.h > b.w;
      c.fillStyle = '#775f45';
      c.fillRect(x - 3, y - 3, w + 6, h + 6);
      c.fillStyle = '#be9b6b';
      c.fillRect(x, y, w, h);
      c.strokeStyle = '#9f7c51';
      c.lineWidth = 2;
      for (let n = 0; n < (vertical ? h : w); n += 12) {
        c.beginPath();
        c.moveTo(vertical ? x : x + n, vertical ? y + n : y);
        c.lineTo(vertical ? x + w : x + n, vertical ? y + n : y + h);
        c.stroke();
      }
      c.fillStyle = '#e3c08a';
      if (vertical) {
        c.fillRect(x - 3, y, 5, h);
        c.fillRect(x + w - 2, y, 5, h);
      } else {
        c.fillRect(x, y - 3, w, 5);
        c.fillRect(x, y + h - 2, w, 5);
      }
      c.fillStyle = '#806447';
      for (const [px, py] of [
          [x, y],
          [x + w - 5, y],
          [x, y + h - 5],
          [x + w - 5, y + h - 5]
        ]) c.fillRect(px - 2, py - 2, 8, 8);
    }
    for (const wall of this.data.walls || []) {
      const x = wall.x * 32,
        y = wall.y * 32,
        w = wall.w * 32,
        h = wall.h * 32;
      c.fillStyle = wall.color;
      c.fillRect(x, y, w, h);
      c.fillStyle = '#ffffff30';
      c.fillRect(x, y, w, 5);
      c.strokeStyle = '#302e3833';
      c.lineWidth = 2;
      for (let xx = x + 16; xx < x + w; xx += 28) {
        c.beginPath();
        c.moveTo(xx, y + 6);
        c.lineTo(xx - 6, y + h - 2);
        c.stroke();
      }
    }
    for (const z of this.data.zones) {
      const r = this.data.islands.find(i => i.id === z.region);
      c.save();
      this.traceRegion(c, r);
      c.clip();
      c.fillStyle = r.ground === 'snow' ? '#b0ced333' : r.ground === 'stone' ? '#82799533' : r.ground === 'ember' ? '#ab704833' : r.ground === 'mystic' ? '#638b7b33' : '#839e3c33';
      this.rounded(c, z.x * 32, z.y * 32, z.w * 32, z.h * 32, 12);
      c.fill();
      for (let yy = z.y; yy < z.y + z.h; yy++)
        for (let xx = z.x; xx < z.x + z.w; xx++) {
          if (!this.land((xx + .5) * 32, (yy + .5) * 32) || this.waterAt(xx + .5, yy + .5)) continue;
          if (['grass', 'mystic'].includes(r.ground)) this.assets.draw(c, 'grass', xx * 32 + 2, yy * 32 + 4, 26, 26);
          else {
            c.fillStyle = r.ground === 'stone' ? '#d5c5ee' : r.ground === 'ember' ? '#e6bc7b' : '#ffffff';
            c.fillRect(xx * 32 + 12, yy * 32 + 14, 5, 3);
            c.fillRect(xx * 32 + 14, yy * 32 + 11, 2, 8);
          }
        }
      c.restore();
    }
    const rand = n => {
      const f = Math.sin(n * 127.1) * 43758.5453;
      return f - Math.floor(f);
    };
    for (let j = 0; j < 2400; j++) {
      const x = Math.floor(rand(j + 1) * this.width),
        y = Math.floor(rand(j + 2601) * this.height),
        r = this.regionAt(x, y);
      if (!r || !['grass', 'mystic'].includes(r.ground) || !this.land(x, y) || this.onBridge(x / 32, y / 32)) continue;
      if (this.data.paths.some(p => x >= p.x * 32 - 8 && x < (p.x + p.w) * 32 + 8 && y >= p.y * 32 - 8 && y < (p.y + p.h) * 32 + 8)) continue;
      c.fillStyle = '#6e9251';
      c.fillRect(x, y, 2, 5);
      c.fillStyle = ['#f2dda1', '#e8c6b6', '#eff0cd'][j % 3];
      c.fillRect(x - 2, y - 2, 6, 3);
      c.fillRect(x, y - 4, 2, 6);
    }
    this.drawVillage(c);
    this.drawCoveDecor(c);
  }
  drawVillage(c) {
    // Flower beds and fences organize the inhabited areas without copying reference assets.
    for (const f of this.data.fences || []) {
      const x = f.x * 32,
        y = f.y * 32,
        w = f.w * 32;
      c.fillStyle = '#9b805b';
      c.fillRect(x, y, w, 5);
      for (let p = x; p < x + w; p += 13) {
        c.fillStyle = '#bca079';
        c.fillRect(p, y - 7, 5, 18);
        c.fillStyle = '#e4c895';
        c.fillRect(p, y - 8, 5, 3);
      }
    }
    for (const [x, y] of [
        [24, 9],
        [25, 9],
        [31, 9.6],
        [34, 8],
        [42, 17.5],
        [23, 20]
      ]) {
      c.fillStyle = '#739154';
      c.fillRect(x * 32 - 10, y * 32 - 7, 22, 14);
      c.fillStyle = '#eec58f';
      c.fillRect(x * 32 - 7, y * 32 - 5, 4, 4);
      c.fillStyle = '#d9e7a0';
      c.fillRect(x * 32 + 3, y * 32, 4, 4);
    }
    // Cave crystals are small ground decorations; the tall stone walls stay solid.
    for (const [x, y] of [
        [51, 36.5],
        [56, 39],
        [60, 48],
        [69, 39],
        [72, 52],
        [47, 43],
        [66, 54],
        [75, 44]
      ]) {
      c.fillStyle = '#706585';
      c.fillRect(x * 32 - 9, y * 32 + 5, 22, 5);
      c.fillStyle = '#b1d5e3';
      c.beginPath();
      c.moveTo(x * 32 - 6, y * 32 + 6);
      c.lineTo(x * 32 - 2, y * 32 - 14);
      c.lineTo(x * 32 + 4, y * 32 - 4);
      c.lineTo(x * 32 + 4, y * 32 + 6);
      c.closePath();
      c.fill();
      c.fillStyle = '#d8c7ee';
      c.fillRect(x * 32 + 5, y * 32 - 8, 5, 13);
    }
  }
  drawCoveDecor(c) {
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
    if (p.kind === 'crystal') {
      const x = p.x,
        y = p.y,
        h = 48 + Math.floor((Math.sin(x + y) + 1) * 13),
        w = 24;
      ctx.fillStyle = '#57557044';
      ctx.beginPath();
      ctx.ellipse(x, y + 5, 24, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#a5b5db';
      ctx.beginPath();
      ctx.moveTo(x - 13, y + 7);
      ctx.lineTo(x - 16, y - h + 17);
      ctx.lineTo(x - 3, y - h);
      ctx.lineTo(x + 12, y - h + 14);
      ctx.lineTo(x + 11, y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#dfedf2';
      ctx.beginPath();
      ctx.moveTo(x - 3, y - h);
      ctx.lineTo(x + 3, y - h + 17);
      ctx.lineTo(x + 2, y + 3);
      ctx.lineTo(x - 6, y + 5);
      ctx.lineTo(x - 6, y - h + 15);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b3cce5';
      ctx.beginPath();
      ctx.moveTo(x + 9, y + 8);
      ctx.lineTo(x + 14, y - 29);
      ctx.lineTo(x + 24, y - 37);
      ctx.lineTo(x + 29, y - 22);
      ctx.lineTo(x + 24, y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ede7f8';
      ctx.fillRect(x + 15, y - 23, 4, 26);
      return;
    }

    const rock = ['rock', 'sandRock', 'iceRock'].includes(p.kind),
      palm = p.kind.toLowerCase().includes('palm'),
      small = p.kind.startsWith('small');
    const pillar = p.kind.toLowerCase().includes('pillar');
    const w = rock ? 30 : pillar ? 48 : palm ? 80 : small ? 58 : 76,
      h = rock ? 30 : pillar ? 100 : palm ? 116 : small ? 78 : 110;
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
  drawGate(c, g, time) {
    const x = g.x * 32,
      y = g.y * 32,
      open = this.isOpen(g.region);
    c.fillStyle = '#7b7665';
    if (g.vertical) {
      c.fillRect(x - 7, y - 37, 14, 12);
      c.fillRect(x - 7, y + 25, 14, 12);
    } else {
      c.fillRect(x - 37, y - 7, 12, 14);
      c.fillRect(x + 25, y - 7, 12, 14);
    }
    if (!open) {
      c.strokeStyle = '#f1d394';
      c.lineWidth = 7;
      c.beginPath();
      c.moveTo(x + (g.vertical ? 0 : -30), y + (g.vertical ? -30 : 0));
      c.lineTo(x + (g.vertical ? 0 : 30), y + (g.vertical ? 30 : 0));
      c.stroke();
      c.fillStyle = '#f9e6b5';
      c.font = 'bold 17px Trebuchet MS';
      c.textAlign = 'center';
      c.fillText('?', x, y - 45 + Math.sin(time / 500) * 2);
    }
  }
  drawDiscovery(c, r, time, claimed) {
    const [tx, ty] = r.note, x = tx * 32, y = ty * 32;
    c.fillStyle = '#8a7656';
    c.fillRect(x - 3, y - 4, 6, 18);
    c.fillStyle = claimed ? '#bdc9a5' : '#fff1c8';
    c.fillRect(x - 12, y - 22, 24, 23);
    c.strokeStyle = '#98a36e';
    c.lineWidth = 2;
    c.strokeRect(x - 12, y - 22, 24, 23);
    c.fillStyle = '#6c8c65';
    c.font = 'bold 14px Trebuchet MS';
    c.textAlign = 'center';
    c.fillText(claimed ? '✓' : '?', x, y - 6);
    if (!claimed) {
      c.fillStyle = '#fff9c6';
      c.font = '16px Trebuchet MS';
      c.fillText('✦', x, y - 34 + Math.sin(time / 500) * 2);
    }
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
