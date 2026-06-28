import { WAW } from "../config.mjs";
import { WawActorSheet } from "./actor-sheet.mjs";

/** NPC sheet (professors, villains, creatures, students). */
export class WawNpcSheet extends WawActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["waw", "sheet", "actor", "npc"],
    position: { width: 680, height: 640 }
  };

  static PARTS = {
    main: { template: `${WAW.path}/templates/actor/npc-sheet.hbs`, scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.moves = WAW.moves;
    return context;
  }
}
