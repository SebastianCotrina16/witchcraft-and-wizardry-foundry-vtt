import { WAW } from "../config.mjs";
import { WawActorBase, attributesSchema, conditionsSchema } from "./base-model.mjs";

const fields = foundry.data.fields;

/**
 * Player character: a student at the school.
 *
 * Derived data computes each attribute's effective modifier (`mod`) by applying
 * the -2 penalty of every active paired condition, so sheets and the dice
 * engine can read a single ready-to-use number.
 */
export class WawCharacterData extends WawActorBase {
  static defineSchema() {
    const schema = super.defineSchema();

    schema.attributes = attributesSchema();
    schema.conditions = conditionsSchema();

    schema.details = new fields.SchemaField({
      heritage: new fields.StringField({
        required: true,
        initial: "muggleborn",
        choices: Object.keys(WAW.heritages)
      }),
      house: new fields.StringField({
        required: true,
        initial: "unsorted",
        choices: Object.keys(WAW.houses)
      }),
      year: new fields.NumberField({ required: true, integer: true, initial: 1, min: 1, max: 7 }),
      houseBenefit: new fields.StringField({ required: false, blank: true }),
      // Half-Blood chooses one bonus and one drawback (other heritages are fixed).
      heritageBonus: new fields.StringField({ required: false, blank: true }),
      heritageDrawback: new fields.StringField({ required: false, blank: true }),
      birthday: new fields.StringField({ required: false, blank: true }),
      favoriteClass: new fields.StringField({ required: false, blank: true }),
      electives: new fields.StringField({ required: false, blank: true }),
      looks: new fields.SchemaField({
        body: new fields.StringField({ required: false, blank: true }),
        eyes: new fields.StringField({ required: false, blank: true }),
        face: new fields.StringField({ required: false, blank: true })
      })
    });

    // The base model provides `biography` (used here as free "Notes").
    // `background` is the separate long-form history from the sheet.
    schema.background = new fields.HTMLField({ required: false, blank: true });

    schema.galleons = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 });

    schema.experience = new fields.SchemaField({
      value: new fields.NumberField({
        required: true,
        integer: true,
        initial: 0,
        min: 0,
        max: WAW.experienceBoxes
      })
    });

    // Relationship scores with other PCs/recurring NPCs, kept as a free list.
    schema.relationships = new fields.ArrayField(
      new fields.SchemaField({
        name: new fields.StringField({ required: true, blank: false }),
        score: new fields.NumberField({ required: true, integer: true, initial: 0 })
      })
    );

    return schema;
  }

  prepareDerivedData() {
    const penalty = WAW.conditionPenalty;
    for (const [key, attr] of Object.entries(this.attributes)) {
      const condition = Object.entries(WAW.conditions).find(([, c]) => c.attribute === key)?.[0];
      const penalized = condition && this.conditions[condition];
      attr.mod = attr.value + (penalized ? penalty : 0);
    }

    // Number of conditions currently active; 5 means the character is out.
    this.conditionCount = Object.values(this.conditions).filter(Boolean).length;
    this.isOut = this.conditionCount >= Object.keys(WAW.conditions).length;

    this.rollMods = this.#computeRollMods();
  }

  /**
   * Situational/passive modifiers offered (as opt-in toggles) in the roll dialog:
   * heritage topic forwards and the House +1-Forward benefit if chosen.
   * `attribute` (when set) restricts a modifier to rolls of that attribute.
   */
  #computeRollMods() {
    const mods = [];
    const d = this.details;

    let forwardKeys;
    if (d.heritage === "halfblood") {
      forwardKeys = [d.heritageBonus, d.heritageDrawback].filter(Boolean);
    } else {
      forwardKeys = WAW.heritageForwards[d.heritage] ?? [];
    }
    for (const key of forwardKeys) {
      const value = WAW.heritageForwardValues[key];
      if (value) mods.push({ label: key, value, attribute: null });
    }

    const hb = WAW.houseForwardBenefit[d.house];
    if (hb && d.houseBenefit === hb.key) {
      mods.push({ label: hb.key, value: 1, attribute: hb.attribute });
    }
    return mods;
  }

  /** Roll data exposed to Roll formulas, e.g. `@attributes.body.mod`. */
  getRollData() {
    const data = { ...this };
    data.year = this.details.year;
    return data;
  }
}
