# Witchcraft and Wizardry — Foundry VTT System

An **unofficial, fan-made** game system for [Foundry Virtual Tabletop](https://foundryvtt.com)
implementing the *Witchcraft and Wizardry* tabletop RPG — a **Powered by the
Apocalypse (PbtA)** game of students learning magic at a school of witchcraft
and wizardry.

> ⚠️ **Fan project / private use only.** *Witchcraft and Wizardry* and its
> setting derive from J.K. Rowling's Wizarding World; all trademarks and
> copyrights belong to their owners. The bundled spell descriptions are
> transcribed from the community Core Rulebook (v1.4) for **private,
> non-commercial play**, in the same spirit as that rulebook. Do not sell or
> redistribute for gain. See [`LICENSE`](LICENSE). All artwork uses Foundry's
> built-in `icons/` library — no third-party art is redistributed here.

- **Foundry compatibility:** v13 minimum, verified on **v14**
- **System id:** `witchcraft-and-wizardry`
- **Status:** `0.1.0` — foundation + complete spell compendium

---

## The game in one screen

Every action is a **Move**: roll `2d6 + attribute`. **10+** = success,
**7–9** = partial success, **6 or less** = failure.

| Concept | What it is |
| --- | --- |
| **Attributes** | Body, Heart, Mind, Soul, Magic (−2…+4), plus situational Relationship |
| **Conditions** | Injured / Dazed / Upset / Exhausted / Jinxed — each −2 to a paired attribute; all five = passed out |
| **Moves** | 13 basic moves (e.g. *Investigate*, *Cast a Spell*) keyed to an attribute |
| **Spells** | Listed by year (1–7) and classification; spells in your **Spell Bank** add +1 (Signature +2) |
| **Heritage / House** | Muggle-born / Half-blood / Pureblood; sorted into one of four houses |
| **Experience** | 5 boxes; spend to grow your character |

A deeper map of how these become Foundry documents lives in
[`docs/DATA_MODEL.md`](docs/DATA_MODEL.md).

---

## Project structure

```
witchcraft-and-wizardry-foundry-vtt/
├── system.json              # Manifest (subtypes, compatibility, assets)
├── module/
│   ├── waw.mjs              # Entry point — registers everything on `init`
│   ├── config.mjs           # CONFIG.WAW: attributes, conditions, moves, …
│   ├── helpers/
│   │   ├── dice.mjs         # PbtA 2d6 roll engine
│   │   └── handlebars.mjs   # Handlebars helpers + template preload
│   ├── data/                # TypeDataModel schemas (the source of truth)
│   │   ├── base-model.mjs
│   │   ├── actor-character.mjs
│   │   ├── actor-npc.mjs
│   │   └── item-models.mjs
│   ├── documents/           # Actor/Item document subclasses (behaviour)
│   │   ├── actor.mjs
│   │   └── item.mjs
│   ├── sheets/              # ApplicationV2 sheets
│   │   ├── actor-sheet.mjs  # shared base
│   │   ├── character-sheet.mjs
│   │   ├── npc-sheet.mjs
│   │   └── item-sheet.mjs
│   └── apps/
│       └── creation-wizard.mjs  # guided character-creation wizard
├── templates/               # Handlebars templates + partials
├── styles/waw.css           # Namespaced styles
├── lang/
│   ├── {en,es}.json         # UI localization
│   └── babele/es/           # Compendium-content translations (via Babele)
├── tools/                   # Build tooling
│   ├── data/                # Authoritative content + i18n-es.mjs translations
│   └── build-packs.mjs      # Generates packs/src/* and lang/babele/* from data
├── packs/
│   ├── src/<pack>/          # Generated pack sources (one JSON per document)
│   └── <pack>/              # Compiled LevelDB compendiums (committed, ready to use)
└── docs/DATA_MODEL.md       # Design notes
```

### Architecture choices

This system targets the **modern v13/v14 API** rather than the legacy one:

- **DataModels** (`foundry.abstract.TypeDataModel`) define every subtype's
  schema in code — there is **no `template.json`**. Subtypes are declared in
  `system.json` under `documentTypes` and bound in `waw.mjs`.
- **ApplicationV2** sheets (`ActorSheetV2` / `ItemSheetV2` +
  `HandlebarsApplicationMixin`) with declarative `actions` instead of jQuery
  event wiring.
- **ESM only** (`.mjs`), no build step required to run the system itself.
- Config-driven: attributes, conditions, moves and choices live in
  `config.mjs`, so adding content rarely means touching the templates.
- **Icons** come from Foundry's built-in `icons/` library, mapped per subtype
  and per spell classification in `config.mjs` (`defaultIcons` /
  `spellTypeIcons`). New documents get a fitting icon automatically via the
  documents' `_preCreate`. Drop custom art in `assets/` to override.

### Content compendiums

Five compiled compendiums ship with the system (declared in `system.json`,
grouped under one folder). Each is generated from a single source-of-truth data
file under `tools/data/` by `tools/build-packs.mjs`:

| Pack | Type | Count | Source |
| --- | --- | --- | --- |
| Spells | Item | 176 | `tools/data/spells.mjs` |
| Moves | Item | 13 | `tools/data/moves.mjs` |
| Personality Traits | Item | 72 | `tools/data/traits.mjs` |
| Potions | Item | 16 | `tools/data/potions.mjs` |
| The Four Houses | JournalEntry | 4 | `tools/data/houses.mjs` |

Edit a data file and run `npm run build` to regenerate the sources and recompile
every pack. Spells are iconed by classification; all other defaults come from
`config.defaultIcons`.

### Internationalization

The **UI** (sheets, dialogs, labels) auto-translates via `lang/en.json` /
`lang/es.json`. **Compendium content** (the data inside packs) cannot be
translated by core Foundry, so the system integrates the optional
[**Babele**](https://foundryvtt.com/packages/babele) module: if it is installed,
`module/waw.mjs` registers our system-hosted translation files at
`lang/babele/<lang>/witchcraft-and-wizardry.<pack>.json` and the content switches
to the client's language automatically (Spanish is bundled; spell incantations
stay Latin). Babele is declared as a *recommended* relationship in the manifest.

The translation files are generated by the same pipeline: Spanish strings live in
[`tools/data/i18n-es.mjs`](tools/data/i18n-es.mjs) and `npm run build:packs`
emits the Babele JSON. Without Babele installed, content simply stays in English.

---

## Installation (development)

Foundry loads systems from `{userdata}/Data/systems/<id>/`, and that folder name
**must equal the system id**. Clone this repo and link it in:

```bash
# Windows (PowerShell, as Administrator)
New-Item -ItemType SymbolicLink `
  -Path "$env:LOCALAPPDATA\FoundryVTT\Data\systems\witchcraft-and-wizardry" `
  -Target "F:\FoundrySystems\witchcraft-and-wizardry-foundry-vtt"
```

```bash
# Linux / macOS
ln -s /path/to/witchcraft-and-wizardry-foundry-vtt \
      ~/.local/share/FoundryVTT/Data/systems/witchcraft-and-wizardry
```

Then launch Foundry, create a world using **Witchcraft and Wizardry**, and the
system will hot-reload CSS / templates / lang while you work.

## Development

```bash
npm install          # dev tooling (Foundry CLI, eslint, prettier)
npm run format       # prettier
npm run lint         # eslint
npm run build:spells # regenerate packs/src/spells from tools/data/spells.mjs
npm run pack         # compile packs/src/spells -> LevelDB (packs/spells)
npm run build        # build:spells + pack in one step
```

See [`packs/README.md`](packs/README.md) for the compendium pipeline in detail.

## Roadmap

- [x] Full spell list (years 1–7) as a compiled compendium
- [x] Per-subtype / per-classification default icons
- [x] Compendium packs for Moves, Traits, Potions and Houses
- [x] Spanish translations of compendium content (via Babele)
- [x] Tabbed character sheet (attributes / spells / background)
- [x] Relationship management UI
- [x] House-benefit and heritage automation (apply base spread, roll galleons)
- [x] Full guided character-creation wizard (9 steps, wand from birthday, compendium picks)
- [x] Interactive rolls (modifier dialog, passive toggles, breakdown, reroll)
- [ ] Active Effects / token status icons for conditions

## License

Source code: [MIT](LICENSE). Game setting and the transcribed spell text are the
property of their respective owners and are included only for private,
non-commercial use.
