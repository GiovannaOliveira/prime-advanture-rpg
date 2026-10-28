'use strict';
Prime.ui.UI = class {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('modal-root');
    this.kind = null;
    this.onBack = null;
    this.returnFocus = null;
    this.toastTimer = null;
    document.getElementById('collection-btn').onclick = () => this.collection();
    document.getElementById('learn-btn').onclick = () => this.englishClub();
    document.getElementById('settings-btn').onclick = () => this.settings();
    document.getElementById('map-btn').onclick = () => this.map();
    document.getElementById('quest-action').onclick = () => this.questAction();
    // Keep focus and keyboard interaction within the current dialog.
    this.root.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const els = [...this.root.querySelectorAll('button:not(:disabled):not([hidden]),select')];
      if (!els.length) return;
      const first = els[0],
        last = els.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
  isOpen() {
    return !this.root.hidden;
  }
  open(content, kind = 'dialogue', onBack = null, extra = '') {
    if (!this.isOpen()) this.returnFocus = document.activeElement;
    document.querySelector('.topbar').inert = true;
    document.querySelector('.controlbar').inert = true;
    this.root.hidden = false;
    this.kind = kind;
    this.onBack = onBack;
    this.game.input?.keys.clear();
    document.getElementById('interact-prompt').hidden = true;
    this.root.innerHTML = `<section role="dialog" aria-modal="true" aria-label="${{battle:'Creature battle',challenge:'English challenge',starters:'Choose your first friend',collection:'Your collection',map:'Island map',settings:'Settings',club:'English club'}[kind]||'Adventure dialogue'}" class="panel ${extra}">${content}</section>`;
    this.root.querySelector('[data-action="cancel"]')?.addEventListener('click', () => this.back());
    this.root.querySelector('button:not(:disabled),select')?.focus({
      preventScroll: true
    });
  }
  close(silent = false) {
    if (!silent && this.onBack) {
      this.back();
      return;
    }
    this.root.hidden = true;
    document.querySelector('.topbar').inert = false;
    document.querySelector('.controlbar').inert = false;
    this.root.innerHTML = '';
    this.kind = null;
    this.onBack = null;
    this.game.input?.keys.clear();
    const target = this.returnFocus?.isConnected ? this.returnFocus : this.game.canvas;
    target?.focus({
      preventScroll: true
    });
  }
  back() {
    if (!this.isOpen()) return;
    if (this.onBack) this.onBack();
    else this.close(true);
  }
  primary() {
    const b = this.root.querySelector('.primary:not([hidden]):not(:disabled),[data-battle="attack"]:not(:disabled)');
    b?.click();
  }
  toast(text) {
    clearTimeout(this.toastTimer);
    const el = document.getElementById('toast');
    el.textContent = text;
    el.hidden = false;
    this.toastTimer = setTimeout(() => el.hidden = true, 4200);
  }
  header(eyebrow, title) {
    return `<div class="panel-header"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1></div><button class="close" data-action="cancel" aria-label="Close">×</button></div>`;
  }
  tag(d) {
    return (d.types || [d.type]).map(type => `<span class="type-tag type-${type.toLowerCase()}">${type}</span>`).join(' ');
  }
  creatureArt(species, size = 96, extra = '') {
    return this.game.assets.creatureMarkup(species, size, 'front', extra);
  }
  updateHUD() {
    const s = this.game.store.state,
      active = this.game.store.active(),
      unique = new Set(s.party.map(c => c.species));
    document.getElementById('coins').textContent = s.coins;
    document.getElementById('orbs').textContent = s.orbs;
    document.getElementById('collection-count').textContent = `${unique.size}/${Object.keys(Prime.data.creatures).length}`;
    if (active) {
      const d = Prime.data.creatures[active.species];
      document.getElementById('active-name').textContent = d.name;
      document.getElementById('active-details').textContent = `${d.type} · ${active.hp} / ${active.maxHp} HP`;
      document.getElementById('active-level').textContent = `Lv. ${active.level}`;
      document.getElementById('active-hp').style.width = active.hp / active.maxHp * 100 + '%';
      document.getElementById('companion-art').innerHTML = this.game.assets.iconMarkup(active.species, 46);
    }
    const stage = !s.party.length ? 0 : !s.captures && !s.wins ? 1 : 2;
    const titles = ['Every adventure starts with a friend.', 'Your next friend is out there.', 'Little steps. Big discoveries.'],
      texts = ['Meet Professor Willow at the Academy, or choose your first creature right here.', 'Find the tall grass to your left. Press E near a wild creature to say hello!', `Discover ${s.exploration.visited.length} / ${Prime.data.map.islands.length} regions. Read field notes and solve questions to open new trails.`],
      actions = ['Choose your first friend', 'Find the wild friends', 'Open your explorer map'];
    document.getElementById('quest-title').textContent = titles[stage];
    document.getElementById('quest-text').textContent = texts[stage];
    document.getElementById('quest-action').innerHTML = actions[stage] + ' <span>→</span>';
    document.getElementById('quest-step').textContent = `0${stage+1} / 03`;
    document.getElementById('quest-fill').style.width = (stage + 1) / 3 * 100 + '%';
  }
  questAction() {
    const s = this.game.store.state;
    if (!s.party.length) this.starters();
    else if (!s.captures && !s.wins) {
      this.toast('Wild friends live in the tall grass, just left of the Welcome Meadow path.');
      this.close(true);
    } else this.map();
  }
  starters() {
    if (this.game.store.state.party.length) {
      this.toast('Your first friend is already waiting in your collection.');
      return;
    }
    this.open(this.header('A NEW CHAPTER BEGINS', 'Who will be your first friend?') + '<p>Every friend is a great choice. Pick the one that makes you smile!</p><div class="starter-grid">' + Object.entries(Prime.data.creatures).filter(([, d]) => d.starter).map(([id, d]) => `<article class="creature-card">${this.creatureArt(id,106)}<h2>${d.name}</h2>${this.tag(d)}<p>${d.description}</p><button class="primary" data-starter="${id}">Choose ${d.name}</button></article>`).join('') + '</div><p class="hint">You can meet the other creatures on your adventure. There is no wrong choice.</p>', 'starters');
    document.querySelectorAll('[data-starter]').forEach(b => b.onclick = () => {
      const id = b.dataset.starter;
      if (!this.game.store.addStarter(id)) return;
      this.close(true);
      this.updateHUD();
      this.toast(`${Prime.data.creatures[id].name} is your new friend! Explore the tall grass to the left.`);
    });
  }
  dialogue(name, text, actions = []) {
    this.open(`<div class="dialogue-name">${name}</div><p class="dialogue-text">${text}</p><div class="button-row">${actions.map((a,i)=>`<button class="${i===0?'primary':'secondary'}" data-dialogue="${i}">${a.label}</button>`).join('')}${!actions.length?'<button class="primary" data-action="cancel">Back to exploring →</button>':''}</div>`);
    document.querySelectorAll('[data-dialogue]').forEach(b => b.onclick = actions[Number(b.dataset.dialogue)].action);
  }
  collection(filters = this.collectionFilters || {
    type: 'All',
    rarity: 'All',
    region: 'All'
  }) {
    this.collectionFilters = filters;
    const s = this.game.store.state,
      entries = Object.entries(Prime.data.creatures),
      all = Prime.data.map.islands;
    const types = [...new Set(entries.flatMap(([, d]) => d.types || [d.type]))].sort();
    const options = (items, value) => ['All', ...items].map(t => `<option value="${t}" ${t===value?'selected':''}>${t}</option>`).join('');
    const visible = entries.filter(([id, d]) => {
      if (filters.type === 'All' && filters.rarity === 'All' && filters.region === 'All') return true;
      if (!s.party.some(c => c.species === id)) return false;
      return (filters.type === 'All' || (d.types || [d.type]).includes(filters.type)) && (filters.rarity === 'All' || d.rarity === filters.rarity) && (filters.region === 'All' || d.regions.includes(filters.region));
    });
    this.open(this.header('YOUR ADVENTURE JOURNAL', 'Friends make the journey.') + `<p>${new Set(s.party.map(c=>c.species)).size} of ${entries.length} species found · ${s.captures} captures · ${s.wins} friendly battles won</p>
      <div class="collection-filters"><label>Type<select id="filter-type">${options(types,filters.type)}</select></label><label>Rarity<select id="filter-rarity">${options(['Common','Uncommon','Rare','Legendary'],filters.rarity)}</select></label><label>Habitat<select id="filter-region"><option value="All">All</option>${all.map(r=>`<option value="${r.id}" ${r.id===filters.region?'selected':''}>${r.name}</option>`).join('')}</select></label></div>
      <div class="roster" aria-label="Choose any captured friend">${s.party.map(c=>`<button class="roster-friend" data-active="${c.id}" ${c.id===s.activeId?'disabled':''}>${this.game.assets.iconMarkup(c.species,30)}<span><b>${Prime.data.creatures[c.species].name}</b><small>Lv. ${c.level} · ${c.hp}/${c.maxHp} HP${c.id===s.activeId?' · Active':''}</small></span></button>`).join('')}</div>
      <div class="collection-grid">` + visible.map(([id, d]) => {
      const copies = s.party.filter(c => c.species === id),
        c = copies.find(c => c.id === s.activeId) || copies[0];
      return `<article class="creature-card ${c?'':'unknown'}">${c?this.creatureArt(id,78):this.creatureArt(id,78).replace(/aria-label="[^"]*"/,'aria-label="Undiscovered creature"')}<h2>${c?d.name:'???'}</h2>${c?`<div>${this.tag(d)}</div><span class="rarity-label">${d.rarity}${d.nationalDex?' · #'+d.nationalDex:''}</span><p>${d.description}</p><small>Lv. ${c.level} · ${c.hp}/${c.maxHp} HP · ATK ${d.attack+c.level*2} · DEF ${d.defense}</small><small>${c.xp}/${c.level*25} XP · ${copies.length} in collection</small><p class="habitat">${d.regions.map(id=>all.find(r=>r.id===id)?.name).join(' / ')}</p><small>Moves: Attack · ${d.special}</small><button class="${c.id===s.activeId?'secondary':'primary'}" data-active="${c.id}" ${c.id===s.activeId?'disabled':''}>${c.id===s.activeId?'Your active friend':'Explore together'}</button>`:'<p>A friend waiting to be discovered.</p><small>Explore new regions to meet it.</small>'}</article>`;
    }).join('') + `</div>${!visible.length?'<p>No discovered friends match these filters yet.</p>':''}<div class="button-row"><button class="secondary" id="potion-btn" ${!s.potions||!this.game.store.active()?'disabled':''}>Use a potion (${s.potions}) · Heal active friend</button><button class="secondary" id="close-collection">Back to the island</button></div><p class="hint">Filters show discovered species only. Nora heals every friend for free. All captured instances remain in your roster.</p>`, 'collection');
    for (const key of ['type', 'rarity', 'region']) document.getElementById('filter-' + key).onchange = e => this.collection({
      ...filters,
      [key]: e.target.value
    });
    document.querySelectorAll('[data-active]').forEach(b => b.onclick = () => {
      s.activeId = b.dataset.active;
      this.game.store.save();
      this.updateHUD();
      this.collection();
    });
    document.getElementById('close-collection').onclick = () => this.close(true);
    document.getElementById('potion-btn').onclick = () => {
      const c = this.game.store.active();
      if (!c || !s.potions) return;
      if (c.hp === c.maxHp) {
        this.toast('Your friend is already feeling great!');
        return;
      }
      s.potions--;
      c.hp = c.maxHp;
      this.game.store.save();
      this.updateHUD();
      this.collection();
      this.toast('All better! Your active friend has full HP.');
    };
  }
  englishClub() {
    const s = this.game.store.state;
    this.open(this.header('LEARN A LITTLE, EXPLORE A LOT', 'Welcome to the English club!') + '<div class="english-icon">Aa ✧</div><p>Words are little keys. They help you use special moves, make new friends, and open your daily gift.</p>' + `<div class="stats-grid"><div><b>${s.answers}</b><small>QUESTIONS SOLVED</small></div><div><b>${s.playerXp}</b><small>ADVENTURE XP</small></div><div><b>${s.streak}</b><small>DAILY CHEST STREAK</small></div></div><div class="settings-row"><label for="difficulty">Your English level<small>You can change this whenever you like.</small></label><select id="difficulty">${['Beginner','Elementary','Intermediate'].map(l=>`<option ${s.difficulty===l?'selected':''}>${l}</option>`).join('')}</select></div><p class="progress-note" id="question-journey" role="status"></p><div class="button-row"><button class="primary" id="practice-btn">Try a little question →</button><button class="secondary" id="guide-btn">How to play</button></div>`, 'club');
    const updateJourney = () => {
      const stats = this.game.english.scheduler.stats(s.difficulty);
      document.getElementById('question-journey').textContent = `${s.difficulty}: ${stats.seen} of ${stats.total} questions explored · ${stats.answered} answered · ${stats.firstTry} solved on the first try.`;
    };
    updateJourney();
    document.getElementById('difficulty').onchange = e => {
      s.difficulty = e.target.value;
      this.game.store.save();
      updateJourney();
    };
    document.getElementById('practice-btn').onclick = () => this.game.english.open('Let’s learn something new!', () => this.englishClub(), () => this.englishClub());
    document.getElementById('guide-btn').onclick = () => this.guide();
  }
  guide() {
    this.open(this.header('YOUR POCKET GUIDE', 'Ready, little explorer?') + '<p><b>1. Meet your first friend.</b> Choose a creature at the Academy or use the card on the island.</p><p><b>2. Explore.</b> Walk with WASD or the arrow keys. Press E near a sign, a person, a chest, or a wild creature.</p><p><b>3. Make friends.</b> Use Attack to lower a wild creature’s HP. Answer a question for a Special Move or Capture. Capture uses one orb and may take a few tries.</p><p><b>4. Take care.</b> Use potions in your collection or visit Nora for free healing. Buy orbs and potions at the Little Shop.</p><p><b>5. Learn and grow.</b> Questions give XP. Friendly battles help your creature level up. The daily chest has a gift every 24 hours!</p><p class="progress-note">No rush, no wrong friends, and no problem if you make a mistake. You can always try again.</p><button class="primary" id="guide-done">Let’s explore →</button>');
    document.getElementById('guide-done').onclick = () => this.close(true);
  }
  shop() {
    const s = this.game.store.state;
    this.open(this.header('MILO’S LITTLE SHOP', 'A little something for the journey.') + `<p>Welcome, friend! You have <b>${s.coins} coins</b>.</p><div class="shop-item"><i class="orb"></i><div><strong>Capture orbs × 3</strong><p>For meeting your next wild friend. You have ${s.orbs}.</p></div><button class="primary" data-buy="orbs" ${s.coins<15?'disabled':''}>15 coins</button></div><div class="shop-item"><span aria-hidden="true">✚</span><div><strong>Healing potion × 1</strong><p>Restores all HP to your active friend. You have ${s.potions}.</p></div><button class="primary" data-buy="potions" ${s.coins<10?'disabled':''}>10 coins</button></div><p class="hint">Win friendly battles and visit the daily chest to earn more coins.</p>`);
    document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
      const orb = b.dataset.buy === 'orbs',
        cost = orb ? 15 : 10;
      if (s.coins < cost) return;
      s.coins -= cost;
      s[orb ? 'orbs' : 'potions'] += orb ? 3 : 1;
      this.game.store.save();
      this.updateHUD();
      this.shop();
      this.toast(orb ? 'Three capture orbs added. Happy exploring!' : 'One potion added to your collection.');
    });
  }
  daily() {
    const remaining = this.game.store.dailyRemaining();
    if (remaining > 0) {
      const h = Math.floor(remaining / 3600000),
        m = Math.ceil((remaining % 3600000) / 60000);
      this.dialogue('Your daily little gift', `You already opened today’s chest. Come back in about ${h}h ${m}m! Your streak is ${this.game.store.state.streak}.`);
      return;
    }
    this.game.english.open('Unlock your daily little gift!', () => {
      const r = this.game.store.claim();
      if (!r) {
        this.toast('This gift has already been collected. Come back later!');
        return;
      }
      this.updateHUD();
      this.open(`<div class="reward-art">✧</div><div class="eyebrow">A LITTLE GIFT, JUST FOR YOU</div><h1>${r.bonus?'A special streak surprise!':'You did something lovely today.'}</h1><p>You explored. You learned. You grew.</p><p class="progress-note">${r.reward}</p><p>Day ${r.streak} of your adventure streak ✦</p><p class="hint">Another gift will be ready in 24 hours. Streak bonuses arrive on days 3, 7, and 14.</p><div class="button-row"><button class="primary" data-action="cancel">Thank you! Back to exploring →</button></div>`, 'reward', null, 'reward-panel');
    }, () => this.close(true));
  }
  settings() {
    this.open(this.header('MAKE YOURSELF AT HOME', 'Your little corner of the world.') + '<p>Your progress is saved on this browser. No account needed.</p><div class="settings-row"><div>Back on solid ground<small>Return to the meadow if you lose your way. Keyboard shortcut: R.</small></div><button class="secondary" id="reset-position">Return to meadow</button></div><div class="settings-row"><div>A fresh adventure<small>Delete this browser’s progress and start again.</small></div><button class="danger" id="reset-save">Reset progress</button></div><p class="hint">Desktop prototype · Keyboard and mouse · No online services or audio required.</p>', 'settings');
    document.getElementById('reset-position').onclick = () => {
      this.game.resetPosition();
      this.close(true);
    };
    document.getElementById('reset-save').onclick = () => this.dialogue('Start a fresh adventure?', 'This will remove your creatures, coins, answers, and daily chest history from this browser. Are you sure?', [{
      label: 'Keep my adventure',
      action: () => this.settings()
    }, {
      label: 'Yes, start again',
      action: () => this.game.resetProgress()
    }]);
  }
  map() {
    const world = this.game.world,
      store = this.game.store,
      s = store.state;
    this.open(this.header('YOUR EXPLORER MAP', 'Ten regions. A bigger adventure.') + `<canvas id="island-map" class="map-canvas" width="1000" height="560" aria-label="World map showing your position and explorer gates"></canvas><div class="region-list">${world.data.islands.map((r,index)=>{
      const visited=s.exploration.visited.includes(r.id),open=world.isOpen(r.id);
      return `<article class="region-entry ${open?'':'locked'}"><span class="region-number" style="background:${r.color}">${index+1}</span><div><strong>${r.name}</strong><small>${r.biome} · ${r.levels[0]}–${r.levels[1]} Lv. · ${visited?'Discovered':open?'Follow the bridges':'Explorer gate'}</small>${!open?`<p>${store.unlockStatus(r.id).hint}</p>`:''}</div><button class="secondary" data-travel="${r.id}" ${!visited||!open?'disabled':''}>Travel</button></article>`;
    }).join('')}</div><p class="hint">The green dot is you. Travel is free after you visit a region. Golden gates open through progress and a short English challenge. Discovery posts teach words and offer a one-time reward.</p>`, 'map');
    const canvas = document.getElementById('island-map'),
      c = canvas.getContext('2d'),
      scale = Math.min(canvas.width / world.width, canvas.height / world.height);
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#62b8ca';
    c.fillRect(0, 0, canvas.width, canvas.height);
    c.translate((canvas.width - world.width * scale) / 2, (canvas.height - world.height * scale) / 2);
    c.scale(scale, scale);
    c.drawImage(world.layer, 0, 0);
    for (const p of world.props) world.drawProp(c, p);
    for (const b of world.data.buildings) world.drawBuilding(c, b);
    world.data.islands.forEach((r, index) => {
      if (!world.isOpen(r.id)) {
        world.traceRegion(c, r);
        c.fillStyle = '#31404f66';
        c.fill();
      }
      const x = (r.x + r.w / 2) * 32,
        y = (r.y + r.h / 2) * 32;
      c.fillStyle = '#fff7df';
      c.beginPath();
      c.arc(x, y, 23, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#3b5945';
      c.textAlign = 'center';
      c.font = 'bold 28px Trebuchet MS';
      c.fillText(String(index + 1), x, y + 10);
    });
    for (const gate of world.data.gates) world.drawGate(c, gate, 0);
    c.fillStyle = '#305945';
    c.strokeStyle = '#fff9e4';
    c.lineWidth = 6;
    c.beginPath();
    c.arc(this.game.player.x, this.game.player.y, 19, 0, Math.PI * 2);
    c.fill();
    c.stroke();
    document.querySelectorAll('[data-travel]').forEach(b => b.onclick = () => {
      if (!this.game.travelTo(b.dataset.travel)) this.toast('Visit this region on foot before traveling there.');
    });
  }
};
