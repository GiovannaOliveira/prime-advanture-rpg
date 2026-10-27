'use strict';
window.Prime = {
  data: {},
  systems: {},
  ui: {}
};
Prime.data.assets = {
  player: 'assets/characters/player.png',
  professor: 'assets/characters/professor.png',
  merchant: 'assets/characters/merchant.png',
  healer: 'assets/characters/healer.png',
  tiles: 'assets/world/tileset.png',
  tree: 'assets/world/green_tree.png',
  smallTree: 'assets/world/green_tree_small.png',
  bushyTree: 'assets/world/green_tree_bushy.png',
  palm: 'assets/world/palm.png',
  smallPalm: 'assets/world/palm_small.png',
  grass: 'assets/world/grass.png',
  rock: 'assets/world/grassrock1.png',
  sandRock: 'assets/world/sandrock1.png',
  academy: 'assets/world/house_large.png',
  shop: 'assets/world/house_small.png',
  hospital: 'assets/world/hospital.png',
  buddy: 'assets/creatures/buddy.png',
  meadow: 'assets/backgrounds/meadow.png',
  fireEffect: 'assets/effects/fire.png',
  leafEffect: 'assets/effects/leaf.png',
  waterEffect: 'assets/effects/water.png',
  iceEffect: 'assets/effects/ice.png'
};
for (const name of ['leaflet', 'emberbun', 'ripple', 'pebblit', 'skydot', 'frosthart']) {
  Prime.data.assets[name] = `assets/creatures/${name}.png`;
  Prime.data.assets[name + 'Idle'] = `assets/creatures/${name}_idle.png`;
  Prime.data.assets[name + 'Attack'] = `assets/creatures/${name}_attack.png`;
  Prime.data.assets[name + 'Icon'] = `assets/creatures/${name}_icon.png`;
}
// All sprite rectangles are explicit, in source pixels. Rows: down, left, right, up.
Prime.data.sprites = {
  human: {
    frame: 128,
    columns: 4,
    rows: 4
  },
  creature: {
    frame: 96,
    columns: 4,
    rows: 1
  },
  creatureBase: {
    frame: 96,
    columns: 2,
    rows: 1
  },
  effect: {
    frame: 96,
    columns: 4,
    rows: 1
  }
};
