import { WAW } from "../config.mjs";
import { proseMirrorHTML } from "../helpers/editor.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Base ApplicationV2 actor sheet. Holds the data-action handlers shared by the
 * character and NPC sheets (item CRUD, rolling, condition toggles).
 */
export class WawActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["waw", "sheet", "actor"],
    position: { width: 720, height: 760 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      rollMove: WawActorSheet.#onRollMove,
      useItem: WawActorSheet.#onUseItem,
      createItem: WawActorSheet.#onCreateItem,
      editItem: WawActorSheet.#onEditItem,
      deleteItem: WawActorSheet.#onDeleteItem,
      toggleItemField: WawActorSheet.#onToggleItemField,
      toggleCondition: WawActorSheet.#onToggleCondition,
      setExperience: WawActorSheet.#onSetExperience,
      addRelationship: WawActorSheet.#onAddRelationship,
      deleteRelationship: WawActorSheet.#onDeleteRelationship,
      applyHeritage: WawActorSheet.#onApplyHeritage,
      rollGalleons: WawActorSheet.#onRollGalleons
    }
  };

  /** Remembered active tab, preserved across re-renders. */
  _activeTab = null;

  /** @override Common context shared by all actor sheets. */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.config = WAW;
    context.editable = this.isEditable;
    context.itemsByType = this.#groupItems();
    context.enrichedBiography = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.actor.system.biography ?? "",
      { secrets: this.actor.isOwner, relativeTo: this.actor }
    );
    context.biographyEditor = proseMirrorHTML({
      name: "system.biography",
      value: this.actor.system.biography,
      enriched: context.enrichedBiography,
      editable: this.isEditable,
      document: this.actor
    });
    return context;
  }

  /** Wire up the lightweight tab system after every render. */
  _onRender(context, options) {
    super._onRender?.(context, options);
    this.#wireTabs();
    this.#wireRelationships();
  }

  /**
   * Persist inline relationship edits by rebuilding the whole array from the
   * DOM on change. Doing it explicitly (rather than via named form fields)
   * avoids Foundry's ArrayField mis-handling of indexed form keys.
   */
  #wireRelationships() {
    const root = this.element;
    if (!root) return;
    const inputs = root.querySelectorAll("[data-rel-index]");
    const rebuild = async () => {
      const rows = {};
      for (const el of root.querySelectorAll("[data-rel-index]")) {
        const i = Number(el.dataset.relIndex);
        rows[i] ??= { name: "", score: 0 };
        if (el.dataset.relField === "score") rows[i].score = Number(el.value) || 0;
        else rows[i].name = el.value;
      }
      const arr = Object.keys(rows)
        .sort((a, b) => a - b)
        .map((k) => rows[k]);
      await this.actor.update({ "system.relationships": arr });
    };
    for (const input of inputs) input.addEventListener("change", rebuild);
  }

  /**
   * Plain-DOM tabs: buttons carry `data-tab-target`, panels `data-tab-panel`.
   * The active tab is remembered on the instance so it survives re-renders
   * (which happen on every field change with submitOnChange).
   */
  #wireTabs() {
    const root = this.element;
    if (!root) return;
    const buttons = root.querySelectorAll("[data-tab-target]");
    if (!buttons.length) return;

    const activate = (name) => {
      this._activeTab = name;
      for (const b of root.querySelectorAll("[data-tab-target]")) {
        b.classList.toggle("active", b.dataset.tabTarget === name);
      }
      for (const p of root.querySelectorAll("[data-tab-panel]")) {
        p.classList.toggle("active", p.dataset.tabPanel === name);
      }
    };

    for (const b of buttons) {
      b.addEventListener("click", () => activate(b.dataset.tabTarget));
    }
    activate(this._activeTab ?? buttons[0].dataset.tabTarget);
  }

  /** Group owned items by type for templating. */
  #groupItems() {
    const groups = {};
    for (const item of this.actor.items) {
      (groups[item.type] ??= []).push(item);
    }
    for (const list of Object.values(groups)) list.sort((a, b) => a.name.localeCompare(b.name));
    return groups;
  }

  /* ---------------------------------- */
  /*  Action handlers                   */
  /* ---------------------------------- */

  static async #onRollMove(event, target) {
    await this.actor.rollMove(target.dataset.move, { fast: event.shiftKey });
  }

  static async #onUseItem(event, target) {
    const item = this.#itemFromTarget(target);
    await item?.use({ fast: event.shiftKey });
  }

  static async #onCreateItem(event, target) {
    const type = target.dataset.type;
    const name = Item.implementation.defaultName({ type, parent: this.actor });
    await this.actor.createEmbeddedDocuments("Item", [{ name, type }]);
  }

  static async #onEditItem(event, target) {
    this.#itemFromTarget(target)?.sheet.render(true);
  }

  /** Flip a boolean field on an owned item (e.g. spell-bank star, trait lock). */
  static async #onToggleItemField(event, target) {
    const item = this.#itemFromTarget(target);
    const field = target.dataset.field;
    if (item && field) await item.update({ [field]: !foundry.utils.getProperty(item, field) });
  }

  static async #onDeleteItem(event, target) {
    await this.#itemFromTarget(target)?.delete();
  }

  static async #onToggleCondition(event, target) {
    await this.actor.toggleCondition(target.dataset.condition);
  }

  static async #onSetExperience(event, target) {
    const value = Number(target.dataset.value);
    const current = this.actor.system.experience?.value ?? 0;
    // Clicking the highest filled pip clears it; otherwise fill up to the pip.
    const next = value === current ? value - 1 : value;
    await this.actor.update({ "system.experience.value": Math.max(0, next) });
  }

  /** Apply the selected heritage's base attribute spread and roll starting galleons. */
  static async #onApplyHeritage() {
    const heritage = this.actor.system.details?.heritage;
    const data = WAW.heritageData[heritage];
    if (!data) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: game.i18n.localize("WAW.Action.ApplyHeritage") },
      content: `<p>${game.i18n.localize("WAW.Dialog.ApplyHeritage")}</p>`
    });
    if (!confirmed) return;

    const update = {};
    for (const [key, value] of Object.entries(data.attributes)) {
      update[`system.attributes.${key}.value`] = value;
    }
    const roll = await new Roll(data.galleons).evaluate();
    update["system.galleons"] = roll.total;
    await this.actor.update(update);
    ui.notifications?.info(
      game.i18n.format("WAW.Notify.HeritageApplied", { galleons: roll.total })
    );
  }

  /** Re-roll starting galleons for the current heritage. */
  static async #onRollGalleons() {
    const data = WAW.heritageData[this.actor.system.details?.heritage];
    if (!data) return;
    const roll = await new Roll(data.galleons).evaluate();
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: game.i18n.localize("WAW.Field.Galleons")
    });
    await this.actor.update({ "system.galleons": roll.total });
  }

  static async #onAddRelationship() {
    const rels = foundry.utils.deepClone(this.actor.system.relationships ?? []);
    rels.push({ name: "", score: 0 });
    await this.actor.update({ "system.relationships": rels });
  }

  static async #onDeleteRelationship(event, target) {
    const index = Number(target.dataset.index);
    const rels = foundry.utils.deepClone(this.actor.system.relationships ?? []);
    rels.splice(index, 1);
    await this.actor.update({ "system.relationships": rels });
  }

  /** Resolve the owned Item for an element carrying `data-item-id`. */
  #itemFromTarget(target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    return this.actor.items.get(id);
  }
}
