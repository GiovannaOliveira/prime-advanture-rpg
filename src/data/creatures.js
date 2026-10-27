'use strict';
Prime.data.creatures = {
  leaflet: {
    name: 'Leaflet',
    type: 'Grass',
    rarity: 'Common',
    hp: 38,
    attack: 10,
    defense: 5,
    special: 'Leaf Twirl',
    effect: 'leafEffect',
    description: 'A little forest friend with a very big heart.',
    starter: true
  },
  emberbun: {
    name: 'Emberbun',
    type: 'Fire',
    rarity: 'Common',
    hp: 35,
    attack: 12,
    defense: 4,
    special: 'Warm Spark',
    effect: 'fireEffect',
    description: 'A sunny little hopper. Always ready to explore.',
    starter: true
  },
  ripple: {
    name: 'Ripple',
    type: 'Water',
    rarity: 'Common',
    hp: 40,
    attack: 9,
    defense: 6,
    special: 'Bubble Pop',
    effect: 'waterEffect',
    description: 'A playful swimmer who loves making new friends.',
    starter: true
  },
  pebblit: {
    name: 'Pebblit',
    type: 'Earth',
    rarity: 'Uncommon',
    hp: 42,
    attack: 9,
    defense: 7,
    special: 'Pebble Toss',
    effect: 'leafEffect',
    description: 'Small paws, soft fur, and a brave little spirit.'
  },
  skydot: {
    name: 'Skydot',
    type: 'Air',
    rarity: 'Rare',
    hp: 33,
    attack: 11,
    defense: 4,
    special: 'Feather Gust',
    effect: 'leafEffect',
    description: 'A cheerful bird who sings to the ocean breeze.'
  },
  frosthart: {
    name: 'Frosthart',
    type: 'Ice',
    rarity: 'Legendary',
    hp: 46,
    attack: 12,
    defense: 7,
    special: 'Crystal Glow',
    effect: 'iceEffect',
    description: 'A gentle, magical visitor from a faraway snowy island.'
  }
};
Prime.data.rules = {
  maxWild: 8,
  spawnSeconds: [3, 6],
  captureBase: {
    Common: .72,
    Uncommon: .56,
    Rare: .4,
    Legendary: .22
  },
  rarityWeights: {
    Common: 72,
    Uncommon: 21,
    Rare: 6,
    Legendary: 1
  },
  dayMs: 86400000,
  saveKey: 'prime-adveture-save-v1'
};
Prime.data.makeCreature = function(species, level = 1) {
  const d = Prime.data.creatures[species];
  const maxHp = d.hp + (level - 1) * 5;
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2),
    species,
    level,
    hp: maxHp,
    maxHp,
    xp: 0
  };
};
