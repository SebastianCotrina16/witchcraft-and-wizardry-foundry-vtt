import { WAW } from "../config.mjs";
import { proseMirrorHTML } from "../helpers/editor.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Single ApplicationV2 item sheet that adapts to the item subtype by swapping
 * the body partial. Keeps one class while staying extensible per type.
 */
export class WawItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["waw", "sheet", "item"],
    position: { width: 520, height: 480 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false }
  };

  static PARTS = {
    main: { template: `${WAW.path}/templates/item/item-sheet.hbs`, scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.config = WAW;
    context.editable = this.isEditable;
    // Per-type body partial, e.g. templates/item/parts/spell.hbs
    context.bodyPartial = `${WAW.path}/templates/item/parts/${this.item.type}.hbs`;
    context.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.item.system.description ?? "",
      { secrets: this.item.isOwner, relativeTo: this.item }
    );
    context.descriptionEditor = proseMirrorHTML({
      name: "system.description",
      value: this.item.system.description,
      enriched: context.enrichedDescription,
      editable: this.isEditable,
      document: this.item
    });
    return context;
  }
}
