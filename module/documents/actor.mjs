import { rollMove } from "../helpers/dice.mjs";
import { WAW } from "../config.mjs";

/**
 * System Actor document. Most data work happens in the data models; this class
 * adds convenience accessors and roll entry points used by sheets and macros.
 */
export class WawActor extends Actor {
  /** Owned items grouped by type, e.g. `this.itemTypes.spell`. (Foundry built-in) */

  /** Assign a subtype-appropriate default portrait on creation. */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (data.img === undefined && WAW.defaultIcons[this.type]) {
      this.updateSource({ img: WAW.defaultIcons[this.type] });
    }
  }

  /** Roll one of the basic Moves by its CONFIG key. */
  async rollMove(moveKey, { bonus = 0, fast = false } = {}) {
    const move = WAW.moves[moveKey];
    if (!move) return null;
    return rollMove({
      actor: this,
      attribute: move.attribute,
      label: game.i18n.localize(move.label),
      bonus,
      fast
    });
  }

  /**
   * Cast a spell Item. The bank/signature bonus and the year penalty (-1 Forward
   * per year above the caster, +1 per year below) are applied automatically and
   * shown in the roll breakdown.
   */
  async castSpell(spell, { bonus = 0, fast = false } = {}) {
    if (spell?.type !== "spell") return null;
    const casterYear = this.system.details?.year ?? 1;
    const yearDelta = casterYear - spell.system.year; // positive = below caster's year
    const bank = spell.system.bankBonus ?? 0;

    const extraParts = [];
    if (bank) {
      const key = spell.system.isSignature ? "WAW.Field.Signature" : "WAW.Field.InSpellBank";
      extraParts.push({ label: game.i18n.localize(key), value: bank });
    }
    if (yearDelta) extraParts.push({ label: game.i18n.localize("WAW.Field.Year"), value: yearDelta });

    return rollMove({
      actor: this,
      attribute: "magic",
      label: `${game.i18n.localize(WAW.moves.castASpell.label)}: ${spell.name}`,
      flavor: spell.system.description ?? "",
      bonus,
      fast,
      extraParts
    });
  }

  /** Toggle a health condition on/off. */
  async toggleCondition(key, active) {
    if (!(key in WAW.conditions)) return this;
    const value = active ?? !this.system.conditions[key];
    return this.update({ [`system.conditions.${key}`]: value });
  }
}
