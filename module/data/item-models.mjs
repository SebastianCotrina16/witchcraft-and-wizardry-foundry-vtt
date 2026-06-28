import { WAW } from "../config.mjs";
import { WawItemBase } from "./base-model.mjs";

const fields = foundry.data.fields;

/**
 * Spell — an entry from the spell list, owned by a character.
 * A spell that is in the Spell Bank grants +1 (or +2 if it is the Signature
 * Spell) to the Cast a Spell roll.
 */
export class WawSpellData extends WawItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.year = new fields.NumberField({ required: true, integer: true, initial: 1, min: 1, max: 7 });
    schema.spellType = new fields.StringField({
      required: true,
      initial: "charm",
      choices: Object.keys(WAW.spellTypes)
    });
    schema.inSpellBank = new fields.BooleanField({ initial: false });
    schema.isSignature = new fields.BooleanField({ initial: false });
    return schema;
  }

  /** Forward bonus this spell contributes when cast (bank / signature). */
  prepareDerivedData() {
    this.bankBonus = this.isSignature ? 2 : this.inSpellBank ? 1 : 0;
  }
}

/**
 * Personality Trait — positive or negative. Locked traits cannot be changed by
 * advancement; the order of traits influences the Sorting Hat.
 */
export class WawTraitData extends WawItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.kind = new fields.StringField({
      required: true,
      initial: "positive",
      choices: Object.keys(WAW.traitKinds)
    });
    schema.locked = new fields.BooleanField({ initial: false });
    return schema;
  }
}

/** Wand — wood, core, length and flexibility chosen in Diagon Alley. */
export class WawWandData extends WawItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.wood = new fields.StringField({ required: false, blank: true });
    schema.core = new fields.StringField({ required: false, blank: true });
    schema.length = new fields.NumberField({ required: false, initial: 9, min: 0 });
    schema.flexibility = new fields.StringField({ required: false, blank: true });
    return schema;
  }
}

/** Pet — a cat, owl or toad. */
export class WawPetData extends WawItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.species = new fields.StringField({
      required: true,
      initial: "cat",
      choices: Object.keys(WAW.pets)
    });
    schema.personality = new fields.StringField({ required: false, blank: true });
    schema.look = new fields.StringField({ required: false, blank: true });
    return schema;
  }
}

/** Equipment — generic goods bought in Diagon Alley, priced in galleons. */
export class WawEquipmentData extends WawItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.quantity = new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 });
    schema.price = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 });
    return schema;
  }
}

/** Potion — a consumable with an effect, quantity and price in galleons. */
export class WawPotionData extends WawItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.effect = new fields.StringField({ required: false, blank: true });
    schema.quantity = new fields.NumberField({ required: true, integer: true, initial: 1, min: 0 });
    schema.price = new fields.NumberField({ required: true, integer: true, initial: 0, min: 0 });
    return schema;
  }
}

/**
 * Move — a rollable action. Either references one of the basic moves defined in
 * CONFIG.WAW.moves (set `key`) or defines a custom one (NPC / villain / creature
 * moves) with its own attribute.
 */
export class WawMoveData extends WawItemBase {
  static defineSchema() {
    const schema = super.defineSchema();
    schema.key = new fields.StringField({ required: false, blank: true });
    schema.attribute = new fields.StringField({
      required: false,
      blank: true,
      choices: ["", ...Object.keys(WAW.attributes)]
    });
    schema.results = new fields.SchemaField({
      success: new fields.HTMLField({ required: false, blank: true }),
      partial: new fields.HTMLField({ required: false, blank: true }),
      failure: new fields.HTMLField({ required: false, blank: true })
    });
    return schema;
  }

  /** The attribute actually used: explicit override, else the basic move's. */
  prepareDerivedData() {
    this.rollAttribute = this.attribute || WAW.moves[this.key]?.attribute || null;
  }
}
