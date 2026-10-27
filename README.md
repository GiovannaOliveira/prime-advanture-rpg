# Prime Adveture

A cozy, desktop creature RPG for English learners aged 7–12. Explore six connected islands, meet six creature species, and practice a little English along the way. All game text is in English.

## Play

Extract the complete project folder, then open **index.html** in a current desktop browser. Keep `assets`, `styles`, and `src` alongside it. There is no build, npm installation, engine, CDN, backend, or runtime package dependency. JavaScript uses classic scripts; data is included in JavaScript files, with no local `fetch` or ES module imports.

If your browser restricts local files or local storage, use a local server from this folder:

```sh
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your own browser. Saves belong to the browser and origin: opening the file and serving it through HTTP may use different saves. Moving the folder or changing the port may also change which save is available.

**Validation:** the full flow was exercised in Chromium through HTTP. This cloud machine's managed browser blocks `file://` navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`), so direct-file execution could not be verified here. The implementation avoids server-only features, and its source is arranged for direct-file loading. Other browsers have not been tested.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move |
| E | Interact with a nearby creature, person, sign, or chest |
| Space | Contextual interaction / confirm; focused buttons use standard keyboard activation |
| Esc | Close a panel, cancel a question, or leave battle when a turn is not resolving |
| R | Return to the starting meadow if you lose your way |
| Mouse | Choose actions, answers, creatures, and menu options |

The player is controllable immediately. Choose Leaflet, Emberbun, or Ripple using the welcome card, or walk north to Professor Willow. A small friendly companion follows your trail and does not block movement.

## Your adventure

- **Welcome Meadow:** starting area, wild friends, daily chest, and Nora's free Healing House.
- **Whispering Grove:** cross the western bridge to meet forest creatures.
- **Prime Academy:** follow the northern bridge for Professor Willow and learning guidance.
- **Little Trading Post:** cross the eastern bridge to buy capture orbs and healing potions from Milo.
- **Sunbeam Beach:** cross the southern bridge for water creatures and a very rare visitor.
- **Quiet Cove:** cross the southwest bridge for a peaceful decorative dock and boat. The boat is not a travel system.

All islands are connected by walkable wooden bridges. The Map button shows the world and your position. Water, tree trunks, rocks, chest, and building footprints are solid. Character sprites can appear behind tree canopies and roofs.

### Creatures and battles

The six species are Leaflet (Grass), Emberbun (Fire), Ripple (Water), Pebblit (Earth), Skydot (Air), and Frosthart (Ice). Their art comes from the supplied packs; the game names and simple data are specific to this prototype.

Press E near a visible wild creature to start a turn-based battle:

- **Attack:** deals damage without a question.
- **Special Move:** answer a question to use a stronger elemental move.
- **Capture:** answer a question, then spend one orb on a capture attempt. Lower HP improves the chance; rarer creatures are harder to capture. Failure allows the wild creature to respond.
- **Run:** safely end the encounter and return to the map.

Commands lock while turns resolve. A correct question answer gives 5 adventure XP. Winning or capturing gives creature XP and 10 coins; creature level-ups increase max HP and restore some health. If your active friend runs out of HP, return to Nora or use a potion. Fainted friends remain in the collection.

Open **Collection** to choose any captured instance as your active friend or use a potion. The species grid tracks all six species; the roster lists every captured friend, including duplicates. The prototype limits the collection to 100 instances. Each potion fully heals the active friend; Nora heals the entire collection for free.

Wild encounters spawn in the marked patches every 3–6 seconds, up to eight at once. Rarity roll weights are Common 72, Uncommon 21, Rare 6, Legendary 1. A roll with no eligible species in that area produces no spawn. Creatures move slowly within their zones, and distant creatures expire after about 210 seconds. Only active play advances this simulation.

### English club

The initial bank contains **20 reviewed multiple-choice questions**: 8 Beginner, 6 Elementary, and 6 Intermediate. Change the level in English club; it determines the actual question pool. Feedback explains the answer, and an incorrect choice can be retried without losing an item or battle turn. Questions power special moves, captures, and daily rewards; the English club also offers free practice.

Questions and explanations live in `src/data/questions.js`. Each entry has an ID, level, category, text, answer options, correct index, and explanation. This is a local fixed question bank, ready for future content changes. Student accounts, individual assignments, teacher dashboards, and automated personalization are not implemented.

### Daily gift

Press E near the meadow chest and answer a short question. The normal gift is 25 coins, 2 capture orbs, 1 potion, and 10 adventure XP. It becomes available again **24 hours after the last claim**, rather than at midnight. Returning between 24 and 48 hours continues your streak; returning later starts a new streak. Days 3, 7, and 14 give modest bonus coins and orbs. The last fourteen claims are retained in save data.

Cooldown and streak use the device clock and browser `localStorage`; they survive reloads. This is not a tamper-proof economy: changing the clock or save data can affect it. There is no server or online competition.

## Saving and resetting

The game saves creatures, selected starter, active friend, XP, answers, coins, items, daily gift, difficulty, and safe player position under `prime-adveture-save-v1` in local storage. Saving runs during progression changes, every few seconds of play, and when leaving the page. Loaded values are validated and normalized; corrupt or unsupported-version saves safely start a new game. Position is restored only on walkable ground.

Use **Settings → Reset progress → Yes, start again** to start over. This confirmation deletes only this game's browser save. **Return to meadow** changes position without deleting progress.

If the browser refuses storage, play remains available for the current tab and the footer reports that saving is unavailable. No secrets, student names, or personal data are stored.

## Project structure

```text
index.html                 Classic scripts, canvas, accessible HTML overlays
styles/main.css            Desktop layout and game panels
src/main.js                Boot and startup error handling
src/core/                  Main loop, asset loader, input
src/world/                 Terrain renderer, camera-space drawing, collision geometry
src/entities/              Player and following companion
src/systems/               Encounters, combat, English, saving, XP, daily gifts
src/ui/                    HUD, collection, questions, NPCs, shop, map, settings
src/data/                  Asset registry, frame mapping, creature stats, map, questions
assets/                    Only the graphics/fonts used by this prototype
ASSETS.md                  Source-pack attribution and asset mapping
TESTING.md                 Browser validation and limitations
tests/playtest.py          Optional Playwright acceptance suite
```

The central registry is `src/data/assets.js`, including explicit sprite-sheet frame sizes. Missing images warn in the console and use a readable Canvas/CSS fallback instead of preventing startup. UI sprite sheets use CSS cropping, so they do not require Canvas pixel readback from local files.

## Prototype scope

Desktop keyboard and mouse only; no mobile controls, audio, backend, multiplayer, accounts, interiors, travel boat, evolution, or student-specific curriculum. Shop and Academy interactions happen outside their buildings. The small follower is decorative. Rare encounters are random and are not guaranteed during a short session. External image generation was not used: supplied PNG/font assets are reused, with original Canvas decorations for bridges, flowers, chest, signs, beach props, and boat.
