'use strict';
// Coordinates below are in tiles; the renderer and collision map use this same source.
Prime.data.map = {
  tile: 32,
  width: 56,
  height: 46,
  spawn: [27, 23],
  islands: [{
    id: 'meadow',
    name: 'Welcome Meadow',
    x: 18,
    y: 15,
    w: 18,
    h: 14,
    ground: 'grass'
  }, {
    id: 'forest',
    name: 'Whispering Grove',
    x: 3,
    y: 7,
    w: 12,
    h: 13,
    ground: 'grass'
  }, {
    id: 'academy',
    name: 'Prime Academy',
    x: 22,
    y: 2,
    w: 13,
    h: 10,
    ground: 'grass'
  }, {
    id: 'shop',
    name: 'Little Trading Post',
    x: 40,
    y: 11,
    w: 12,
    h: 12,
    ground: 'grass'
  }, {
    id: 'beach',
    name: 'Sunbeam Beach',
    x: 20,
    y: 34,
    w: 17,
    h: 9,
    ground: 'sand'
  }, {
    id: 'dock',
    name: 'Quiet Cove',
    x: 3,
    y: 28,
    w: 11,
    h: 10,
    ground: 'grass'
  }],
  bridges: [{
    x: 14,
    y: 17,
    w: 5,
    h: 2
  }, {
    x: 27,
    y: 11,
    w: 2,
    h: 5
  }, {
    x: 35,
    y: 19,
    w: 6,
    h: 2
  }, {
    x: 27,
    y: 28,
    w: 2,
    h: 7
  }, {
    x: 13,
    y: 28,
    w: 6,
    h: 2
  }],
  paths: [{
    x: 26,
    y: 16,
    w: 3,
    h: 12
  }, {
    x: 19,
    y: 19,
    w: 16,
    h: 2
  }, {
    x: 8,
    y: 16,
    w: 7,
    h: 2
  }, {
    x: 27,
    y: 8,
    w: 2,
    h: 4
  }, {
    x: 41,
    y: 19,
    w: 9,
    h: 2
  }, {
    x: 27,
    y: 35,
    w: 2,
    h: 6
  }, {
    x: 8,
    y: 29,
    w: 6,
    h: 2
  }],
  buildings: [{
    kind: 'academy',
    x: 28,
    y: 6,
    w: 5,
    h: 5,
    label: 'PRIME ACADEMY'
  }, {
    kind: 'shop',
    x: 47,
    y: 15,
    w: 4,
    h: 4,
    label: 'LITTLE SHOP'
  }, {
    kind: 'hospital',
    x: 32,
    y: 18,
    w: 4,
    h: 4,
    label: 'HEALING HOUSE'
  }],
  npcs: [{
    id: 'professor',
    name: 'Professor Willow',
    x: 28,
    y: 9.6,
    action: 'academy'
  }, {
    id: 'merchant',
    name: 'Milo',
    x: 47,
    y: 18,
    action: 'shop'
  }, {
    id: 'healer',
    name: 'Nora',
    x: 32,
    y: 20.8,
    action: 'heal'
  }],
  zones: [{
    id: 'grove',
    x: 6,
    y: 9,
    w: 6,
    h: 5,
    species: ['leaflet', 'pebblit', 'skydot'],
    label: 'WHISPERING GROVE'
  }, {
    id: 'meadow',
    x: 20,
    y: 22,
    w: 4,
    h: 4,
    species: ['leaflet', 'emberbun', 'pebblit'],
    label: 'WILD FRIENDS'
  }, {
    id: 'beach',
    x: 30,
    y: 36,
    w: 4,
    h: 4,
    species: ['ripple', 'skydot', 'frosthart'],
    label: 'SUNBEAM BEACH'
  }],
  signs: [{
    x: 25,
    y: 22,
    title: 'Welcome, explorer!',
    text: 'Walk with WASD or the arrow keys. Press E near a friend, a sign, or a chest. Try the Map button to find your way!'
  }, {
    x: 13,
    y: 17,
    title: 'Whispering Grove',
    text: 'Wild friends live in the tall grass. Choose a starter, then press E near a creature to meet it.'
  }, {
    x: 27,
    y: 33,
    title: 'Sunbeam Beach',
    text: 'Follow the bridge south to the beach. A rare visitor may appear here. Be kind and keep exploring!'
  }, {
    x: 9,
    y: 33,
    title: 'Quiet Cove',
    text: 'Take a little break. The boat is resting here, too. All our adventure islands are connected by bridges.'
  }],
  chest: {
    x: 30,
    y: 25
  },
  props: [
    ['tree', 20, 17],
    ['bushyTree', 22, 17],
    ['tree', 34, 25],
    ['smallTree', 33, 26.7],
    ['tree', 20, 27],
    ['rock', 24, 26],
    ['smallTree', 24, 17],
    ['tree', 34, 22],
    ['tree', 5, 10],
    ['tree', 4.5, 14],
    ['tree', 6, 18.5],
    ['bushyTree', 12.5, 9],
    ['smallTree', 12.8, 14],
    ['rock', 10, 18],
    ['tree', 24, 5],
    ['bushyTree', 32, 4],
    ['smallTree', 24, 9],
    ['rock', 32, 10],
    ['tree', 42, 14],
    ['smallTree', 43, 21],
    ['bushyTree', 50, 19.5],
    ['rock', 50, 13],
    ['palm', 22, 37],
    ['smallPalm', 24, 40],
    ['palm', 35, 37],
    ['sandRock', 33, 41],
    ['sandRock', 22, 41],
    ['tree', 5, 30],
    ['smallTree', 11, 35],
    ['rock', 5, 35]
  ]
};
