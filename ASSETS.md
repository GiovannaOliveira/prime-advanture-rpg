# Asset sources

The user supplied `graphics.zip` and `MPWSP01.zip` and authorized their use in this prototype. Both archives included a commission information file identifying the artist as **scarloxy**. No license text was bundled with these uploads; no new license or ownership claim is assigned to these third-party files here.

Assets were copied from those packs into predictable project paths. The original pack artwork was not sourced from external image search, a CDN, or an image-generation service. The later user-authorized Pokémon addition is sourced separately from the supplied workbook, as detailed below. Game-specific creature names describe the reused artwork; they do not claim ownership of the original images.

| Project asset | Source |
| --- | --- |
| `characters/player.png` | `graphics/characters/player.png` |
| `characters/professor.png` | `graphics/characters/blond.png` |
| `characters/merchant.png` | `graphics/characters/hat_girl.png` |
| `characters/healer.png` | `graphics/characters/purple_girl.png` |
| `creatures/leaflet*` | MPWSP01 `sprite1`, idle, attack, menu sprite |
| `creatures/emberbun*` | MPWSP01 `sprite7`, idle, attack, menu sprite |
| `creatures/ripple*` | MPWSP01 `sprite12`, idle, attack, menu sprite |
| `creatures/pebblit*` | MPWSP01 `sprite4`, idle, attack, menu sprite |
| `creatures/skydot*` | MPWSP01 `sprite5`, idle, attack, menu sprite |
| `creatures/frosthart*` | MPWSP01 `sprite6`, idle, attack, menu sprite |
| `creatures/buddy.png` | MPWSP01 `menu sprites/menusprite15.png` |
| `world/tileset.png` | MPWSP01 `tileset/tileset.png` |
| Other `world/*.png` | Matching filenames under `graphics/objects/` |
| `backgrounds/meadow.png` | MPWSP01 `backgrounds/background1.png` |
| `effects/fire.png` | MPWSP01 `attack effects/attack5.png` |
| `effects/leaf.png` | MPWSP01 `attack effects/attack6.png` |
| `effects/water.png` | MPWSP01 `attack effects/attack3.png` |
| `effects/ice.png` | MPWSP01 `attack effects/attack1.png` |
| `fonts/pixel.otf` | `graphics/fonts/dogicapixel.otf` |

Human sheets: 4 columns × 4 rows, source frames 128 × 128. The rows are down, left, right, up. Creature base sheets: two 96 × 96 frames (front/back). Idle and attack sheets: four 96 × 96 frames. Effect sheets: four 96 × 96 frames. Menu icons: 32 × 32. The original source sheets are retained, not destructively resized.

The world renderer adds original procedural water, coastline shapes, bridges, simple paths, flowers, chest, signposts, beach umbrella/chair, bench, and docked boat. The logo mark and compact UI icons use text, CSS, and inline SVG. Font fallback is provided for legible essential text.

## Expansion pack artwork

| Species | MPWSP01 sprite number (base, idle, attack, menu icon) |
| --- | --- |
| Thornpounce | 2 |
| Groveguard | 3 |
| Cinderstride | 8 |
| Ashwarden | 9 |
| Dreamtap | 10 |
| Gloomcoil | 11 |
| Tideglide | 13 |
| Abyssong | 14 |
| Budbit | 15 |
| Lumenwing | 16 |

Additional world assets retain their source filenames from `graphics/objects/`: `ice_tree`, `teal_tree`, `teal_tree_small`, `icerock1`, `ruin_gate`, `ruin_pillar`, `ruin_pillar_broke`, and `house_small_alt`. `backgrounds/snow.png` and `coast.png` are MPWSP01 backgrounds 2 and 3. `effects/magic.png` and `shadow.png` are attack effects 2 and 7. New crystal formations, pools, lava, walls, trails, discovery posts and thematic cave/Ember battle backdrops are procedural Canvas/CSS art, not generated-image-service outputs.

## User-supplied Pokémon workbook

The user uploaded `20251206_Pokemon_Database_1.0.xlsx` and expressly chose to add official Pokémon names and images. Forty Gen I portraits were extracted from embedded PNG media using the workbook's DISPIMG relationships. `src/data/pokemon.js` includes each selected national ID and original PNG hash. Those images are unmodified file bytes; display scaling/mirroring occurs only at render time. Static front portraits are not represented as animated or authentic back sprites.

Pokémon names and artwork belong to their respective rights holders and are not original Prime Academy designs. This project does not claim ownership of them. The underlying workbook and its personal collection/trainer/storage fields are not included. Only public species metadata is retained in `data/pokemon-catalog.json`, along with source checksum/counts. The supplied visual map references are not bundled or rendered as backgrounds. GO Hub was not used as a scraped source because access was blocked by the execution network.
