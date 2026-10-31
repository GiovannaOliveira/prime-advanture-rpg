'use strict';
Prime.AssetLoader = class {
  constructor() {
    this.images = {};
    this.missing = [];
    this.frames = {};
  }
  async load() {
    await Promise.all(Object.entries(Prime.data.assets).map(([key, path]) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        this.images[key] = img;
        resolve();
      };
      img.onerror = () => {
        this.missing.push(key);
        console.warn('Asset unavailable; using a placeholder:', path);
        this.images[key] = this.placeholder();
        resolve();
      };
      img.src = path;
    })));
  }
  placeholder() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#96aa71';
    x.fillRect(40, 36, 48, 60);
    x.fillStyle = '#304b39';
    x.fillRect(50, 52, 6, 6);
    x.fillRect(72, 52, 6, 6);
    return c;
  }
  draw(ctx, key, x, y, w, h) {
    const img = this.images[key];
    if (img) ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
  }
  frame(ctx, key, x, y, size, column = 0, row = 0, frame = 96) {
    const img = this.images[key];
    if (!img) return;
    if (this.missing.includes(key)) {
      ctx.drawImage(img, x, y, size, size);
      return;
    }
    ctx.drawImage(img, column * frame, row * frame, frame, frame, Math.round(x), Math.round(y), size, size);
  }
  creatureFrame(ctx, id, x, y, size, column = 0, pose = 'Idle') {
    if (Prime.data.creatures[id].assetFormat !== 'portrait') {
      this.frame(ctx, id + pose, x, y, size, column);
      return;
    }
    const img = this.images[id];
    if (!img) return;
    const factor = size * .6 / Math.max(img.width, img.height),
      w = img.width * factor,
      h = img.height * factor;
    ctx.drawImage(img, Math.round(x + (size - w) / 2), Math.round(y + size * .8 - h), Math.round(w), Math.round(h));
  }
  creatureMarkup(id, size = 96, pose = 'front', extra = '') {
    const d = Prime.data.creatures[id];
    if (d.assetFormat !== 'portrait') return this.markup(pose === 'idle' ? id + 'Idle' : id, size, pose === 'back' ? 1 : 0, 0, 96, extra);
    const img = this.images[id],
      factor = size * .6 / Math.max(img?.width || 128, img?.height || 128);
    const url = this.missing.includes(id) ? this.placeholder().toDataURL() : Prime.data.assets[id];
    return `<span role="img" aria-label="${d.name}" class="sprite-image static-sprite ${this.missing.includes(id)?'placeholder':''} ${extra}" style="--sprite-facing:${pose==='back'?-1:1};display:inline-block;flex-shrink:0;width:${size}px;height:${size}px;background-image:url('${url}');background-position:center;background-repeat:no-repeat;background-size:${(img?.width||128)*factor}px ${(img?.height||128)*factor}px;image-rendering:pixelated"></span>`;
  }
  iconMarkup(id, size) {
    return Prime.data.creatures[id].assetFormat === 'portrait' ? this.creatureMarkup(id, size) : this.markup(id + 'Icon', size, 0, 0, 32);
  }
  markup(key, size = 96, column = 0, row = 0, frame = 96, extra = '') {
    const img = this.images[key];
    const missing = this.missing.includes(key);
    const f = missing ? 128 : frame;
    const cols = (img?.width || f) / f,
      rows = (img?.height || f) / f;
    return `<span role="img" aria-label="${key.replace(/Idle|Attack/g,'')}" class="sprite-image ${missing?'placeholder':''} ${extra}" style="--frame-size:${size}px;display:inline-block;flex-shrink:0;width:${size}px;height:${size}px;image-rendering:pixelated;background-image:url('${missing?this.placeholder().toDataURL():Prime.data.assets[key]}');background-repeat:no-repeat;background-size:${cols*size}px ${rows*size}px;background-position:-${(missing?0:column)*size}px -${(missing?0:row)*size}px"></span>`;
  }
};
