import { WAW } from "../config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Guided character-creation wizard.
 *
 * A multi-step ApplicationV2 that walks through the rulebook's creation steps and
 * applies the result to a `character` actor only on the final step. Nothing is
 * written to the actor until the player presses Finish, so it is non-destructive
 * while in progress. Choices are kept in `this.data` and persist across steps.
 */
export class WawCreationWizard extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, options = {}) {
    super(options);
    this.actor = actor;
    this.step = 0;
    this.data = this.#seed();
  }

  static STEPS = ["identity", "attributes", "house", "traits", "looks", "wand", "pet", "background", "spells", "summary"];

  static DEFAULT_OPTIONS = {
    id: "waw-creation-wizard",
    classes: ["waw", "waw-wizard"],
    tag: "form",
    position: { width: 640, height: 700 },
    window: { title: "WAW.Wizard.Title", icon: "fa-solid fa-hat-wizard", resizable: true },
    actions: {
      wizardNext: WawCreationWizard.#onNext,
      wizardBack: WawCreationWizard.#onBack,
      wizardFinish: WawCreationWizard.#onFinish,
      wizardGoto: WawCreationWizard.#onGoto,
      wizardApplyHeritage: WawCreationWizard.#onApplyHeritageBase,
      wizardRollGalleons: WawCreationWizard.#onRollGalleons,
      wizardRollCore: WawCreationWizard.#onRollCore,
      wizardRollLength: WawCreationWizard.#onRollLength
    }
  };

  static PARTS = {
    body: { template: `${WAW.path}/templates/apps/creation-wizard.hbs`, scrollable: [".waw-wizard-body"] }
  };

  /** Initial wizard state, pre-filled from the actor where sensible. */
  #seed() {
    const s = this.actor.system;
    const attrs = {};
    for (const key of Object.keys(WAW.attributes)) attrs[key] = s.attributes[key]?.value ?? 0;
    return {
      name: this.actor.name === "Actor" ? "" : this.actor.name,
      heritage: s.details.heritage ?? "muggleborn",
      birthMonth: 1,
      birthDay: 1,
      attributes: attrs,
      galleons: s.galleons ?? 0,
      house: s.details.house ?? "unsorted",
      houseBenefit: s.details.houseBenefit ?? "",
      heritageBonus: s.details.heritageBonus ?? "",
      heritageDrawback: s.details.heritageDrawback ?? "",
      looks: { body: s.details.looks?.body ?? "", eyes: s.details.looks?.eyes ?? "", face: s.details.looks?.face ?? "" },
      wand: { wood: "", core: "", length: 9, flexibility: "" },
      pet: { species: "cat", name: "", personality: "", look: "" },
      background: s.background ?? "",
      traitIds: [],
      spellIds: []
    };
  }

  get stepName() {
    return WawCreationWizard.STEPS[this.step];
  }

  /* -------------------------------------------- */
  /*  Context                                     */
  /* -------------------------------------------- */

  async _prepareContext() {
    const context = {
      config: WAW,
      data: this.data,
      step: this.stepName,
      stepIndex: this.step,
      stepCount: WawCreationWizard.STEPS.length,
      steps: WawCreationWizard.STEPS,
      isFirst: this.step === 0,
      isLast: this.step === WawCreationWizard.STEPS.length - 1,
      days: Array.from({ length: 31 }, (_, i) => i + 1)
    };

    if (this.stepName === "attributes") {
      context.heritageInfo = WAW.heritageData[this.data.heritage] ?? null;
      context.attrTotal = Object.values(this.data.attributes).reduce((a, b) => a + Number(b), 0);
    }
    if (this.stepName === "house") {
      context.houseBenefits = WAW.houseBenefits[this.data.house] ?? [];
    }
    if (this.stepName === "traits") {
      context.traits = await this.#loadTraits();
    }
    if (this.stepName === "wand") {
      this.data.wand.wood ||= this.#woodFor(this.data.birthMonth, this.data.birthDay);
      context.wood = this.data.wand.wood;
    }
    if (this.stepName === "spells") {
      context.spells = await this.#loadYearOneSpells();
      // Rulebook: 3 first-year spells; Pureblood gets +1 (Half-Blood +1 only if
      // they chose the Pureblood bonus spell).
      context.spellLimit = this.data.heritage === "pureblood" ? 4 : 3;
      context.halfblood = this.data.heritage === "halfblood";
    }
    if (this.stepName === "summary") {
      context.summary = await this.#summary();
    }
    return context;
  }

  /** Traits compendium index split by kind, with current selection flagged. */
  async #loadTraits() {
    const pack = game.packs.get(`${WAW.id}.traits`);
    if (!pack) return { positive: [], negative: [], missing: true };
    const index = await pack.getIndex({ fields: ["system.kind", "img"] });
    const sel = new Set(this.data.traitIds);
    const map = (kind) =>
      index
        .filter((e) => e.system?.kind === kind)
        .map((e) => ({ id: e._id, name: e.name, img: e.img, checked: sel.has(e._id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
    return { positive: map("positive"), negative: map("negative") };
  }

  /** Year-1 spells from the compendium, with current selection flagged. */
  async #loadYearOneSpells() {
    const pack = game.packs.get(`${WAW.id}.spells`);
    if (!pack) return { list: [], missing: true };
    const index = await pack.getIndex({ fields: ["system.year", "system.spellType", "img"] });
    const sel = new Set(this.data.spellIds);
    return {
      list: index
        .filter((e) => e.system?.year === 1)
        .map((e) => ({ id: e._id, name: e.name, img: e.img, checked: sel.has(e._id) }))
        .sort((a, b) => a.name.localeCompare(b.name))
    };
  }

  /** Resolve the Celtic-calendar wand wood for a birthday. */
  #woodFor(month, day) {
    const md = Number(month) * 100 + Number(day);
    const inRange = (e) => {
      const f = e.fromM * 100 + e.fromD;
      const t = e.toM * 100 + e.toD;
      return f <= t ? md >= f && md <= t : md >= f || md <= t;
    };
    return WAW.wandWoods.find(inRange)?.wood ?? "";
  }

  async #summary() {
    const attrs = Object.entries(this.data.attributes).map(([k, v]) => ({
      label: WAW.attributes[k],
      value: Number(v)
    }));
    return {
      attrs,
      traitCount: this.data.traitIds.length,
      spellCount: this.data.spellIds.length
    };
  }

  /* -------------------------------------------- */
  /*  Navigation                                  */
  /* -------------------------------------------- */

  /** Read the current step's form fields into `this.data`. */
  #collect() {
    const root = this.element;
    if (!root) return;
    const fd = new foundry.applications.ux.FormDataExtended(root);
    foundry.utils.mergeObject(this.data, foundry.utils.expandObject(fd.object), { inplace: true });

    // Checkbox groups carry no `name` (so FormData ignores them) — read by data-attr.
    const traitBoxes = root.querySelectorAll("[data-trait-id]");
    if (traitBoxes.length) {
      this.data.traitIds = Array.from(traitBoxes).filter((b) => b.checked).map((b) => b.dataset.traitId);
    }
    const spellBoxes = root.querySelectorAll("[data-spell-id]");
    if (spellBoxes.length) {
      this.data.spellIds = Array.from(spellBoxes).filter((b) => b.checked).map((b) => b.dataset.spellId);
    }
  }

  static async #onNext() {
    this.#collect();
    if (this.step < WawCreationWizard.STEPS.length - 1) this.step++;
    this.render();
  }

  static async #onBack() {
    this.#collect();
    if (this.step > 0) this.step--;
    this.render();
  }

  static async #onGoto(event, target) {
    this.#collect();
    const idx = Number(target.dataset.index);
    if (idx >= 0 && idx < WawCreationWizard.STEPS.length) this.step = idx;
    this.render();
  }

  static async #onApplyHeritageBase() {
    this.#collect();
    const base = WAW.heritageData[this.data.heritage]?.attributes;
    if (base) this.data.attributes = { ...base };
    this.render();
  }

  static async #onRollGalleons() {
    this.#collect();
    const formula = WAW.heritageData[this.data.heritage]?.galleons ?? "1d6+6";
    const roll = await new Roll(formula).evaluate();
    this.data.galleons = roll.total;
    this.render();
  }

  static async #onRollCore() {
    this.#collect();
    const roll = await new Roll("1d6").evaluate();
    this.data.wand.core = WAW.wandCores[Math.ceil(roll.total / 2) - 1];
    this.render();
  }

  static async #onRollLength() {
    this.#collect();
    const roll = await new Roll("1d6").evaluate();
    this.data.wand.length = roll.total + 8;
    this.render();
  }

  /* -------------------------------------------- */
  /*  Apply                                        */
  /* -------------------------------------------- */

  static async #onFinish() {
    this.#collect();
    await this.#apply();
    ui.notifications?.info(game.i18n.localize("WAW.Wizard.Done"));
    this.close();
    this.actor.sheet?.render(true);
  }

  async #apply() {
    const d = this.data;
    const monthName = game.i18n.localize(WAW.months[Number(d.birthMonth) - 1] ?? "");

    const update = {
      name: d.name?.trim() || this.actor.name,
      "system.details.heritage": d.heritage,
      "system.details.house": d.house,
      "system.details.houseBenefit": d.houseBenefit || "",
      "system.details.heritageBonus": d.heritageBonus || "",
      "system.details.heritageDrawback": d.heritageDrawback || "",
      "system.details.birthday": `${monthName} ${d.birthDay}`,
      "system.galleons": Number(d.galleons) || 0,
      "system.details.looks.body": d.looks.body || "",
      "system.details.looks.eyes": d.looks.eyes || "",
      "system.details.looks.face": d.looks.face || "",
      "system.background": d.background || ""
    };
    const cap = WAW.attributeCreationRange;
    for (const [key, value] of Object.entries(d.attributes)) {
      update[`system.attributes.${key}.value`] = Math.clamp(Number(value) || 0, cap.min, cap.max);
    }
    await this.actor.update(update);

    // Build the embedded items: imported traits/spells + a wand + a pet.
    const toCreate = [];

    const traitPack = game.packs.get(`${WAW.id}.traits`);
    if (traitPack && d.traitIds.length) {
      const docs = await Promise.all(d.traitIds.map((id) => traitPack.getDocument(id)));
      toCreate.push(...docs.filter(Boolean).map((doc) => doc.toObject()));
    }

    const spellPack = game.packs.get(`${WAW.id}.spells`);
    if (spellPack && d.spellIds.length) {
      const docs = await Promise.all(d.spellIds.map((id) => spellPack.getDocument(id)));
      toCreate.push(
        ...docs.filter(Boolean).map((doc) => {
          const obj = doc.toObject();
          obj.system.inSpellBank = true; // chosen spells start in the Spell Bank
          return obj;
        })
      );
    }

    if (d.wand.wood || d.wand.core) {
      toCreate.push({
        name: game.i18n.localize("WAW.Section.Wands"),
        type: "wand",
        system: {
          wood: d.wand.wood || "",
          core: d.wand.core || "",
          length: Number(d.wand.length) || 9,
          flexibility: d.wand.flexibility || ""
        }
      });
    }

    if (d.pet.name) {
      toCreate.push({
        name: d.pet.name,
        type: "pet",
        system: {
          species: d.pet.species || "cat",
          personality: d.pet.personality || "",
          look: d.pet.look || ""
        }
      });
    }

    if (toCreate.length) await this.actor.createEmbeddedDocuments("Item", toCreate);
  }
}
