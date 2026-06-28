# Data Model

How the *Witchcraft and Wizardry* rules map onto Foundry documents. The schemas
themselves live in `module/data/`; this file explains the intent so future
changes stay coherent.

## Actors

### `character` — a student (PC)

| Field | Type | Notes |
| --- | --- | --- |
| `attributes.{body,heart,mind,soul,magic}.value` | int −2…+4 | Base attribute. |
| `attributes.*.mod` | derived | `value` minus −2 for each active paired condition. |
| `conditions.{injured,dazed,upset,exhausted,jinxed}` | bool | Each penalizes one attribute (`injured`→body, `dazed`→mind, `upset`→heart, `exhausted`→soul, `jinxed`→magic). |
| `details.heritage` | enum | muggleborn / halfblood / pureblood. |
| `details.house` | enum | unsorted / gryffindor / hufflepuff / ravenclaw / slytherin. |
| `details.year` | int 1…7 | Gates spell access and the year penalty when casting. |
| `details.houseBenefit` | string | The chosen house benefit. |
| `details.looks.{body,eyes,face}` | string | Descriptive looks. |
| `galleons` | int | Money. |
| `experience.value` | int 0…5 | Experience boxes. |
| `relationships[]` | `{name, score}` | Relationship modifiers with other characters. |
| `biography` | HTML | Free notes. |
| `background` | HTML | Long-form character history. |

Derived: `conditionCount`, `isOut` (all five conditions active).

### `npc` — professors, villains, creatures, students, NPCs

Shares `attributes` + `conditions`, and adds:

| Field | Type | Notes |
| --- | --- | --- |
| `kind` | enum | student / professor / villain / creature / other. |
| `encounter.difficulty` | enum | easy(2) / normal(3) / hard(4) hits to defeat. |
| `encounter.hitsTaken` | int | Derived `hitsToDefeat` and `defeated`. |
| `traits` / `motivation` | string | Free text. |

## Items

Five compendiums ship pre-built: `spells` (176 items), `moves` (13), `traits`
(72), `potions` (16) and `houses` (4 JournalEntries). All are generated from
`tools/data/*.mjs` by `tools/build-packs.mjs` — see
[`../packs/README.md`](../packs/README.md).

| Subtype | Key fields | Purpose |
| --- | --- | --- |
| `spell` | `year`, `spellType`, `inSpellBank`, `isSignature` | A spell list entry. Derived `bankBonus` (+1 banked, +2 signature). |
| `trait` | `kind` (positive/negative), `locked` | Personality trait; order matters for sorting. |
| `wand` | `wood`, `core`, `length`, `flexibility` | Diagon Alley wand. |
| `pet` | `species`, `personality`, `look` | Cat / owl / toad. |
| `equipment` | `quantity`, `price` | Generic goods, priced in galleons. |
| `potion` | `effect`, `quantity`, `price` | A consumable with an effect. |
| `move` | `key`, `attribute`, `results.{success,partial,failure}` | A rollable move — a basic one (by `key`) or a custom NPC/creature move. |

The character sheet is a five-tab ApplicationV2 layout (Stats / Magic / Character
/ Inventory / Story); tabs are wired in `sheets/actor-sheet.mjs#_onRender` and the
active tab is remembered across the re-renders that `submitOnChange` triggers.

## Rolling

`module/helpers/dice.mjs#rollMove()` is the single entry point:

```
total = 2d6 + attribute.mod + situational bonus
10+ → success,  7-9 → partial,  ≤6 → failure
```

`WawActor#castSpell()` layers spell rules on top: it adds the spell's
`bankBonus` and the **year delta** (`casterYear − spellYear`) — i.e. −1 Forward
per year above the caster, +1 per year below.

## Icons

Artwork is **not** bundled — every default references Foundry's built-in
`icons/` library:

- `config.defaultIcons` maps each actor/item subtype to an icon. The document
  classes apply it in `_preCreate` when a new document has no explicit image.
- `config.spellTypeIcons` maps a spell's classification to an icon; the spell
  generator (`tools/build-spells.mjs`) bakes the right one into each compendium
  entry.

Override any of these by setting an explicit `img`, or drop custom art under
`assets/` and point the config at it.

## Extending the system

- **New choice (house, spell type, …):** add a key to the relevant object in
  `config.mjs` and a matching `WAW.*` string in `lang/en.json` / `lang/es.json`.
  Schemas and templates pick it up automatically. For a new `spellType`, also
  add an entry to `config.spellTypeIcons`.
- **New item/actor subtype:** add the data model in `module/data/`, register it
  in `waw.mjs` (`CONFIG.*.dataModels`), declare it under `documentTypes` in
  `system.json`, and add a sheet/partial.
- **New basic move:** add an entry to `WAW.moves`; it appears on the character
  sheet's move grid with no further work.
