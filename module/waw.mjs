/**
 * Witchcraft and Wizardry — Foundry VTT system entry point.
 *
 * Registers configuration, data models, document classes and sheets during the
 * `init` hook. The actual game logic lives in the imported modules; this file
 * is only the wiring.
 */
import { WAW } from "./config.mjs";
import { registerHandlebars } from "./helpers/handlebars.mjs";
import { rollMove, rerollMessage } from "./helpers/dice.mjs";

import { WawCharacterData } from "./data/actor-character.mjs";
import { WawNpcData } from "./data/actor-npc.mjs";
import {
  WawSpellData,
  WawTraitData,
  WawWandData,
  WawPetData,
  WawEquipmentData,
  WawPotionData,
  WawMoveData
} from "./data/item-models.mjs";

import { WawActor } from "./documents/actor.mjs";
import { WawItem } from "./documents/item.mjs";

import { WawCharacterSheet } from "./sheets/character-sheet.mjs";
import { WawNpcSheet } from "./sheets/npc-sheet.mjs";
import { WawItemSheet } from "./sheets/item-sheet.mjs";

Hooks.once("init", function () {
  console.log(`${WAW.id} | Initializing Witchcraft and Wizardry`);

  // Expose config & a small API for macros/modules.
  CONFIG.WAW = WAW;
  game.waw = { rollMove, config: WAW };

  // Document classes.
  CONFIG.Actor.documentClass = WawActor;
  CONFIG.Item.documentClass = WawItem;

  // Data models (schema per subtype, declared in system.json `documentTypes`).
  Object.assign(CONFIG.Actor.dataModels, {
    character: WawCharacterData,
    npc: WawNpcData
  });
  Object.assign(CONFIG.Item.dataModels, {
    spell: WawSpellData,
    trait: WawTraitData,
    wand: WawWandData,
    pet: WawPetData,
    equipment: WawEquipmentData,
    potion: WawPotionData,
    move: WawMoveData
  });

  // Sheets (ApplicationV2). Unregister core defaults, register ours.
  const Actors = foundry.documents.collections.Actors;
  const Items = foundry.documents.collections.Items;

  // Guarded: unregistering a class that isn't the registered default throws,
  // which would abort system init — never let that happen.
  const safeUnregister = (collection, cls) => {
    try {
      collection.unregisterSheet("core", cls);
    } catch (err) {
      console.warn(`${WAW.id} | Could not unregister core sheet:`, err);
    }
  };

  safeUnregister(Actors, foundry.applications.sheets.ActorSheetV2);
  Actors.registerSheet(WAW.id, WawCharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "WAW.Sheet.Character"
  });
  Actors.registerSheet(WAW.id, WawNpcSheet, {
    types: ["npc"],
    makeDefault: true,
    label: "WAW.Sheet.Npc"
  });

  safeUnregister(Items, foundry.applications.sheets.ItemSheetV2);
  Items.registerSheet(WAW.id, WawItemSheet, {
    types: ["spell", "trait", "wand", "pet", "equipment", "potion", "move"],
    makeDefault: true,
    label: "WAW.Sheet.Item"
  });

  return registerHandlebars();
});

// Optional integration with the Babele module: if it's installed, register our
// system-hosted translation files so compendium content (spells, moves, …) is
// shown in the client's language automatically. Files live in
// `lang/babele/<lang>/witchcraft-and-wizardry.<pack>.json`.
Hooks.once("babele.init", (babele) => {
  console.log(`${WAW.id} | Babele detected — registering compendium translations`);
  babele.setSystemTranslationsDir("lang/babele");
});

// Wire the Reroll button on roll cards in chat.
Hooks.on("renderChatMessageHTML", (message, html) => {
  const button = html.querySelector?.("[data-action='waw-reroll']");
  if (!button) return;
  button.addEventListener("click", () => rerollMessage(message));
});

Hooks.once("ready", function () {
  console.log(`${WAW.id} | Witchcraft and Wizardry ready`);
});
