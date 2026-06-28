import { WAW } from "../config.mjs";
import { WawActorBase, attributesSchema, conditionsSchema } from "./base-model.mjs";

const fields = foundry.data.fields;

/**
 * Non-player character: professors, villains, creatures, students and everyday
 * folk. NPCs reuse the attribute/condition blocks and add encounter tracking
 * (difficulty -> hits required) plus a free-form list of special moves.
 */
export class WawNpcData extends WawActorBase {
  static defineSchema() {
    const schema = super.defineSchema();

    schema.attributes = attributesSchema();
    schema.conditions = conditionsSchema();

    schema.kind = new fields.StringField({
      required: true,
      initial: "student",
      choices: Object.keys(WAW.npcKinds)
    });

    schema.encounter = new fields.SchemaField({
      difficulty: new fields.StringField({
        required: true,
        initial: "normal",
        choices: Object.keys(WAW.encounterHits)
      }),
      hitsTaken: new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 })
    });

    schema.traits = new fields.StringField({ required: false, blank: true });
    schema.motivation = new fields.StringField({ required: false, blank: true });

    return schema;
  }

  prepareDerivedData() {
    const penalty = WAW.conditionPenalty;
    for (const [key, attr] of Object.entries(this.attributes)) {
      const condition = Object.entries(WAW.conditions).find(([, c]) => c.attribute === key)?.[0];
      const penalized = condition && this.conditions[condition];
      attr.mod = attr.value + (penalized ? penalty : 0);
    }

    this.encounter.hitsToDefeat = WAW.encounterHits[this.encounter.difficulty] ?? 3;
    this.encounter.defeated = this.encounter.hitsTaken >= this.encounter.hitsToDefeat;
  }

  getRollData() {
    return { ...this };
  }
}
