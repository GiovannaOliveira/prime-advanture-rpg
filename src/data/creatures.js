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
// Additional species reuse distinct, fully animated sheets from the supplied pack.
Object.assign(Prime.data.creatures, {
  "thornpounce": {
    "name": "Thornpounce",
    "type": "Grass",
    "rarity": "Uncommon",
    "hp": 43,
    "attack": 11,
    "defense": 6,
    "special": "Vine Pounce",
    "effect": "leafEffect",
    "description": "A quick forest cat that leaves tiny pawprints in the moss."
  },
  "groveguard": {
    "name": "Groveguard",
    "type": "Grass",
    "rarity": "Rare",
    "hp": 52,
    "attack": 12,
    "defense": 8,
    "special": "Canopy Roar",
    "effect": "leafEffect",
    "description": "A leafy guardian that shelters small creatures under its mane."
  },
  "cinderstride": {
    "name": "Cinderstride",
    "type": "Fire",
    "rarity": "Uncommon",
    "hp": 44,
    "attack": 13,
    "defense": 5,
    "special": "Ember Dash",
    "effect": "fireEffect",
    "description": "A sturdy fire runner that warms the rocky mountain paths."
  },
  "ashwarden": {
    "name": "Ashwarden",
    "type": "Fire",
    "rarity": "Legendary",
    "hp": 58,
    "attack": 14,
    "defense": 9,
    "special": "Cinder Crown",
    "effect": "fireEffect",
    "description": "An ancient guardian that watches over the glowing highlands."
  },
  "dreamtap": {
    "name": "Dreamtap",
    "type": "Magic",
    "rarity": "Uncommon",
    "hp": 45,
    "attack": 10,
    "defense": 7,
    "special": "Dream Ripple",
    "effect": "magicEffect",
    "description": "A star-speckled dreamer that listens to the quiet of the ruins."
  },
  "gloomcoil": {
    "name": "Gloomcoil",
    "type": "Shadow",
    "rarity": "Rare",
    "hp": 42,
    "attack": 13,
    "defense": 6,
    "special": "Twilight Twist",
    "effect": "shadowEffect",
    "description": "A gentle cave serpent whose golden markings guide lost explorers."
  },
  "tideglide": {
    "name": "Tideglide",
    "type": "Water",
    "rarity": "Uncommon",
    "hp": 44,
    "attack": 12,
    "defense": 6,
    "special": "Tidal Sweep",
    "effect": "waterEffect",
    "description": "A graceful swimmer that follows the coastline with its bright fins."
  },
  "abyssong": {
    "name": "Abyssong",
    "type": "Water",
    "rarity": "Legendary",
    "hp": 56,
    "attack": 13,
    "defense": 8,
    "special": "Ocean Chorus",
    "effect": "waterEffect",
    "description": "A rare sea guardian whose song echoes through crystal pools."
  },
  "budbit": {
    "name": "Budbit",
    "type": "Grass",
    "rarity": "Common",
    "hp": 32,
    "attack": 8,
    "defense": 4,
    "special": "Seed Skip",
    "effect": "leafEffect",
    "description": "A round little sprout that bounces between sunlit flowers."
  },
  "lumenwing": {
    "name": "Lumenwing",
    "type": "Magic",
    "rarity": "Rare",
    "hp": 40,
    "attack": 12,
    "defense": 5,
    "special": "Petal Gleam",
    "effect": "magicEffect",
    "description": "A luminous winged creature that drifts between ancient pillars."
  }
});

Prime.data.rules = {
  maxCollection: 300,
  maxWild: 8,
  maxWildPerRegion: 4,
  encounterRadius: 1050,
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
