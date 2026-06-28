# Compendium Packs

Foundry v11+ stores compendium packs as compiled **LevelDB** directories. To
keep the data diff-friendly we author it as JSON and compile it with the Foundry
CLI.

```
packs/
├── src/<pack>/          <- generated JSON sources (one file per document)
└── <pack>/              <- compiled LevelDB pack (committed, ready to use)
```

All packs are **already built and declared** in `system.json`, so a fresh clone
works in Foundry with no extra steps.

| Pack | Type | Count | Source data |
| --- | --- | --- | --- |
| `spells` | Item | 176 | `../tools/data/spells.mjs` |
| `moves` | Item | 13 | `../tools/data/moves.mjs` |
| `traits` | Item | 72 | `../tools/data/traits.mjs` |
| `potions` | Item | 16 | `../tools/data/potions.mjs` |
| `houses` | JournalEntry | 4 | `../tools/data/houses.mjs` |

## Pipeline (source of truth → packs)

Edit the data files under `../tools/data/` — **never the generated JSON**.

```bash
npm install          # once: installs @foundryvtt/foundryvtt-cli
npm run build:packs  # tools/data/*.mjs -> packs/src/*/*.json
npm run pack         # packs/src/* -> packs/* (LevelDB)
# or both at once:
npm run build
```

Individual packs can be (re)compiled with `npm run pack:spells`,
`pack:moves`, `pack:traits`, `pack:potions`, `pack:houses`.

To pull edits made inside Foundry back out to source:

```bash
fvtt package unpack <pack> --id witchcraft-and-wizardry --type System --in packs --out packs/src/<pack>
```

### What the generator does

`tools/build-packs.mjs` writes one document per entry with:

- a stable 16-character `_id` and the `_key` the CLI requires
  (`!items!<id>` for item packs, `!journal!<id>` + `!journal.pages!…` for houses);
- an `img` from `config.spellTypeIcons` (spells) or `config.defaultIcons`;
- the subtype's `system` data.

## Translations

Compendium content is translated at runtime by the optional **Babele** module
(not by editing the packs). `npm run build:packs` also emits the Spanish Babele
files into `../lang/babele/es/` from `../tools/data/i18n-es.mjs`. See the main
README's *Internationalization* section.

## Versioned files

The compiled packs' data files (`*.ldb`, `*.log`, `CURRENT`, `MANIFEST-*`) are
committed. Only LevelDB's volatile runtime files (`LOCK`, `LOG`) are
git-ignored. LevelDB may rewrite `MANIFEST`/`CURRENT` when a pack is opened, so
expect occasional churn there — the `*.ldb` data is what matters.
