import { WAW } from "../config.mjs";

/**
 * PbtA dice engine for Witchcraft and Wizardry.
 *
 * Rolls are `2d6 + attribute (+ situational modifiers)`. Result tiers: 10+
 * success, 7-9 partial, 6- failure. Rolling normally opens a dialog where the
 * player can add Forward / Relationship and toggle their applicable passives
 * (heritage topic forwards, House +1-Forward benefit). Shift-click skips it.
 * Each result card carries a Reroll button.
 */

/** Resolve which result tier a total falls into. */
export function resultTier(total) {
  if (total >= WAW.rollTiers.success.min) return "success";
  if (total >= WAW.rollTiers.partial.min) return "partial";
  return "failure";
}

const fmt = (n) => (Number(n) >= 0 ? `+${n}` : `${n}`);

/**
 * Open the modifier dialog. Returns `{ bonus, parts }` or null if cancelled.
 * Only modifiers relevant to the rolled attribute are shown.
 */
export async function gatherModifiers({ actor, attribute, label }) {
  const mods = (actor?.system?.rollMods ?? []).filter((m) => !m.attribute || m.attribute === attribute);

  const modRows = mods
    .map(
      (m, i) => `
      <label class="waw-roll-mod">
        <input type="checkbox" name="mod-${i}" ${m.value > 0 ? "checked" : ""}>
        <span>${game.i18n.localize(m.label)}</span>
        <b>${fmt(m.value)}</b>
      </label>`
    )
    .join("");

  const content = `
    <div class="waw-roll-dialog">
      <p class="waw-roll-formula">2d6${attribute ? ` + ${game.i18n.localize(WAW.attributes[attribute])}` : ""}</p>
      <div class="waw-roll-inputs">
        <label>${game.i18n.localize("WAW.Roll.Forward")}<input type="number" name="forward" value="0" step="1"></label>
        <label>${game.i18n.localize("WAW.Roll.Relationship")}<input type="number" name="relationship" value="0" step="1"></label>
      </div>
      ${modRows ? `<div class="waw-roll-mods">${modRows}</div>` : ""}
    </div>`;

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: label, icon: "fa-solid fa-dice" },
    classes: ["waw"],
    rejectClose: false,
    content,
    buttons: [
      {
        action: "roll",
        label: game.i18n.localize("WAW.Action.Roll"),
        icon: "fa-solid fa-dice",
        default: true,
        callback: (event, button) => {
          const form = button.form;
          const parts = [];
          let bonus = 0;
          const fwd = Number(form.elements.forward?.value) || 0;
          const rel = Number(form.elements.relationship?.value) || 0;
          if (fwd) { bonus += fwd; parts.push({ label: game.i18n.localize("WAW.Roll.Forward"), value: fwd }); }
          if (rel) { bonus += rel; parts.push({ label: game.i18n.localize("WAW.Roll.Relationship"), value: rel }); }
          mods.forEach((m, i) => {
            if (form.elements[`mod-${i}`]?.checked) {
              bonus += m.value;
              parts.push({ label: game.i18n.localize(m.label), value: m.value });
            }
          });
          return { bonus, parts };
        }
      },
      { action: "cancel", label: game.i18n.localize("WAW.Wizard.Back"), icon: "fa-solid fa-xmark" }
    ]
  });

  return result && result !== "cancel" ? result : null;
}

/**
 * Roll a Move / attribute / spell.
 * @param {object} o
 * @param {Actor}  o.actor
 * @param {string} [o.attribute]   Attribute key to add.
 * @param {string} o.label         Display label.
 * @param {string} [o.flavor]      Extra description shown on the card.
 * @param {number} [o.bonus=0]     Flat bonus.
 * @param {boolean}[o.fast=false]  Skip the modifier dialog.
 * @param {{label:string,value:number}[]} [o.extraParts] Auto modifiers (e.g. spell bank).
 */
export async function rollMove({ actor, attribute, label, flavor = "", bonus = 0, fast = false, extraParts = [] } = {}) {
  const parts = [...extraParts];
  let situational = bonus + extraParts.reduce((a, p) => a + Number(p.value || 0), 0);

  if (!fast) {
    const mod = await gatherModifiers({ actor, attribute, label });
    if (mod === null) return null; // cancelled
    situational += mod.bonus;
    parts.push(...mod.parts);
  }

  const data = actor?.getRollData?.() ?? {};
  let attrMod = 0;
  if (attribute && data.attributes?.[attribute]) attrMod = Number(data.attributes[attribute].mod ?? 0);

  return postRoll({
    speaker: ChatMessage.getSpeaker({ actor }),
    attribute,
    label,
    flavor,
    attrMod,
    flat: attrMod + situational,
    parts
  });
}

/** Build the dice roll, post the interactive card, and store reroll data. */
async function postRoll({ speaker, attribute, label, flavor, attrMod, flat, parts, isReroll = false }) {
  const roll = new Roll(`2d6 + ${flat}`);
  await roll.evaluate();

  const tier = resultTier(roll.total);
  const tierLabel = game.i18n.localize(WAW.rollTiers[tier].label);

  const breakdown = [];
  if (attribute) breakdown.push(`${game.i18n.localize(WAW.attributes[attribute])} ${fmt(attrMod)}`);
  for (const p of parts) breakdown.push(`${p.label} ${fmt(p.value)}`);

  const head =
    `<div class="waw-roll-head"><strong>${label}</strong> &mdash; ` +
    `<span class="waw-roll-tier waw-roll-${tier}">${tierLabel}</span>` +
    (isReroll ? ` <em>(${game.i18n.localize("WAW.Roll.Reroll")})</em>` : "") +
    `</div>`;
  const bd = breakdown.length ? `<div class="waw-roll-breakdown">${breakdown.join(" · ")}</div>` : "";
  const flv = flavor ? `<div class="waw-roll-flavor">${flavor}</div>` : "";
  const rerollBtn = `<button type="button" class="waw-reroll" data-action="waw-reroll"><i class="fa-solid fa-rotate"></i> ${game.i18n.localize("WAW.Roll.Reroll")}</button>`;

  await roll.toMessage({
    speaker,
    flavor: `<div class="waw-roll-card">${head}${bd}${flv}${rerollBtn}</div>`,
    flags: { [WAW.id]: { tier, reroll: { attribute, label, flavor, attrMod, flat, parts } } }
  });
  return roll;
}

/** Re-roll from a chat message's stored data (Slytherin benefit, etc.). */
export async function rerollMessage(message) {
  const f = message.getFlag(WAW.id, "reroll");
  if (!f) return null;
  return postRoll({ speaker: message.speaker, isReroll: true, ...f });
}
