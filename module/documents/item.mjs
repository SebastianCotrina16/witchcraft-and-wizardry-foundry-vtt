import { rollMove } from "../helpers/dice.mjs";
import { WAW } from "../config.mjs";

/**
 * System Item document. Spells and Moves are rollable; the rest are pure data.
 */
export class WawItem extends Item {
  /** Assign a subtype-appropriate default icon on creation. */
  async _preCreate(data, options, user) {
    await super._preCreate(data, options, user);
    if (data.img === undefined && WAW.defaultIcons[this.type]) {
      this.updateSource({ img: WAW.defaultIcons[this.type] });
    }
  }

  /**
   * Use this item. Spells delegate to the owning actor's casting routine; Moves
   * roll their attribute; everything else just posts its description to chat.
   */
  async use({ bonus = 0, fast = false } = {}) {
    if (this.type === "spell" && this.actor) {
      return this.actor.castSpell(this, { bonus, fast });
    }
    if (this.type === "move") {
      return rollMove({
        actor: this.actor,
        attribute: this.system.rollAttribute,
        label: this.name,
        flavor: this.system.description ?? "",
        bonus,
        fast
      });
    }
    return this.toChat();
  }

  /** Post a simple description card to chat. */
  async toChat() {
    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<div class="waw-item-card"><h3>${this.name}</h3>${this.system.description ?? ""}</div>`
    });
  }
}
