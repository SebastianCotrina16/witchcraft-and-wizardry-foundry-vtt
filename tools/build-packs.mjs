/**
 * Generate compendium pack SOURCES for every content pack from the data files
 * in tools/data/. Writes one JSON document per entry under packs/src/<id>/,
 * each with the 16-char `_id` / `_key` the Foundry CLI needs.
 *
 * Item packs : spells, moves, traits, potions
 * Journal    : houses
 *
 * Usage:  node tools/build-packs.mjs
 * Then:   npm run pack         (compiles every packs/src/<id> -> packs/<id>)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WAW } from "../module/config.mjs";
import { SPELLS } from "./data/spells.mjs";
import { MOVES } from "./data/moves.mjs";
import { TRAITS } from "./data/traits.mjs";
import { POTIONS } from "./data/potions.mjs";
import { HOUSES } from "./data/houses.mjs";
import { ES } from "./data/i18n-es.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.resolve(here, "../packs/src");
const babeleRoot = path.resolve(here, "../lang/babele");

/** Render a move's full description (trigger line + result tiers). */
const moveTier = (label, text) => (text ? `<p><strong>${label}:</strong> ${text}</p>` : "");
const moveDescription = (d, s, p, f) =>
  `<p>${d}</p>` + moveTier("10+", s) + moveTier("7-9", p) + moveTier("6-", f);

/** Render a House journal page body from its lore fields (labels localizable). */
const houseContent = (h, lbl = { ghost: "House Ghost", room: "Common Room", choose: "Choose one benefit" }) =>
  `<p><strong>${lbl.ghost}:</strong> ${h.ghost}</p>` +
  `<p><strong>${lbl.room}:</strong> ${h.commonRoom}</p>` +
  `<p><em>${h.entrance}.</em></p>` +
  `<p><strong>${lbl.choose}:</strong></p><ul>${h.benefits.map((b) => `<li>${b}</li>`).join("")}</ul>`;

/** Deterministic, valid 16-char id from a name + index. */
function makeId(name, index) {
  const slug = name.replace(/[^a-zA-Z0-9]/g, "");
  return (slug.slice(0, 11).padEnd(11, "x") + String(index).padStart(5, "0")).slice(0, 16);
}

/** Wipe and recreate a pack source directory, returning its path. */
function freshDir(packId) {
  const dir = path.join(srcRoot, packId);
  fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".json")) fs.rmSync(path.join(dir, f));
  return dir;
}

/** Write an array of documents (already shaped) to a pack source dir. */
function writePack(packId, docs) {
  const dir = freshDir(packId);
  const seen = new Set();
  for (const doc of docs) {
    if (seen.has(doc._id)) throw new Error(`Duplicate id ${doc._id} in ${packId} (${doc.name})`);
    seen.add(doc._id);
    fs.writeFileSync(path.join(dir, `${doc._id}.json`), JSON.stringify(doc, null, 2) + "\n");
  }
  console.log(`  ${packId}: ${docs.length}`);
}

/* -------------------------------------------- */
/*  Document builders                           */
/* -------------------------------------------- */

const itemDoc = (id, name, type, img, system, sort) => ({
  _id: id,
  _key: `!items!${id}`,
  name,
  type,
  img,
  system: { source: "Core Rulebook", ...system },
  effects: [],
  flags: {},
  folder: null,
  sort,
  ownership: { default: 0 }
});

function buildSpells() {
  return SPELLS.map((s, i) =>
    itemDoc(makeId(s.n, i), s.n, "spell", WAW.spellTypeIcons[s.t] ?? WAW.defaultIcons.spell, {
      description: `<p>${s.d}</p>`,
      year: s.y,
      spellType: s.t,
      inSpellBank: false,
      isSignature: false
    }, (i + 1) * 100)
  );
}

function buildMoves() {
  return MOVES.map((m, i) =>
    itemDoc(makeId(m.key, i), labelFor(m.key), "move", WAW.defaultIcons.move, {
      description: moveDescription(m.d, m.s, m.p, m.f),
      key: m.key,
      attribute: m.attr,
      results: { success: m.s, partial: m.p, failure: m.f }
    }, (i + 1) * 100)
  );
}

function buildTraits() {
  const out = [];
  let i = 0;
  for (const [kind, names] of Object.entries(TRAITS)) {
    for (const name of names) {
      out.push(
        itemDoc(makeId(name + kind, i), name, "trait", WAW.defaultIcons.trait, {
          description: "",
          kind,
          locked: false
        }, (i + 1) * 100)
      );
      i++;
    }
  }
  return out;
}

function buildPotions() {
  return POTIONS.map((p, i) =>
    itemDoc(makeId(p.n, i), p.n, "potion", WAW.defaultIcons.potion, {
      description: `<p>${p.d}</p>`,
      effect: p.effect,
      quantity: 1,
      price: p.price
    }, (i + 1) * 100)
  );
}

function buildHouses() {
  return HOUSES.map((h, i) => {
    const id = makeId(h.n, i);
    const pageId = makeId(h.n + "page", i);
    const content = houseContent(h);
    return {
      _id: id,
      _key: `!journal!${id}`,
      name: h.n,
      pages: [
        {
          _id: pageId,
          _key: `!journal.pages!${id}.${pageId}`,
          name: h.n,
          type: "text",
          title: { show: false, level: 1 },
          text: { format: 1, content },
          sort: 0,
          ownership: { default: -1 },
          flags: {}
        }
      ],
      folder: null,
      sort: (i + 1) * 100,
      ownership: { default: 0 },
      flags: {}
    };
  });
}

/* -------------------------------------------- */
/*  Babele translation files                    */
/* -------------------------------------------- */

/** Write one Babele translation file for a language + pack. */
function writeBabele(lang, pack, payload) {
  const dir = path.join(babeleRoot, lang);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${WAW.id}.${pack}.json`);
  fs.writeFileSync(file, JSON.stringify(payload, null, 2) + "\n");
}

/** Build all Spanish Babele translation files from tools/data/i18n-es.mjs. */
function buildBabeleEs() {
  const L = ES.packLabels;

  // Spells — only descriptions need translating (incantations are Latin).
  const spellEntries = {};
  for (const s of SPELLS) {
    const d = ES.spells[s.n];
    if (d) spellEntries[s.n] = { description: `<p>${d}</p>` };
  }
  writeBabele("es", "spells", {
    label: L.spells,
    collection: `${WAW.id}.spells`,
    mapping: { name: "name", description: "system.description" },
    entries: spellEntries
  });

  // Moves — name, description and the three result tiers.
  const moveEntries = {};
  for (const m of MOVES) {
    const t = ES.moves[m.key];
    if (!t) continue;
    moveEntries[labelFor(m.key)] = {
      name: t.n,
      description: moveDescription(t.d, t.s, t.p, t.f),
      success: t.s,
      partial: t.p,
      failure: t.f
    };
  }
  writeBabele("es", "moves", {
    label: L.moves,
    collection: `${WAW.id}.moves`,
    mapping: {
      name: "name",
      description: "system.description",
      success: "system.results.success",
      partial: "system.results.partial",
      failure: "system.results.failure"
    },
    entries: moveEntries
  });

  // Traits — name only.
  const traitEntries = {};
  for (const names of Object.values(TRAITS)) {
    for (const name of names) {
      const es = ES.traits[name];
      if (es) traitEntries[name] = { name: es };
    }
  }
  writeBabele("es", "traits", {
    label: L.traits,
    collection: `${WAW.id}.traits`,
    mapping: { name: "name" },
    entries: traitEntries
  });

  // Potions — name, description and effect.
  const potionEntries = {};
  for (const p of POTIONS) {
    const t = ES.potions[p.n];
    if (t) potionEntries[p.n] = { name: t.n, description: `<p>${t.d}</p>`, effect: t.effect };
  }
  writeBabele("es", "potions", {
    label: L.potions,
    collection: `${WAW.id}.potions`,
    mapping: { name: "name", description: "system.description", effect: "system.effect" },
    entries: potionEntries
  });

  // Houses — JournalEntry with one translated page (default mapping handles pages).
  const houseEntries = {};
  for (const h of HOUSES) {
    const t = ES.houses[h.n];
    if (!t) continue;
    houseEntries[h.n] = {
      name: h.n,
      pages: {
        [h.n]: {
          name: h.n,
          text: houseContent(t, { ghost: "Fantasma de la Casa", room: "Sala Común", choose: "Elige un beneficio" })
        }
      }
    };
  }
  writeBabele("es", "houses", {
    label: L.houses,
    collection: `${WAW.id}.houses`,
    entries: houseEntries
  });

  console.log("  babele/es: spells, moves, traits, potions, houses");
}

/** Resolve a localized-ish English label for a basic move key (build-time only). */
function labelFor(key) {
  // Mirror the human names without loading Foundry's i18n at build time.
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

/* -------------------------------------------- */

function main() {
  console.log("Building pack sources:");
  writePack("spells", buildSpells());
  writePack("moves", buildMoves());
  writePack("traits", buildTraits());
  writePack("potions", buildPotions());
  writePack("houses", buildHouses());
  console.log("Building Babele translation files:");
  buildBabeleEs();
  console.log("Done.");
}

main();
