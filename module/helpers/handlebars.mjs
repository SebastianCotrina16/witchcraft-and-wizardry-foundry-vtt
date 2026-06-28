import { WAW } from "../config.mjs";

/**
 * Register Handlebars helpers and preload the system's templates / partials.
 * Called once during the `init` hook.
 */
export function registerHandlebars() {
  /** Format a signed integer, e.g. 2 -> "+2", -1 -> "-1", 0 -> "+0". */
  Handlebars.registerHelper("wawSigned", (value) => {
    const n = Number(value) || 0;
    return n >= 0 ? `+${n}` : `${n}`;
  });

  /** Localize a key from a CONFIG.WAW choices object (value can be string or {label}). */
  Handlebars.registerHelper("wawLabel", (choice) => {
    if (!choice) return "";
    const key = typeof choice === "string" ? choice : choice.label;
    return game.i18n.localize(key);
  });

  /** Simple equality check usable in {{#if}}. */
  Handlebars.registerHelper("wawEq", (a, b) => a === b);

  /** Concatenate all positional arguments into one string (drops the options arg). */
  Handlebars.registerHelper("wawConcat", (...args) => {
    args.pop();
    return args.join("");
  });

  /** Logical OR over any number of arguments (drops the options arg). */
  Handlebars.registerHelper("wawOr", (...args) => {
    args.pop();
    return args.some(Boolean);
  });

  /** Numeric less-than, for {{#if}} comparisons. */
  Handlebars.registerHelper("wawLt", (a, b) => Number(a) < Number(b));

  /** Integer addition. */
  Handlebars.registerHelper("wawAdd", (a, b) => Number(a) + Number(b));

  /** Produce an array [0, 1, …, n-1] for fixed-length iteration (pips, etc.). */
  Handlebars.registerHelper("wawRange", (n) => Array.from({ length: Number(n) || 0 }, (_, i) => i));

  /** Capitalize the first letter of a string. */
  Handlebars.registerHelper("wawCapitalize", (s) => {
    s = String(s ?? "");
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  return foundry.applications.handlebars.loadTemplates([
    // Reusable actor partials
    `${WAW.path}/templates/actor/parts/attributes.hbs`,
    `${WAW.path}/templates/actor/parts/conditions.hbs`,
    `${WAW.path}/templates/actor/parts/items-list.hbs`,
    `${WAW.path}/templates/actor/parts/spell-row.hbs`,
    `${WAW.path}/templates/actor/parts/trait-row.hbs`,
    // Item body partials (selected dynamically by item subtype)
    `${WAW.path}/templates/item/parts/spell.hbs`,
    `${WAW.path}/templates/item/parts/trait.hbs`,
    `${WAW.path}/templates/item/parts/wand.hbs`,
    `${WAW.path}/templates/item/parts/pet.hbs`,
    `${WAW.path}/templates/item/parts/equipment.hbs`,
    `${WAW.path}/templates/item/parts/potion.hbs`,
    `${WAW.path}/templates/item/parts/move.hbs`
  ]);
}
