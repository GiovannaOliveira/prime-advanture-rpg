# Prime Adventure: world and collection expansion

The working game was expanded in place. It now has **10 regions, 14 encounter patches and 56 playable species**: the six existing creatures, ten additional animated species from the supplied packs, and forty Gen I Pokémon from the supplied workbook. The 300 English questions, first-try records, starter choices, daily gift, combat/capture loop, and inventory remain in use.

## World and routes

The canvas world grows from 56×46 to **118×66 tiles**, retaining 32-pixel tiles and the original spawn `[27,23]`. The original six region IDs and positions are retained; their visual treatment gains streams, a village pond, fences, cottages and gardens. New polygonal regions use different terrain, trees, rock walls, crystals, pools and trails. The reference screenshots guided composition only; neither screenshot, its logos, or its buildings were used as a runtime image.

| Region | Routes and purpose | Levels / access |
| --- | --- | --- |
| Welcome Meadow | Original spawn, starters, chest, healer, cottage, introductory encounters | 1–3; open |
| Whispering Grove | Western bridge, a winding stream, footbridge and forest encounters | 1–4; open |
| Prime Academy | Northern bridge, Professor Willow, courtyard and gardens | Safe hub; open |
| Little Trading Post | Eastern bridge, Milo, shop and departure routes | Safe hub; open |
| Sunbeam Beach | Southern bridge, coastal creatures and tide discovery | 1–4; open |
| Quiet Cove | Southwest bridge, harbor encounters and boat/map travel | 1–3; open |
| Ember Highlands | East of the shop; warm rocky slopes, lava pools and Spark Ledge | 3–5; one win OR capture, then an English challenge |
| Crystal Caverns | Bridges from beach and shop; crystal fields, stone passages and pools | 2–4; open |
| Frostpeak Island | East of Ember; snow trees, a frozen pool and snowy trails | 4–6; eight solved questions, then a gate challenge |
| Mystic Ruins | East of caverns and south of Frostpeak; a stream, old pillars and sanctuary | 5–8; eight visited regions AND three captures, then a gate challenge |

Multiple gates leading into the same region share one unlock. All unlock rules and region IDs are data-driven. Gates, water, lava, stone walls, fences and solid scenery participate in collisions. Boat access and the existing map share a free return-travel menu: only an already visited, unlocked region with a valid arrival point is accepted. A new region must be reached on foot first. Travel resets the follower trail rather than leaving the companion behind.

Every region has a discovery post explaining an English word in context. After one of the existing question-bank challenges, that region grants **15 coins, one capture orb and 10 adventure XP**, once per save. The question itself retains its existing 5-XP reward. Posts can still be read after claiming. Field-note rewards are separate from the daily chest.

## Creatures and habitats

The existing IDs `leaflet`, `emberbun`, `ripple`, `pebblit`, `skydot`, and `frosthart` keep their existing base stats. Ten extra pack species are Thornpounce, Groveguard, Cinderstride, Ashwarden, Dreamtap, Gloomcoil, Tideglide, Abyssong, Budbit, and Lumenwing. These use distinct original source sheets, not recolors of one creature.

Forty Pokémon join them using English names, primary/secondary types and embedded portraits from `20251206_Pokemon_Database_1.0.xlsx`. The user explicitly chose official Pokémon after the original-creature-only proposal. Their IDs are stable national numbers, for example `pokemon-0025`. Original creature IDs and captured instances are not replaced.

| Main habitats | Imported Pokémon |
| --- | --- |
| Meadow / woodland | Bulbasaur, Caterpie, Butterfree, Pidgey, Ekans, Pikachu, Clefairy, Jigglypuff, Oddish, Bellsprout, Eevee |
| Coast / harbor | Squirtle, Psyduck, Poliwag, Slowpoke, Magikarp, Lapras, Vaporeon |
| Ember / Spark Ledge | Charmander, Vulpix, Growlithe, Ponyta, Pikachu, Magnemite, Electabuzz, Moltres |
| Caverns | Zubat, Sandshrew, Abra, Machop, Geodude, Magnemite, Gastly, Gengar, Onix, Cubone |
| Frostpeak | Jynx, Lapras, Articuno |
| Mystic Ruins | Clefairy, Abra, Snorlax, Dratini, Dragonite, Mew |

Some species have multiple habitats. Every playable species has at least one encounter patch. Levels come from each patch, and rarity is weighted among eligible species available there. Initial nearby encounters prefer Common/Uncommon species. There are at most **eight wild instances globally and four per region**, within a configurable encounter radius; entering a new region refreshes nearby population so faraway creatures cannot permanently consume its slots.

Legendary encounters have additional discovery conditions: Frosthart/Articuno require the Frostpeak note, Ashwarden/Moltres the Ember note, Abyssong the beach note, and Mew the ruins note. They are eligible after the note, not guaranteed to appear immediately. Magic and Shadow support the additional pack creatures; imported Pokémon retain both spreadsheet types. Type aliases map old Earth/Air/Magic/Shadow to Ground/Flying/Fairy/Dark for a modest 1.2× advantage. This is the prototype's combat model, not an official Pokémon/GO battle simulator.

The collection now derives its total from the registry, offers type/rarity/habitat filters for discovered species, displays descriptions, habitat, rarity, HP/ATK/DEF and moves, and preserves per-instance active selection. Unknown names/details stay hidden. The collection capacity is now 300 instances rather than 100, leaving space for existing collectors to add the new species.

## Workbook handling and art limits

The importer reads **1,391 form records covering 1,025 national species**. `data/pokemon-catalog.json` retains a small public-metadata reference catalog, not 1,025 playable creatures. Only the forty selected Gen I entries and their PNGs are loaded by the game. The full spreadsheet, original collection checkmarks, trainer identifiers, storage records, capture dates, and comments are not committed or transferred into student saves.

The workbook does **not** provide HP, attack, defense or moves. The values and rarity tiers in `src/data/pokemon.js` are explicitly custom Prime Adventure balancing choices. Images are extracted as their original PNG bytes with SHA-256 provenance; no spreadsheet formula is evaluated. Workbook `DISPIMG` IDs are matched to internal image relationships. External image links are not fetched.

The imported Pokémon have **static front portraits**, not animated front/back sheets. In battle the player portrait is mirrored; it is not claimed to be an authentic back sprite. Existing pack creatures keep their idle, attack and front/back sheets. Ground decorations, crystal clusters, terrain, rivers and thematic battle backdrops are Canvas/CSS artwork. No image-generation service was used, and no missing-art placeholder is required during normal loading. General missing-image fallbacks remain supported.

The suggested GO Hub and Gen I URLs could not be fetched because this execution network returned proxy 403 responses. No data was imported from those pages or misrepresented as verified there. The supplied workbook is the actual source.

## Save compatibility

Save version **1** and the legacy key **`prime-adveture-save-v1`** intentionally remain unchanged despite the corrected visible title. Optional `exploration.visited`, `exploration.unlocked`, and `exploration.claimed` arrays are normalized against current region IDs. Older saves get empty exploration fields; the current valid region is recorded when play starts. Creatures, inventory, coins, daily cooldown, XP and question history are retained. If a saved position now falls inside a new obstacle, the player safely returns to the original spawn without deleting progression.

Reset progress clears exploration together with the original save fields. Reload preserves gates, discovery rewards, regions and new captured species. The game remains local/offline; this update does not implement student accounts, online reports, or hosting authentication.

## Files and future additions

- `src/data/map.js`: retained base map and IDs.
- `src/data/world-expansion.js`: added regions, water, bridges, gates, scenery, habitats, and derived species locations.
- `src/data/pokemon.js`: forty playable workbook entries and asset paths.
- `data/pokemon-catalog.json`: public reference metadata for all national species.
- `scripts/import-pokemon.py`: offline reproducible workbook importer; requires Python openpyxl only as a development tool.
- Existing world, UI, progression, encounter, asset and battle modules now consume the expanded registries.
- `tests/world-data.test.cjs` and `tests/expansion-playtest.py`: data/provenance, compatibility and actual game-flow checks.

To rebuild the import, provide your own copy of the source workbook:

```sh
python3 scripts/import-pokemon.py path/to/20251206_Pokemon_Database_1.0.xlsx
```

The browser never loads Excel, openpyxl or a remote API. To add a species, register its data and artwork and place its ID in a zone. Habitats and level ranges are derived automatically; collection totals and filters do not require hardcoded updates. Broader Pokémon generation/form support, evolution, full official move sets, authentic animated/back art for imported Pokémon, extra biomes, and mobile controls remain future work.
