'use strict';
Prime.InputManager = class {
  constructor(game) {
    this.keys = new Set();
    this.game = game;
    window.addEventListener('keydown', e => this.down(e));
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }
  down(e) {
    const key = e.key.toLowerCase();
    const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (typing || (document.activeElement?.tagName === 'BUTTON' && key === ' ')) return;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key) && !this.game.ui.isOpen()) e.preventDefault();
    if (e.repeat) return;
    if (key === 'escape') {
      e.preventDefault();
      this.game.ui.back();
      return;
    }
    if (this.game.ui.isOpen()) {
      if (key === ' ' && document.activeElement?.tagName !== 'BUTTON') {
        e.preventDefault();
        this.game.ui.primary();
      }
      return;
    }
    this.keys.add(key);
    if (key === 'e' || key === ' ') {
      e.preventDefault();
      this.game.interact();
    }
    if (key === 'r') this.game.resetPosition();
  }
  axis() {
    return {
      x: Number(this.keys.has('d') || this.keys.has('arrowright')) - Number(this.keys.has('a') || this.keys.has('arrowleft')),
      y: Number(this.keys.has('s') || this.keys.has('arrowdown')) - Number(this.keys.has('w') || this.keys.has('arrowup'))
    };
  }
};
