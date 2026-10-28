# Validation

Expansion validated on 2026-10-28 in headless desktop Chromium, using the actual Canvas game and HTML UI through Python Playwright. Screenshots were inspected for the world, starter choice, battle, English question, map, missing-asset fallback, and smaller desktop layout.

## Run the existing suite

The game has no runtime packages. The optional test runner needs Python Playwright and a Chromium installation. In the prepared cloud environment both are already installed.

From the repository root, start a server in one terminal:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

In another terminal:

```sh
python3 tests/playtest.py
python3 tests/question-playtest.py
python3 tests/expansion-playtest.py
```

The question-bank and scheduler tests use only Node built-ins (no npm packages or installation):

```sh
node --test tests/questions.test.cjs tests/world-data.test.cjs
```

The default browser executable is `/usr/bin/chromium`. Override it with `PRIME_CHROMIUM` if your installation differs. An optional positional URL selects another server. Test screenshots go to `/tmp/prime-adveture-tests` by default; override with `PRIME_TEST_ARTIFACTS`. Test dependencies are not needed to play the game.

## Results

**PASS: 14 Node tests, the 11 question/history browser check groups, the 23 gameplay regression groups, and the expansion browser suite.** The expansion suite verifies 34 reachable arrival/post/encounter targets, all 14 encounter patches, six preserved legacy captures, and successful capture/collection of all forty imported Pokémon. See `tests/validation.json`, `tests/question-validation.json`, and `tests/world-validation.json` for recorded results.

- Game boot, bundled assets, and a valid visible starting player.
- Actual WASD movement and water collision using keyboard events.
- Collision-aware reachability from spawn to NPCs, signs, all encounter areas, and chest with gates opened in the geometry fixture. Separate expansion checks validate gates while locked and actual unlocking.
- Functional starter selection.
- Basic and special attacks, HP updates, effect animation, and locked commands during turns.
- Incorrect-answer feedback, retry, challenge cancellation, and correct-answer rewards.
- Deterministic failed and successful capture branches, item consumption, and collection updates.
- Collection instance selection and potion consumption/healing.
- Daily reward, repeat-claim prevention after reload, and a day-three streak bonus.
- Local-storage persistence, normalization of invalid values, and recovery from malformed JSON.
- Shop purchases and free NPC healing.
- Difficulty affecting the question pool.
- Victory and defeat returning to a usable map.
- XP causing a real creature level-up and HP increase.
- Functional map, Academy dialogue, English club, and guide.
- Reset confirmation, cancellation, actual reset, and initial-position restoration.
- Repeated spawn updates preserving zone boundaries, collision validity, and the eight-creature limit.
- Desktop layout at 1440×960 and 1024×768, without horizontal document overflow.
- Intentionally missing player/creature images still allowing startup, starter choice, and visible UI placeholders.

The suite arranges some world positions and battle/random state directly to exercise both outcomes reliably, then uses actual keyboard and UI actions. Reachability uses the production collision geometry. It is not a claim that a human manually walked every route or that every possible random battle combination was exhausted.

Additional static checks confirmed valid JavaScript syntax and existing HTML/CSS/asset-registry paths. There is no build or type-generation step for this plain JavaScript project.

## Question update coverage

- Exactly 300 unique IDs and unique stems (including a number-normalized duplicate check), with 150/100/50 distribution.
- Three distinct nonempty options, a valid answer index, bounded question/explanation lengths, and valid theme/skill metadata. All levels contain all five themes and four skills.
- Complete unseen-bank traversal at all three levels, available-theme alternation, full review rounds, and the next round boundary.
- Shuffling puts the correct choice in every possible position without mutating source data.
- Incorrect attempts, eventual completion, first-try completion, cancellation/presentation-only records, and duplicate-submission protection.
- Error priority among questions eligible under recency/theme constraints, independent level histories, new-batch precedence, and no immediate new-batch repetition at a round boundary.
- Compatibility with actual old version-1 saves lacking the new field, including inventory, creatures, XP, and daily reward state.
- Malformed question-history normalization without resetting unrelated progress.
- Browser persistence before the first answer, after an error/cancellation, after success, across level switches, and during an ongoing review round.
- Actual UI feedback, history counters, unchanged XP/orb behavior, review badges, and the longest authored question at 1024×768.

Content was authored as fixed individual questions, then read for answer correctness, clarity, age-appropriate language, and ambiguity. Structural tests support that review; they do not independently prove that every English sentence is pedagogically perfect. No external professional review or classroom trial is claimed. Two ambiguous stems were rewritten during review, including a pronoun-reference item; an additional sequencing item was given explicit context. No material was imported from Scibly or Asakiri Studio.

## Limits

Direct `file://` navigation was attempted but blocked by the cloud machine's managed Chromium policy: `ERR_BLOCKED_BY_ADMINISTRATOR`. That launch mode is therefore **unverified here**, rather than a passing browser check or a diagnosed game defect. The game uses classic scripts, bundled images, and JavaScript data to support direct opening; HTTP is the tested fallback.

Mobile, Safari, Firefox, audio, online synchronization, and individualized student content were not tested or implemented. Imported Pokémon use static front portraits; the suite checks both enemy and mirrored-player rendering, not nonexistent animation/back artwork. Daily rewards trust the local clock and browser storage. A short play session does not guarantee seeing the legendary creature. Clock changes, multi-tab conflict handling, and anti-cheat are outside this offline prototype's scope.

## Expansion-specific validation

The browser expansion suite checks the corrected title, ten regions, 56 registered species, all 40 imported PNGs loading without missing files, legacy party/XP/question-history preservation, gated collision, cancellation and successful gate quizzes, actual keyboard traversal into Ember, one-time discovery rewards, legendary eligibility, map travel restrictions, all reachable arrival/note/patch targets, actual spawning in every patch, region levels/habitats, collection filters and active-instance selection, both static battle portraits, and reload persistence. Browser screenshots cover the village, highlands, snow, caverns, ruins, atlas, collection and Pokémon battles.

Data tests validate source PNG checksums and all asset paths, 1,025 national metadata rows with a strict public-field allowlist, stable original IDs and save key, all species' habitat definitions, type compatibility, gate predicates, and exploration normalization. The importer runs offline as a development script using openpyxl. No spreadsheet, captured/owner fields, or external website data is published.

A geometry test opens all gates temporarily to test the complete route graph; separate interaction tests exercise real locked gates and challenges. Fixture-driven captures force a successful random roll to test every imported species consistently. These are not claims that every random battle combination or every device has been exhaustively tested. No fixed frame-rate claim is made; population and terrain size are bounded, static ground is cached, and active play is evaluated through real Chromium rendering.
