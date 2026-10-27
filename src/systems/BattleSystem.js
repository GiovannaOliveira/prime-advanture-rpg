'use strict';
Prime.systems.BattleSystem = class {
  constructor(game) {
    this.game = game;
    this.current = null;
    this.timer = null;
  }
  start(wild) {
    const active = this.game.store.active();
    if (!active) {
      this.game.ui.toast('Choose your first friend before meeting a wild creature!');
      this.game.ui.starters();
      return;
    }
    if (active.hp <= 0) {
      this.game.ui.dialogue('A little rest', 'Your friend needs to rest. Visit Nora at the Healing House, or use a potion from your collection.', [{
        label: 'Open collection',
        action: () => this.game.ui.collection()
      }, {
        label: 'Back to the island',
        action: () => this.game.ui.close()
      }]);
      return;
    }
    this.current = {
      wild,
      friend: active,
      locked: false,
      message: `A wild ${Prime.data.creatures[wild.species].name} says hello!\nWhat will you do?`,
      ended: false
    };
    this.render();
  }
  stats(c, side) {
    const d = Prime.data.creatures[c.species];
    return `<div class="battle-stats ${side}-stats"><strong>${d.name}</strong><small>Lv. ${c.level}</small><div class="hp-track"><i style="width:${c.hp/c.maxHp*100}%"></i></div><div class="hp-text">${c.hp} / ${c.maxHp} HP · ${d.type}</div></div>`;
  }
  render() {
    const b = this.current;
    if (!b) return;
    const {
      wild,
      friend
    } = b, assets = this.game.assets;
    this.game.ui.open(`<div class="battle-scene"><span class="battle-label">A NEW FRIEND, A NEW CHALLENGE</span><button class="close" data-action="cancel" aria-label="Run from battle">×</button>${this.stats(wild,'enemy')}${this.stats(friend,'friend')}${assets.markup(wild.species+'Idle',190,0,0,96,'fighter enemy')}${assets.markup(friend.species,220,1,0,96,'fighter friend')}</div><div class="battle-bottom"><p class="battle-message" role="status">${b.message}</p><div class="battle-actions">${b.ended?'<button class="primary" id="return-map" style="grid-column:1/-1">Back to the island →</button>':`<button data-battle="attack">Attack<small>A friendly little nudge</small></button><button data-battle="special">Special Move<small>Answer an English question</small></button><button data-battle="capture">Capture<small>${this.game.store.state.orbs} orbs left · English challenge</small></button><button data-battle="run">Run<small>Back to exploring</small></button>`}</div></div>`, 'battle', () => this.run(), 'battle-panel');
    document.querySelectorAll('[data-battle]').forEach(el => {
      el.disabled = b.locked;
      el.onclick = () => this.action(el.dataset.battle);
    });
    const back = document.getElementById('return-map');
    if (back) back.onclick = () => this.finish();
  }
  action(action) {
    const b = this.current;
    if (!b || b.locked || b.ended) return;
    if (action === 'run') {
      this.run();
      return;
    }
    if (action === 'capture' && this.game.store.state.orbs <= 0) {
      b.message = 'No orbs left! Visit the Little Shop or open your daily chest.';
      this.render();
      return;
    }
    if (action === 'capture' && this.game.store.state.party.length >= 100) {
      b.message = 'Your collection is full. You can still battle and explore!';
      this.render();
      return;
    }
    if (action === 'special' || action === 'capture') {
      b.locked = true;
      const context = action === 'capture' ? 'Make a new friend!' : 'Power up your special move!';
      this.game.english.open(context, () => {
        if (this.current !== b) return;
        b.locked = false;
        this.resolve(action);
      }, () => {
        if (this.current !== b) return;
        b.locked = false;
        this.render();
      });
      return;
    }
    this.resolve(action);
  }
  damage(attacker, defender, special = false) {
    const a = Prime.data.creatures[attacker.species],
      d = Prime.data.creatures[defender.species];
    const strengths = {
      Fire: 'Grass',
      Grass: 'Water',
      Water: 'Fire',
      Earth: 'Fire',
      Air: 'Grass',
      Ice: 'Air'
    };
    const multiplier = strengths[a.type] === d.type ? 1.2 : 1;
    return Math.max(3, Math.floor((a.attack + attacker.level * 2 - d.defense * .6) * (special ? 1.6 : 1) * multiplier));
  }
  resolve(action) {
    const b = this.current;
    if (!b || b.ended || b.locked) return;
    b.locked = true;
    if (action === 'capture') {
      this.game.store.state.orbs--;
      const rarity = Prime.data.creatures[b.wild.species].rarity;
      const chance = Math.min(.94, Prime.data.rules.captureBase[rarity] + (1 - b.wild.hp / b.wild.maxHp) * .32);
      if (Math.random() < chance) {
        const captured = {
          id: b.wild.id,
          species: b.wild.species,
          level: b.wild.level,
          hp: b.wild.hp,
          maxHp: b.wild.maxHp,
          xp: 0
        };
        this.game.store.state.party.push(captured);
        this.game.store.state.captures++;
        this.game.encounters.remove(b.wild.id);
        this.end(`You made a new friend! ${Prime.data.creatures[captured.species].name} joined your collection.`, 12);
        return;
      }
      b.message = 'The orb wobbled… your new friend is not ready yet. Try lowering its HP!';
    } else {
      const damage = this.damage(b.friend, b.wild, action === 'special');
      b.wild.hp = Math.max(0, b.wild.hp - damage);
      const move = action === 'special' ? Prime.data.creatures[b.friend.species].special : 'a gentle attack';
      b.message = `${Prime.data.creatures[b.friend.species].name} used ${move}! −${damage} HP`;
      if (b.wild.hp <= 0) {
        this.game.store.state.wins++;
        this.game.encounters.remove(b.wild.id);
        this.end('Great teamwork! You won the friendly battle.', 18);
        return;
      }
    }
    this.game.store.save();
    this.render();
    this.animate(action === 'capture' ? 'capture' : 'enemy', action === 'special');
    this.timer = setTimeout(() => {
      if (this.current !== b || b.ended) return;
      const damage = this.damage(b.wild, b.friend);
      b.friend.hp = Math.max(0, b.friend.hp - damage);
      b.locked = false;
      b.message += `\n${Prime.data.creatures[b.wild.species].name} responds! Your friend loses ${damage} HP.`;
      this.game.store.save();
      if (b.friend.hp === 0) {
        this.end('Your friend needs a rest. Nora at the Healing House can help for free!', 0);
        return;
      }
      this.render();
      this.animate('friend', false);
      this.game.ui.updateHUD();
    }, 850);
  }
  animate(side, special) {
    if (side === 'friend' && this.current) {
      const enemy = document.querySelector('.fighter.enemy'),
        key = this.current.wild.species + 'Attack';
      if (enemy && !this.game.assets.missing.includes(key)) {
        const idle = enemy.style.backgroundImage;
        enemy.style.backgroundImage = `url('${Prime.data.assets[key]}')`;
        setTimeout(() => {
          if (enemy.isConnected) enemy.style.backgroundImage = idle;
        }, 650);
      }
    }
    const el = document.querySelector(side === 'friend' ? '.fighter.friend' : '.fighter.enemy');
    if (el) {
      el.classList.add('hit');
      setTimeout(() => el.classList.remove('hit'), 350);
    }
    if (special) {
      const scene = document.querySelector('.battle-scene');
      if (!scene) return;
      const key = Prime.data.creatures[this.current.friend.species].effect;
      const wrap = document.createElement('div');
      wrap.innerHTML = this.game.assets.markup(key, 150, 0, 0, 96, 'battle-effect');
      const fx = wrap.firstElementChild;
      scene.append(fx);
      let frame = 0;
      const timer = setInterval(() => {
        frame++;
        if (frame > 3 || !fx.isConnected) {
          clearInterval(timer);
          fx.remove();
          return;
        }
        fx.style.backgroundPosition = `-${frame*150}px 0px`;
      }, 120);
    }
  }
  end(message, xp) {
    const b = this.current;
    b.ended = true;
    b.locked = false;
    let extra = '';
    if (xp) {
      this.game.store.state.coins += 10;
      const levels = this.game.store.addXp(b.friend, xp);
      extra = ` +${xp} XP · +10 coins${levels?' · Level up!':''}`;
    }
    b.message = message + extra;
    this.game.store.save();
    this.game.ui.updateHUD();
    this.render();
  }
  run() {
    const b = this.current;
    if (!b) return;
    if (b.locked) {
      this.game.ui.toast('One moment! Your friends are taking their turn.');
      return;
    }
    if (!b.ended) {
      this.game.encounters.remove(b.wild.id);
      this.game.ui.toast('You waved goodbye. There are more friends to meet!');
    }
    this.finish();
  }
  finish() {
    clearTimeout(this.timer);
    this.current = null;
    this.game.ui.close(true);
    this.game.ui.updateHUD();
    this.game.savePosition();
  }
};
