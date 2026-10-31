'use strict';
// Additive world data: the original six region IDs, spawn, and coordinates stay intact.
(() => {
  const world = Prime.data.map;
  Object.assign(world, {
    width: 118,
    height: 66
  });
  world.islands.push({
    id: 'ember',
    name: 'Ember Highlands',
    x: 58,
    y: 4,
    w: 24,
    h: 23,
    ground: 'ember',
    shape: [
      [58, 11],
      [61, 6],
      [70, 4],
      [78, 7],
      [82, 13],
      [80, 22],
      [75, 27],
      [62, 25],
      [58, 20]
    ]
  }, {
    id: 'caverns',
    name: 'Crystal Caverns',
    x: 43,
    y: 32,
    w: 36,
    h: 27,
    ground: 'stone',
    shape: [
      [46, 32],
      [64, 32],
      [77, 36],
      [79, 45],
      [74, 57],
      [51, 59],
      [43, 52],
      [43, 37]
    ]
  }, {
    id: 'frost',
    name: 'Frostpeak Island',
    x: 90,
    y: 4,
    w: 24,
    h: 23,
    ground: 'snow',
    shape: [
      [91, 8],
      [97, 4],
      [105, 4],
      [113, 10],
      [112, 23],
      [106, 27],
      [94, 26],
      [90, 20]
    ]
  }, {
    id: 'ruins',
    name: 'Mystic Ruins',
    x: 87,
    y: 35,
    w: 28,
    h: 27,
    ground: 'mystic',
    shape: [
      [91, 35],
      [108, 35],
      [115, 42],
      [113, 55],
      [104, 62],
      [92, 60],
      [87, 49]
    ]
  });
  const details = {
    meadow: {
      biome: 'Village',
      levels: [1, 3],
      arrival: [27, 23],
      color: '#8fa64f',
      note: [30, 27],
      word: 'meadow',
      lesson: 'A meadow is an open field of grass and flowers. Follow the paths and leave the flowers growing.'
    },
    forest: {
      biome: 'Forest',
      levels: [1, 4],
      arrival: [12, 17.5],
      color: '#628a51',
      note: [5.5, 15],
      word: 'stream',
      lesson: 'A stream is a small river. Listen to the water, then use the wooden bridge to cross safely.'
    },
    academy: {
      biome: 'Gardens',
      levels: [1, 3],
      arrival: [28, 10.8],
      color: '#93ad63',
      note: [32, 9],
      word: 'courtyard',
      lesson: 'A courtyard is an open space beside or between buildings. The Academy garden is a peaceful place to learn.'
    },
    shop: {
      biome: 'Village',
      levels: [1, 3],
      arrival: [44, 20],
      color: '#b4ab62',
      note: [44, 17],
      word: 'supplies',
      lesson: 'Supplies are things you need for a journey. Pack water, capture orbs, and a healing potion.'
    },
    beach: {
      biome: 'Coast',
      levels: [1, 4],
      arrival: [28, 36],
      color: '#e4bf75',
      note: [26, 39.5],
      word: 'tide',
      lesson: 'The tide is the rise and fall of the sea. Watch the water and keep the coast clean for its creatures.'
    },
    dock: {
      biome: 'Cove',
      levels: [1, 3],
      arrival: [10, 30],
      color: '#7b9e75',
      note: [9, 35.5],
      word: 'harbor',
      lesson: 'A harbor is a sheltered place for boats. Visit a region on foot first, then use the map to travel back to it.'
    },
    ember: {
      biome: 'Highlands',
      levels: [3, 5],
      arrival: [60, 20],
      color: '#b67c53',
      note: [75, 23],
      word: 'ember',
      lesson: 'An ember is a small piece of wood or coal that still glows after a fire. Look at the warm rocks from a safe path.',
      requirement: {
        adventure: 1
      },
      background: 'coast'
    },
    caverns: {
      biome: 'Caverns',
      levels: [2, 4],
      arrival: [47, 39],
      color: '#8b86a4',
      note: [68, 52],
      word: 'crystal',
      lesson: 'A crystal is a solid with a regular shape. These cave crystals sparkle beside the underground pools.',
      background: 'snow'
    },
    frost: {
      biome: 'Snow',
      levels: [4, 6],
      arrival: [93, 18],
      color: '#a6d7e3',
      note: [108, 20],
      word: 'glacier',
      lesson: 'A glacier is a very large mass of ice that moves slowly. Stay on the marked paths and keep your creature warm.',
      requirement: {
        answers: 8
      },
      background: 'snow'
    },
    ruins: {
      biome: 'Sanctuary',
      levels: [5, 8],
      arrival: [91, 46],
      color: '#9091a8',
      note: [107, 51],
      word: 'ruins',
      lesson: 'Ruins are the remains of old buildings. Explore gently, leave the stones where they are, and listen for the forest guardians.',
      requirement: {
        visited: 8,
        captures: 3
      }
    }
  };
  for (const region of world.islands) Object.assign(region, details[region.id]);
  world.bridges.push({
    x: 51,
    y: 19,
    w: 8,
    h: 2
  }, {
    x: 80,
    y: 17,
    w: 12,
    h: 2
  }, {
    x: 36,
    y: 38,
    w: 9,
    h: 2
  }, {
    x: 48,
    y: 22,
    w: 2,
    h: 12
  }, {
    x: 76,
    y: 45,
    w: 15,
    h: 2
  }, {
    x: 101,
    y: 26,
    w: 2,
    h: 10
  }, {
    x: 7.3,
    y: 16.3,
    w: 4.4,
    h: 1.8
  }, {
    x: 97,
    y: 44,
    w: 6,
    h: 2
  }, {
    x: 97,
    y: 53,
    w: 7,
    h: 2
  });
  world.gates = [{
    id: 'ember-path',
    region: 'ember',
    x: 55,
    y: 20,
    vertical: true
  }, {
    id: 'frost-path',
    region: 'frost',
    x: 86,
    y: 18,
    vertical: true
  }, {
    id: 'ruins-west',
    region: 'ruins',
    x: 83,
    y: 46,
    vertical: true
  }, {
    id: 'ruins-north',
    region: 'ruins',
    x: 102,
    y: 30,
    vertical: false
  }, {
    id: 'frost-south',
    region: 'frost',
    x: 102,
    y: 28.5,
    vertical: false
  }];
  world.water = [{
    points: [
      [8.5, 7.3],
      [9.8, 10.5],
      [8.3, 13.5],
      [9.5, 17]
    ],
    width: 1.3
  }, {
    x: 9.5,
    y: 17,
    radius: 1.65
  }, {
    x: 30.8,
    y: 22.5,
    radius: .85
  }, {
    x: 71.5,
    y: 12.5,
    radius: 2.2,
    lava: true
  }, {
    x: 64.5,
    y: 9.5,
    radius: .9,
    lava: true
  }, {
    x: 65,
    y: 48,
    radius: 2.3
  }, {
    x: 101,
    y: 13,
    radius: 1.65,
    ice: true
  }, {
    points: [
      [97.5, 35.7],
      [98, 40],
      [101, 44.5],
      [99, 49],
      [101, 56],
      [103, 60]
    ],
    width: 1.25
  }, {
    x: 94,
    y: 55,
    radius: 1.3
  }];
  world.fences = [{
    x: 19.5,
    y: 16,
    w: 4
  }, {
    x: 30,
    y: 27.8,
    w: 3
  }, {
    x: 41,
    y: 12,
    w: 3
  }, {
    x: 46,
    y: 21.6,
    w: 4
  }];
  world.walls = [{
    x: 53,
    y: 34,
    w: 12,
    h: 1.5,
    color: '#625e7a'
  }, {
    x: 58,
    y: 39,
    w: 1.3,
    h: 7,
    color: '#625e7a'
  }, {
    x: 48,
    y: 47,
    w: 7,
    h: 1.3,
    color: '#625e7a'
  }, {
    x: 68,
    y: 37.5,
    w: 7,
    h: 1.2,
    color: '#625e7a'
  }, {
    x: 66,
    y: 20,
    w: 1.2,
    h: 4,
    color: '#8f644d'
  }, {
    x: 101,
    y: 19,
    w: 5,
    h: 1.1,
    color: '#9ab8cd'
  }];
  world.trails = [{
    points: [
      [12, 17.5],
      [12.5, 14.8],
      [11.5, 12],
      [12, 9]
    ],
    width: 1.5
  }, {
    points: [
      [9, 17],
      [6, 17],
      [5.5, 15],
      [6, 12]
    ],
    width: 1.4
  }, {
    points: [
      [59, 20],
      [63, 19],
      [64, 23],
      [69, 24],
      [75, 23],
      [78, 20],
      [81, 18]
    ],
    width: 2
  }, {
    points: [
      [64, 19],
      [65, 15],
      [68, 15],
      [69, 10],
      [75, 8]
    ],
    width: 1.5
  }, {
    points: [
      [49, 33],
      [49, 39],
      [53, 41],
      [55, 44],
      [61, 45],
      [62, 52],
      [68, 52],
      [73, 49],
      [78, 46]
    ],
    width: 2.2
  }, {
    points: [
      [44, 39],
      [49, 39]
    ],
    width: 2
  }, {
    points: [
      [91, 18],
      [96, 18],
      [98, 22],
      [104, 23],
      [108, 20],
      [108, 14],
      [105, 9],
      [99, 8]
    ],
    width: 2
  }, {
    points: [
      [102, 23],
      [102, 27]
    ],
    width: 2
  }, {
    points: [
      [89, 46],
      [94, 46],
      [96, 44.8],
      [103, 44.8],
      [108, 47],
      [107, 51],
      [104, 55],
      [101, 54],
      [95, 54]
    ],
    width: 2
  }, {
    points: [
      [102, 35],
      [104, 39],
      [103, 44.8]
    ],
    width: 2
  }];
  world.buildings.push({
    kind: 'cottage',
    x: 22,
    y: 19,
    w: 3,
    h: 3,
    label: 'GARDEN COTTAGE'
  }, {
    kind: 'cottage',
    x: 44,
    y: 14,
    w: 3,
    h: 3,
    label: 'TRAIL HOUSE'
  }, {
    kind: 'ruinGate',
    x: 107,
    y: 46,
    w: 4,
    h: 6,
    label: 'OLD SANCTUARY'
  });
  world.zones[0].species = ['budbit', 'leaflet', 'thornpounce', 'pebblit', 'groveguard', 'skydot'];
  Object.assign(world.zones[0], {
    region: 'forest',
    levels: [1, 4]
  });
  world.zones[1].species = ['leaflet', 'emberbun', 'budbit', 'pebblit'];
  Object.assign(world.zones[1], {
    region: 'meadow',
    levels: [1, 3]
  });
  world.zones[2].species = ['ripple', 'tideglide', 'abyssong'];
  Object.assign(world.zones[2], {
    region: 'beach',
    levels: [1, 4]
  });
  world.zones.push({
    id: 'woodland-trail',
    region: 'forest',
    x: 4.5,
    y: 14,
    w: 3,
    h: 4,
    species: ['budbit', 'thornpounce', 'groveguard'],
    levels: [2, 4],
    label: 'WOODLAND TRAIL'
  }, {
    id: 'ember-slope',
    region: 'ember',
    x: 60,
    y: 14.5,
    w: 5,
    h: 4,
    species: ['emberbun', 'cinderstride', 'pebblit'],
    levels: [3, 5],
    label: 'EMBER SLOPE'
  }, {
    id: 'cinder-crown',
    region: 'ember',
    x: 74,
    y: 8,
    w: 4,
    h: 6,
    species: ['cinderstride', 'ashwarden'],
    levels: [4, 5],
    label: 'CINDER CROWN'
  }, {
    id: 'crystal-pool',
    region: 'caverns',
    x: 49,
    y: 50,
    w: 7,
    h: 5,
    species: ['pebblit', 'dreamtap', 'gloomcoil'],
    levels: [2, 4],
    label: 'CRYSTAL POOL'
  }, {
    id: 'echo-hollow',
    region: 'caverns',
    x: 66,
    y: 40,
    w: 7,
    h: 4,
    species: ['pebblit', 'gloomcoil', 'dreamtap'],
    levels: [3, 4],
    label: 'ECHO HOLLOW'
  }, {
    id: 'snow-drift',
    region: 'frost',
    x: 94,
    y: 8,
    w: 5,
    h: 6,
    species: ['skydot', 'pebblit', 'frosthart'],
    levels: [4, 6],
    label: 'SNOW DRIFT'
  }, {
    id: 'ice-garden',
    region: 'frost',
    x: 104,
    y: 16,
    w: 5,
    h: 6,
    species: ['skydot', 'frosthart'],
    levels: [5, 6],
    label: 'ICE GARDEN'
  }, {
    id: 'mystic-grove',
    region: 'ruins',
    x: 90,
    y: 39,
    w: 6,
    h: 4,
    species: ['budbit', 'dreamtap', 'lumenwing'],
    levels: [5, 7],
    label: 'MYSTIC GROVE'
  }, {
    id: 'old-sanctuary',
    region: 'ruins',
    x: 104,
    y: 54,
    w: 5,
    h: 4,
    species: ['dreamtap', 'lumenwing', 'groveguard'],
    levels: [6, 8],
    label: 'OLD SANCTUARY'
  });
  world.signs.push({
    x: 50,
    y: 20,
    title: 'Ember Highlands',
    text: 'Win one friendly battle or make one capture, then answer a question at the explorer gate. Stay away from the glowing pools.'
  }, {
    x: 48,
    y: 25,
    title: 'Crystal Caverns',
    text: 'Follow this bridge to the caves. A cavern is a large underground space. The crystals light a safe trail between the pools.'
  }, {
    x: 77,
    y: 18,
    title: 'Frostpeak Island',
    text: 'Solve eight English questions to prepare for the snowy trail. The gatekeeper will ask one more question before opening the path.'
  }, {
    x: 74,
    y: 46,
    title: 'Mystic Ruins',
    text: 'Discover eight regions and capture three creatures. Then an English challenge opens the sanctuary paths.'
  });
  world.signs.find(s => s.title === 'Quiet Cove').text = 'The harbor boat can help you return to places you have visited. Press E near the boat, or open your map, to choose a discovered region.';
  world.signs.find(s => s.title === 'Sunbeam Beach').text = 'Follow the bridge south to the beach. Read the discovery post to learn about tides. A rare sea guardian may then visit.';
  world.props.push(
    ['tree', 4.5, 8.5], ['tree', 6, 8], ['smallTree', 13, 12], ['tree', 4, 17.5], ['bushyTree', 13, 18.5], ['rock', 11, 10],
    ['smallTree', 19.5, 24], ['smallTree', 35, 27], ['smallTree', 19.5, 20],
    ['bushyTree', 23, 3.5], ['smallTree', 33, 7.8], ['tree', 49.5, 12.5],
    ['rock', 59.5, 13], ['sandRock', 62, 11], ['rock', 65.5, 7.5], ['sandRock', 77, 10], ['rock', 78, 15], ['rock', 62, 24], ['sandRock', 70, 25], ['rock', 76, 25],
    ['ruinPillar', 47, 35], ['brokenPillar', 55, 37], ['ruinPillar', 72, 38], ['rock', 46, 48], ['rock', 56, 54], ['brokenPillar', 71, 54], ['rock', 76, 48],
    ['iceTree', 94, 12], ['iceTree', 92.5, 16], ['iceTree', 96, 7.5], ['iceTree', 105.5, 8], ['iceTree', 110, 12], ['iceTree', 109, 24], ['iceTree', 98, 24], ['iceRock', 103, 16], ['iceRock', 108, 18], ['iceRock', 95, 21],
    ['tealTree', 92, 39], ['smallTealTree', 89.5, 43], ['tealTree', 109, 39], ['smallTealTree', 112, 44], ['tealTree', 111, 52], ['tealTree', 107, 59], ['tealTree', 93, 58],
    ['ruinPillar', 104, 47], ['brokenPillar', 110, 48], ['ruinPillar', 105, 50], ['brokenPillar', 109, 52]
  );
  // Forty species from the supplied workbook join habitats without replacing old IDs.
  const imported = {
    grove: [1, 10, 12, 16, 43, 69],
    'woodland-trail': [23, 35],
    meadow: [25, 39, 133],
    beach: [7, 54, 60, 79, 129, 131, 134],
    'ember-slope': [4, 37, 58, 77],
    'cinder-crown': [146],
    'crystal-pool': [27, 66, 74, 95, 104],
    'echo-hollow': [41, 63, 81, 92, 94],
    'snow-drift': [124, 144],
    'ice-garden': [131, 144],
    'mystic-grove': [35, 63, 143, 151],
    'old-sanctuary': [147, 149, 151]
  };
  for (const [zone, dexNumbers] of Object.entries(imported)) {
    world.zones.find(z => z.id === zone).species.push(...dexNumbers.map(n => 'pokemon-' + String(n).padStart(4, '0')));
  }
  world.zones.push({
    id: 'spark-ledge',
    region: 'ember',
    x: 74,
    y: 20,
    w: 4,
    h: 3,
    species: ['pebblit', 'pokemon-0025', 'pokemon-0081', 'pokemon-0125'],
    levels: [3, 5],
    label: 'SPARK LEDGE'
  });
  world.zones.push({
    id: 'cove-shore',
    region: 'dock',
    x: 9,
    y: 31,
    w: 3,
    h: 3,
    species: ['ripple', 'pokemon-0007', 'pokemon-0129'],
    levels: [1, 3],
    label: 'HARBOR FRIENDS'
  });
  // Deterministic edge clusters preserve open paths, encounter patches and arrivals.
  const segmentDistance = (x, y, a, b) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1],
      t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
  };
  for (const r of world.islands.filter(r => r.shape)) {
    for (let x = r.x + 1.6; x < r.x + r.w - 1.5; x += 2.4)
      for (let y = r.y + 1.8; y < r.y + r.h - 1.4; y += 2.5) {
        let inside = false;
        for (let a = 0, b = r.shape.length - 1; a < r.shape.length; b = a++) {
          const p = r.shape[a],
            q = r.shape[b];
          if ((p[1] > y) !== (q[1] > y) && x < (q[0] - p[0]) * (y - p[1]) / (q[1] - p[1]) + p[0]) inside = !inside;
        }
        if (!inside || Math.sin(x * 13.1 + y * 27.9) < -.45) continue;
        if (world.trails.some(t => t.points.slice(1).some((p, i) => segmentDistance(x, y, t.points[i], p) < t.width / 2 + 1.1))) continue;
        if (world.zones.some(z => x > z.x - .7 && x < z.x + z.w + .7 && y > z.y - .7 && y < z.y + z.h + .7)) continue;
        if (world.water.some(w => w.points ? w.points.slice(1).some((p, i) => segmentDistance(x, y, w.points[i], p) < w.width / 2 + 1) : Math.hypot(x - w.x, y - w.y) < w.radius + 1)) continue;
        if (Math.hypot(x - r.note[0], y - r.note[1]) < 2 || Math.hypot(x - r.arrival[0], y - r.arrival[1]) < 2) continue;
        if (world.props.some(p => Math.hypot(x - p[1], y - p[2]) < 1.6)) continue;
        const kind = r.ground === 'snow' ? 'iceTree' : r.ground === 'mystic' ? 'tealTree' : r.ground === 'stone' ? 'brokenPillar' : 'rock';
        world.props.push([kind, x, y]);
      }
  }
  for (const prop of world.props)
    if (prop[1] >= 43 && prop[1] <= 79 && prop[2] >= 32 && prop[2] <= 59 && prop[0].toLowerCase().includes('pillar')) prop[0] = 'crystal';
  // Original species remain readable only for existing saves. New adventures use Pokémon.
  for (const [id, species] of Object.entries(Prime.data.creatures)) {
    species.legacyOnly = species.origin !== 'pokemon-workbook';
    species.starter = ['pokemon-0001', 'pokemon-0004', 'pokemon-0007'].includes(id);
  }
  for (const zone of world.zones) {
    zone.species = zone.species.filter(id => !Prime.data.creatures[id].legacyOnly);
  }
  // Every species carries its actual habitats and level range, derived from encounter data.
  for (const [id, species] of Object.entries(Prime.data.creatures)) {
    const zones = world.zones.filter(z => z.species.includes(id));
    species.regions = [...new Set(zones.map(z => z.region))];
    species.levelRange = zones.length ? [Math.min(...zones.map(z => z.levels[0])), Math.max(...zones.map(z => z.levels[1]))] : [1, 8];
  }
  Prime.data.creatures.frosthart.requiresNote = 'frost';
  Prime.data.creatures.ashwarden.requiresNote = 'ember';
  Prime.data.creatures.abyssong.requiresNote = 'beach';
  // Modest 1.2x advantages, not a claim to reproduce official Pokémon combat.
  Prime.data.typeAliases = {
    Earth: 'Ground',
    Air: 'Flying',
    Magic: 'Fairy',
    Shadow: 'Dark'
  };
  Prime.data.typeStrengths = {
    Normal: [],
    Fire: ['Grass', 'Ice', 'Bug', 'Steel'],
    Water: ['Fire', 'Ground', 'Rock'],
    Grass: ['Water', 'Ground', 'Rock'],
    Electric: ['Water', 'Flying'],
    Ice: ['Grass', 'Ground', 'Flying', 'Dragon'],
    Fighting: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'],
    Poison: ['Grass', 'Fairy'],
    Ground: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'],
    Flying: ['Grass', 'Fighting', 'Bug'],
    Psychic: ['Fighting', 'Poison'],
    Bug: ['Grass', 'Psychic', 'Dark'],
    Rock: ['Fire', 'Ice', 'Flying', 'Bug'],
    Ghost: ['Psychic', 'Ghost'],
    Dragon: ['Dragon'],
    Dark: ['Psychic', 'Ghost'],
    Steel: ['Ice', 'Rock', 'Fairy'],
    Fairy: ['Fighting', 'Dragon', 'Dark']
  };
})();
