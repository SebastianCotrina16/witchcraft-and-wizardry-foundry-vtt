/**
 * Shared schema fragments and the system's data-model base classes.
 *
 * Every actor/item subtype extends one of these so that common fields
 * (description, attributes, ...) are defined exactly once.
 */
import { WAW } from "../config.mjs";

const fields = foundry.data.fields;

/** Base class for all of the system's actor data models. */
export class WawActorBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      biography: new fields.HTMLField({ required: false, blank: true })
    };
  }
}

/** Base class for all of the system's item data models. */
export class WawItemBase extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      description: new fields.HTMLField({ required: false, blank: true }),
      source: new fields.StringField({ required: false, blank: true })
    };
  }
}

/**
 * A single attribute value, clamped to the system's legal range.
 * `mod` is derived in the actor model (value minus active condition penalties).
 */
export function attributeField() {
  return new fields.SchemaField({
    value: new fields.NumberField({
      required: true,
      integer: true,
      initial: 0,
      min: WAW.attributeRange.min,
      max: WAW.attributeRange.max
    })
  });
}

/** Build the {body, heart, mind, soul, magic} attribute block. */
export function attributesSchema() {
  const schema = {};
  for (const key of Object.keys(WAW.attributes)) schema[key] = attributeField();
  return new fields.SchemaField(schema);
}

/** Build the boolean condition block (injured, dazed, ...). */
export function conditionsSchema() {
  const schema = {};
  for (const key of Object.keys(WAW.conditions)) {
    schema[key] = new fields.BooleanField({ initial: false });
  }
  return new fields.SchemaField(schema);
}
