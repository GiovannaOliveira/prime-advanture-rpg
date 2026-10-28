# Prime Adventure

A cozy, desktop creature RPG for English learners aged 7–12. Explore ten connected regions, meet 56 creature species (including 40 Gen I Pokémon from the supplied workbook), and practice a little English along the way. All game text is in English.

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
- **Quiet Cove:** cross the southwest bridge for harbor encounters and the boat/map return-travel menu.

- **Ember Highlands:** east of the shop; one friendly win or capture plus an English challenge opens the gate.
- **Crystal Caverns:** bridges from the beach and trading post lead to crystal fields and pools.
- **Frostpeak Island:** beyond Ember; eight solved questions plus a gate challenge unlock the snow trails.
- **Mystic Ruins:** east of the caverns and south of Frostpeak; discover eight regions and make three captures, then answer a gate challenge.

Read each region's discovery post to learn a word and earn a one-time reward after a question. The map offers free travel back to unlocked regions you have already visited. See [EXPANSION.md](EXPANSION.md) for routes, exact rules, data sources, sprite limitations, and the full creature distribution.

All regions are connected by walkable wooden bridges. The Map button shows the world and your position. Water, tree trunks, rocks, chest, and building footprints are solid. Character sprites can appear behind tree canopies and roofs.

### Creatures and battles

The original six species and their IDs remain: Leaflet, Emberbun, Ripple, Pebblit, Skydot, and Frosthart. Ten additional animated pack species and forty official Gen I Pokémon bring the playable total to 56. Pokémon names, types, and static portraits come from the user-supplied workbook; HP, attack, defense, moves, and encounter rarity are custom prototype balance, not official Pokémon/GO stats. The standalone reference catalog has 1,025 national species, but only the selected forty Pokémon are playable in this release.

Press E near a visible wild creature to start a turn-based battle:

- **Attack:** deals damage without a question.
- **Special Move:** answer a question to use a stronger elemental move.
- **Capture:** answer a question, then spend one orb on a capture attempt. Lower HP improves the chance; rarer creatures are harder to capture. Failure allows the wild creature to respond.
- **Run:** safely end the encounter and return to the map.

Commands lock while turns resolve. A correct question answer gives 5 adventure XP. Winning or capturing gives creature XP and 10 coins; creature level-ups increase max HP and restore some health. If your active friend runs out of HP, return to Nora or use a potion. Fainted friends remain in the collection.

Open **Collection** to choose any captured instance as your active friend or use a potion. The species grid and filters track all 56 species; the roster lists every captured friend, including duplicates. The prototype limits the collection to 300 instances. Each potion fully heals the active friend; Nora heals the entire collection for free.

Wild encounters spawn in the marked patches every 3–6 seconds, up to eight at once. The configurable weights are Common 72, Uncommon 21, Rare 6, Legendary 1, normalized among eligible rarities in the current patch. Regional levels, habitat restrictions, and additional legendary discovery conditions are applied. Population refreshes on region changes; no more than four wild instances occupy one region. Creatures move slowly within their zones, and distant creatures expire after about 210 seconds. Only active play advances this simulation.

### English club

The offline bank contains **300 authored and reviewed multiple-choice questions**: **150 Beginner, 100 Elementary, and 50 Intermediate**. Every question has exactly three distinct options, one correct answer, and a short, kind explanation. The five themes are Nature, Creatures, Friendship, Exploration, and Everyday life; skills are Vocabulary, Grammar, Reading, and Dialogue. Content covers distinct words, language structures, short stories, and conversational situations rather than generating name/number substitutions at runtime.

Change the level in English club; its progress note shows distinct questions explored, answered, and solved on the first try for that level. Questions power the existing special moves, captures, daily rewards, and free practice. Game rewards are unchanged.

**New questions first.** A question is recorded as presented as soon as it opens, even if you cancel it or reload before answering. Selection uses only unseen questions in the chosen level until that bank is exhausted. It alternates themes when another theme is available. The three options are shuffled for each presentation, with the correct answer carried along explicitly; source data is never reordered.

**Review after exhaustion.** Once all questions in that level have appeared, the challenge badge changes to Review and shows a round number. Each question appears at most once in that review round. The selector avoids up to the twelve most recently presented questions when older eligible questions remain and changes theme when possible. Within those recency/theme constraints, questions with previous mistakes come first, followed by unfinished questions. After every question has appeared in a round, another round starts. Review round membership and ordering history survive reloads and level changes.

Wrong answers get educational feedback and may be retried. The same wrong option cannot be submitted twice, and a solved question cannot award XP twice. History records presentations, presentations with a response, completed questions, first-try completions, incorrect choices, ordering, and last presentation/response times. First-try means the first submitted choice in that presentation; improving on a later review can earn a first-try success for that later presentation. The club counts distinct question IDs with such events; aggregate game XP/solved counts still include review rewards.

Question banks are in `src/data/questions/beginner.js`, `elementary.js`, and `intermediate.js`. The small registry `src/data/questions.js` loads first. Each bank registers fixed records with this shape:

```js
Prime.data.registerQuestions('Beginner', [{
  id: 'b151',
  topic: 'Nature',
  skill: 'Vocabulary',
  text: 'An original, unambiguous question goes here.',
  options: ['Correct answer', 'Different alternative', 'Another alternative'],
  answer: 0,
  explanation: 'A short explanation of the correct answer.'
}]);
```

The example is a schema illustration, not extra shipped content. To add a real batch, append reviewed records to the matching bank, or add a classic bank script after the registry in `index.html`. No scheduler changes are required. Keep IDs unique and stable: retain an ID for a wording correction, use a fresh ID for a genuinely new question, and never recycle IDs. Include the level through registration plus a theme, skill, three options, correct zero-based index, and explanation. Run the bank tests and update the expected distribution when deliberately expanding beyond 300. Questions added during a review are offered as new content before review continues.

The bank is fixed offline content, not live AI generation. Student accounts, individual assignments, teacher dashboards, Asakiri/Scibly integration, and automated personalization are not implemented. No third-party course content or code was copied into these questions.

### Daily gift

Press E near the meadow chest and answer a short question. The normal gift is 25 coins, 2 capture orbs, 1 potion, and 10 adventure XP. It becomes available again **24 hours after the last claim**, rather than at midnight. Returning between 24 and 48 hours continues your streak; returning later starts a new streak. Days 3, 7, and 14 give modest bonus coins and orbs. The last fourteen claims are retained in save data.

Cooldown and streak use the device clock and browser `localStorage`; they survive reloads. This is not a tamper-proof economy: changing the clock or save data can affect it. There is no server or online competition.

## Saving and resetting

The game saves creatures, selected starter, active friend, XP, answers, coins, items, daily gift, difficulty, safe player position, per-question learning history, and visited/unlocked regions and discovery rewards under `prime-adveture-save-v1` in local storage. Saving runs during progression changes, every few seconds of play, and when leaving the page. Loaded values are validated and normalized; corrupt or unsupported-version saves safely start a new game. Position is restored only on walkable ground.

Use **Settings → Reset progress → Yes, start again** to start over. This confirmation deletes only this game's browser save. **Return to meadow** changes position without deleting progress.

Existing version-1 saves without question history retain their creatures, coins, XP, items, daily rewards, and position. The new history starts empty; past question-level results cannot be reconstructed from the old aggregate answer count. Corrupt question-history fields are normalized independently of the rest of the save. Reset progress clears the question history too. Saves remain browser/origin-specific.

If the browser refuses storage, play remains available for the current tab and the footer reports that saving is unavailable. No secrets, student names, or personal data are stored.

## Project structure

```text
index.html                 Classic scripts, canvas, accessible HTML overlays
styles/main.css            Desktop layout and game panels
src/main.js                Boot and startup error handling
src/core/                  Main loop, asset loader, input
src/world/                 Terrain renderer, camera-space drawing, collision geometry
src/entities/              Player and following companion
src/systems/               Encounters, combat, English scheduler/UI, saving, XP, daily gifts
src/ui/                    HUD, collection, questions, NPCs, shop, map, settings
src/data/                  Asset registry, frame mapping, creature stats, map, question registry
src/data/questions/        Three authored offline banks, grouped by level
assets/                    Only the graphics/fonts used by this prototype
ASSETS.md                  Source-pack attribution and asset mapping
TESTING.md                 Browser validation and limitations
tests/questions.test.cjs   Dependency-free Node question-bank/scheduler tests
tests/question-playtest.py Question/history browser integration tests
tests/playtest.py          Existing gameplay regression suite
tests/world-data.test.cjs  Expansion metadata, assets and import validation
tests/expansion-playtest.py World/collection/save browser acceptance suite
scripts/import-pokemon.py Offline importer for the supplied Excel workbook
data/pokemon-catalog.json Reference metadata for 1,025 national species
EXPANSION.md              Regions, gates, habitats, art limits and save compatibility
```

The central asset registry starts in `src/data/assets.js`; `src/data/pokemon.js` registers workbook portraits explicitly. Animated sheets retain frame sizes while static portraits use aspect-preserving rendering. Missing images warn in the console and use a readable Canvas/CSS fallback instead of preventing startup. UI sprite sheets use CSS cropping, so they do not require Canvas pixel readback from local files.

## Prototype scope

Desktop keyboard and mouse only; no mobile controls, audio, backend, multiplayer, accounts, building interiors, evolution, or student-specific curriculum. Shop and Academy interactions happen outside their buildings. The small follower is decorative. Rare encounters are random and are not guaranteed during a short session. External image generation was not used: supplied pack PNG/font assets and workbook Pokémon portraits are reused, with original Canvas decorations for bridges, flowers, chest, signs, beach props, and boat.
