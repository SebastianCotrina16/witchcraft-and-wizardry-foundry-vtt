import { WAW } from "../config.mjs";
import { WawActorSheet } from "./actor-sheet.mjs";
import { proseMirrorHTML } from "../helpers/editor.mjs";
import { WawCreationWizard } from "../apps/creation-wizard.mjs";

/** Character (student) sheet. */
export class WawCharacterSheet extends WawActorSheet {
  static DEFAULT_OPTIONS = {
    classes: ["waw", "sheet", "actor", "character"],
    position: { width: 760, height: 820 },
    actions: {
      openWizard: WawCharacterSheet.#onOpenWizard
    }
  };

  /** Launch the guided character-creation wizard for this actor. */
  static #onOpenWizard() {
    new WawCreationWizard(this.actor).render(true);
  }

  static PARTS = {
    main: { template: `${WAW.path}/templates/actor/character-sheet.hbs`, scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.moves = WAW.moves;

    const spells = context.itemsByType.spell ?? [];
    context.spellBank = spells.filter((s) => s.system.inSpellBank || s.system.isSignature);
    context.otherSpells = spells.filter((s) => !s.system.inSpellBank && !s.system.isSignature);
    context.signatureSpell = spells.find((s) => s.system.isSignature) ?? null;

    context.enrichedBackground = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.actor.system.background ?? "",
      { secrets: this.actor.isOwner, relativeTo: this.actor }
    );
    context.backgroundEditor = proseMirrorHTML({
      name: "system.background",
      value: this.actor.system.background,
      enriched: context.enrichedBackground,
      editable: this.isEditable,
      document: this.actor
    });

    // House benefit options (localization keys) for the currently selected house.
    context.houseBenefits = WAW.houseBenefits[this.actor.system.details.house] ?? [];

    // Heritage info for the guided-creation card.
    const heritage = this.actor.system.details.heritage;
    const hd = WAW.heritageData[heritage];
    context.heritageInfo = hd
      ? {
          attributes: hd.attributes,
          galleons: hd.galleons,
          bonus: hd.bonus,
          drawback: hd.drawback
        }
      : null;

    return context;
  }
}
