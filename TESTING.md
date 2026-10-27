# Validation

Validated on 2026-10-27 in headless desktop Chromium, using the actual Canvas game and HTML UI through Python Playwright. Screenshots were inspected for the world, starter choice, battle, English question, map, missing-asset fallback, and smaller desktop layout.

## Run the existing suite

The game has no runtime packages. The optional test runner needs Python Playwright and a Chromium installation. In the prepared cloud environment both are already installed.

From the repository root, start a server in one terminal:

```sh
python3 -m http.server 8000 --bind 0.0.0.0
```

In another terminal:

```sh
python3 tests/playtest.py
```

The default browser executable is `/usr/bin/chromium`. Override it with `PRIME_CHROMIUM` if your installation differs. An optional positional URL selects another server. Test screenshots go to `/tmp/prime-adveture-tests` by default; override with `PRIME_TEST_ARTIFACTS`. Test dependencies are not needed to play the game.

## Results

**PASS: 23 check groups, all 11 tested world destinations reachable, zero uncaught page errors.** See `tests/validation.json` for the recorded report.

- Game boot, bundled assets, and a valid visible starting player.
- Actual WASD movement and water collision using keyboard events.
- Collision-aware reachability from spawn to the three NPCs, four signs, three encounter areas, and chest.
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

## Limits

Direct `file://` navigation was attempted but blocked by the cloud machine's managed Chromium policy: `ERR_BLOCKED_BY_ADMINISTRATOR`. That launch mode is therefore **unverified here**, rather than a passing browser check or a diagnosed game defect. The game uses classic scripts, bundled images, and JavaScript data to support direct opening; HTTP is the tested fallback.

Mobile, Safari, Firefox, audio, online synchronization, and individualized student content were not tested or implemented. Daily rewards trust the local clock and browser storage. A short play session does not guarantee seeing the legendary creature. Clock changes, multi-tab conflict handling, and anti-cheat are outside this offline prototype's scope.
