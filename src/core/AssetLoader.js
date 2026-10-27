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
  markup(key, size = 96, column = 0, row = 0, frame = 96, extra = '') {
    const img = this.images[key];
    const missing = this.missing.includes(key);
    const f = missing ? 128 : frame;
    const cols = (img?.width || f) / f,
      rows = (img?.height || f) / f;
    return `<span role="img" aria-label="${key.replace(/Idle|Attack/g,'')}" class="sprite-image ${missing?'placeholder':''} ${extra}" style="--frame-size:${size}px;display:inline-block;flex-shrink:0;width:${size}px;height:${size}px;image-rendering:pixelated;background-image:url('${missing?this.placeholder().toDataURL():Prime.data.assets[key]}');background-repeat:no-repeat;background-size:${cols*size}px ${rows*size}px;background-position:-${(missing?0:column)*size}px -${(missing?0:row)*size}px"></span>`;
  }
};
