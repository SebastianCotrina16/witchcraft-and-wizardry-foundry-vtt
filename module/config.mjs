/**
 * Central configuration object for the Witchcraft and Wizardry system.
 *
 * Everything here is data, not logic: localizable labels, enumerations and the
 * static definitions of the game's Moves. Keeping it in one place makes the
 * system easy to extend — add a key here and reference it from data models,
 * sheets and templates rather than hard-coding strings throughout the code.
 *
 * Localization keys resolve against `lang/*.json`.
 */
export const WAW = {};

WAW.id = "witchcraft-and-wizardry";
WAW.path = `systems/${WAW.id}`;

/* -------------------------------------------- */
/*  Icons                                        */
/* -------------------------------------------- */

/**
 * Default artwork per document subtype. These all reference Foundry's built-in
 * `icons/` library, so nothing has to be downloaded or redistributed. Override
 * any of them with custom art under `assets/` when available.
 */
WAW.defaultIcons = {
  // Actors
  character: "icons/svg/mystery-man.svg",
  npc: "icons/svg/mystery-man-black.svg",
  // Items
  spell: "icons/svg/aura.svg",
  trait: "icons/svg/book.svg",
  wand: "icons/svg/light.svg",
  pet: "icons/svg/pawprint.svg",
  equipment: "icons/svg/item-bag.svg",
  potion: "icons/svg/pill.svg",
  move: "icons/svg/target.svg"
};

/** Icon chosen for a spell based on its classification (see `spellTypes`). */
WAW.spellTypeIcons = {
  charm: "icons/svg/aura.svg",
  jinx: "icons/svg/lightning.svg",
  hex: "icons/svg/daze.svg",
  curse: "icons/svg/poison.svg",
  transfiguration: "icons/svg/upgrade.svg",
  conjuration: "icons/svg/explosion.svg",
  healing: "icons/svg/heal.svg",
  counterCharm: "icons/svg/mage-shield.svg"
};

/* -------------------------------------------- */
/*  Attributes & Conditions                     */
/* -------------------------------------------- */

/**
 * The six roll modifiers. The first five are the core attributes that back
 * Moves; `relationship` is situational and added per-target by the player.
 */
WAW.attributes = {
  body: "WAW.Attribute.Body",
  heart: "WAW.Attribute.Heart",
  mind: "WAW.Attribute.Mind",
  soul: "WAW.Attribute.Soul",
  magic: "WAW.Attribute.Magic"
};

/** Hard caps for an attribute value (raised to +4 for one attribute by advancement). */
WAW.attributeRange = { min: -2, max: 4 };

/** Attribute caps at character creation (rulebook: max +2, min -2). */
WAW.attributeCreationRange = { min: -2, max: 2 };

/**
 * Health conditions. Each condition applies a -2 penalty to a single attribute
 * while active. Taking all five makes a character pass out.
 */
WAW.conditions = {
  injured: { label: "WAW.Condition.Injured", attribute: "body" },
  dazed: { label: "WAW.Condition.Dazed", attribute: "mind" },
  upset: { label: "WAW.Condition.Upset", attribute: "heart" },
  exhausted: { label: "WAW.Condition.Exhausted", attribute: "soul" },
  jinxed: { label: "WAW.Condition.Jinxed", attribute: "magic" }
};

/** Penalty applied to the paired attribute for each active condition. */
WAW.conditionPenalty = -2;

/** Number of experience boxes a character fills before spending them. */
WAW.experienceBoxes = 5;

/* -------------------------------------------- */
/*  Character creation enumerations             */
/* -------------------------------------------- */

WAW.heritages = {
  muggleborn: "WAW.Heritage.MuggleBorn",
  halfblood: "WAW.Heritage.HalfBlood",
  pureblood: "WAW.Heritage.Pureblood"
};

WAW.houses = {
  unsorted: "WAW.House.Unsorted",
  gryffindor: "WAW.House.Gryffindor",
  hufflepuff: "WAW.House.Hufflepuff",
  ravenclaw: "WAW.House.Ravenclaw",
  slytherin: "WAW.House.Slytherin"
};

/** Years of study (1-7), gating which spells a character may bank. */
WAW.years = [1, 2, 3, 4, 5, 6, 7];

/**
 * The benefits each House offers (the player picks one). Values are
 * localization keys; the sheet shows them as a dropdown driven by the
 * character's selected House.
 */
WAW.houseBenefits = {
  gryffindor: ["WAW.Benefit.Gryffindor.0", "WAW.Benefit.Gryffindor.1", "WAW.Benefit.Gryffindor.2"],
  hufflepuff: ["WAW.Benefit.Hufflepuff.0", "WAW.Benefit.Hufflepuff.1", "WAW.Benefit.Hufflepuff.2"],
  ravenclaw: ["WAW.Benefit.Ravenclaw.0", "WAW.Benefit.Ravenclaw.1", "WAW.Benefit.Ravenclaw.2"],
  slytherin: ["WAW.Benefit.Slytherin.0", "WAW.Benefit.Slytherin.1", "WAW.Benefit.Slytherin.2"]
};

/**
 * Heritage starting data (rulebook character creation). `attributes` is the base
 * spread applied by the guided "Apply heritage" action; `galleons` is the
 * starting-money roll; `bonus`/`drawback` are localization keys.
 */
WAW.heritageData = {
  muggleborn: {
    attributes: { body: 1, heart: 0, mind: 0, soul: -1, magic: -1 },
    galleons: "1d6+6",
    bonus: "WAW.HeritageInfo.Muggleborn.Bonus",
    drawback: "WAW.HeritageInfo.Muggleborn.Drawback"
  },
  halfblood: {
    attributes: { body: -1, heart: 0, mind: 0, soul: 0, magic: 1 },
    galleons: "2d6+6",
    bonus: "WAW.HeritageInfo.Halfblood.Bonus",
    drawback: "WAW.HeritageInfo.Halfblood.Drawback",
    // Half-Blood picks one bonus and one drawback from the Muggle-Born / Pureblood lists.
    bonusOptions: ["WAW.HeritageInfo.Muggleborn.Bonus", "WAW.HeritageInfo.Pureblood.Bonus"],
    drawbackOptions: ["WAW.HeritageInfo.Muggleborn.Drawback", "WAW.HeritageInfo.Pureblood.Drawback"]
  },
  pureblood: {
    attributes: { body: -2, heart: -1, mind: 0, soul: 0, magic: 2 },
    galleons: "3d6+6",
    bonus: "WAW.HeritageInfo.Pureblood.Bonus",
    drawback: "WAW.HeritageInfo.Pureblood.Drawback"
  }
};

WAW.pets = {
  cat: "WAW.Pet.Cat",
  owl: "WAW.Pet.Owl",
  toad: "WAW.Pet.Toad"
};

/* -------------------------------------------- */
/*  Wand selection (guided creation)            */
/* -------------------------------------------- */

/** Celtic-calendar wand wood by birthday (inclusive date ranges; Birch wraps the year). */
WAW.wandWoods = [
  { fromM: 12, fromD: 24, toM: 1, toD: 20, wood: "Birch (Beth)" },
  { fromM: 1, fromD: 21, toM: 2, toD: 17, wood: "Rowan (Luis)" },
  { fromM: 2, fromD: 18, toM: 3, toD: 17, wood: "Ash (Nion)" },
  { fromM: 3, fromD: 18, toM: 4, toD: 14, wood: "Alder (Fearn)" },
  { fromM: 4, fromD: 15, toM: 5, toD: 12, wood: "Willow (Saille)" },
  { fromM: 5, fromD: 13, toM: 6, toD: 9, wood: "Hawthorn (Huath)" },
  { fromM: 6, fromD: 10, toM: 7, toD: 7, wood: "Oak (Duir)" },
  { fromM: 7, fromD: 8, toM: 8, toD: 4, wood: "Holly (Tinne)" },
  { fromM: 8, fromD: 5, toM: 9, toD: 1, wood: "Hazel (Coll)" },
  { fromM: 9, fromD: 2, toM: 9, toD: 29, wood: "Vine (Muin)" },
  { fromM: 9, fromD: 30, toM: 10, toD: 27, wood: "Ivy (Gort)" },
  { fromM: 10, fromD: 28, toM: 11, toD: 24, wood: "Reed (Ngetal)" },
  { fromM: 11, fromD: 25, toM: 12, toD: 23, wood: "Elder (Ruis)" }
];

/** Wand cores, indexed by a d6 roll (1-2, 3-4, 5-6). */
WAW.wandCores = ["Unicorn Tail Hair", "Dragon Heartstring", "Phoenix Feather"];

/** Suggested wand flexibilities. */
WAW.wandFlexibilities = [
  "Quite Bendy", "Surprisingly Swishy", "Swishy", "Slightly Springy", "Fairly Bendy",
  "Very Flexible", "Quite Flexible", "Supple", "Reasonably Supple", "Pliant", "Brittle",
  "Hard", "Solid", "Stiff", "Rigid", "Unyielding", "Slightly Yielding", "Unbending", "Whippy"
];

/** Month names for the birthday picker (localization keys). */
WAW.months = [
  "WAW.Month.1", "WAW.Month.2", "WAW.Month.3", "WAW.Month.4", "WAW.Month.5", "WAW.Month.6",
  "WAW.Month.7", "WAW.Month.8", "WAW.Month.9", "WAW.Month.10", "WAW.Month.11", "WAW.Month.12"
];

/** Spell classifications used by the rulebook's spell list. */
WAW.spellTypes = {
  charm: "WAW.SpellType.Charm",
  jinx: "WAW.SpellType.Jinx",
  hex: "WAW.SpellType.Hex",
  curse: "WAW.SpellType.Curse",
  transfiguration: "WAW.SpellType.Transfiguration",
  conjuration: "WAW.SpellType.Conjuration",
  healing: "WAW.SpellType.Healing",
  counterCharm: "WAW.SpellType.CounterCharm"
};

WAW.traitKinds = {
  positive: "WAW.Trait.Positive",
  negative: "WAW.Trait.Negative"
};

/* -------------------------------------------- */
/*  NPCs                                         */
/* -------------------------------------------- */

WAW.npcKinds = {
  student: "WAW.NpcKind.Student",
  professor: "WAW.NpcKind.Professor",
  villain: "WAW.NpcKind.Villain",
  creature: "WAW.NpcKind.Creature",
  other: "WAW.NpcKind.Other"
};

/** Encounter difficulty -> hits required to defeat a standard enemy. */
WAW.encounterHits = {
  easy: 2,
  normal: 3,
  hard: 4
};

/* -------------------------------------------- */
/*  Moves                                        */
/* -------------------------------------------- */

/**
 * The basic Moves. Each is rolled as 2d6 + the named attribute (+ situational
 * bonuses). Outcomes: 10+ full success, 7-9 partial, 6- failure.
 * `move` Items can reference one of these keys or define a fully custom move.
 */
WAW.moves = {
  quickAndQuiet: { label: "WAW.Move.QuickAndQuiet", attribute: "body" },
  toughItOut: { label: "WAW.Move.ToughItOut", attribute: "body" },
  struggle: { label: "WAW.Move.Struggle", attribute: "body" },
  convince: { label: "WAW.Move.Convince", attribute: "heart" },
  readBetweenTheLines: { label: "WAW.Move.ReadBetweenTheLines", attribute: "heart" },
  treatWounds: { label: "WAW.Move.TreatWounds", attribute: "heart" },
  iReadAboutThat: { label: "WAW.Move.IReadAboutThat", attribute: "mind" },
  investigate: { label: "WAW.Move.Investigate", attribute: "mind" },
  noticeSomething: { label: "WAW.Move.NoticeSomething", attribute: "mind" },
  inspireOthers: { label: "WAW.Move.InspireOthers", attribute: "soul" },
  resistInfluence: { label: "WAW.Move.ResistInfluence", attribute: "soul" },
  showCourage: { label: "WAW.Move.ShowCourage", attribute: "soul" },
  castASpell: { label: "WAW.Move.CastASpell", attribute: "magic" }
};

/* -------------------------------------------- */
/*  Roll modifiers (passives offered in dialog) */
/* -------------------------------------------- */

/** Forward value granted by each heritage bonus/drawback (situational topics). */
WAW.heritageForwardValues = {
  "WAW.HeritageInfo.Muggleborn.Bonus": 1,
  "WAW.HeritageInfo.Muggleborn.Drawback": -1,
  "WAW.HeritageInfo.Pureblood.Drawback": -2
};

/** Which heritage forwards a character has (Half-Blood derives from its choices). */
WAW.heritageForwards = {
  muggleborn: ["WAW.HeritageInfo.Muggleborn.Bonus", "WAW.HeritageInfo.Muggleborn.Drawback"],
  pureblood: ["WAW.HeritageInfo.Pureblood.Drawback"],
  halfblood: []
};

/** The House "+1 Forward to all <attribute> rolls" benefit (3rd option per House). */
WAW.houseForwardBenefit = {
  gryffindor: { key: "WAW.Benefit.Gryffindor.2", attribute: "body" },
  hufflepuff: { key: "WAW.Benefit.Hufflepuff.2", attribute: "soul" },
  ravenclaw: { key: "WAW.Benefit.Ravenclaw.2", attribute: "mind" }
};

/** PbtA result tiers, keyed by the lowest total that reaches them. */
WAW.rollTiers = {
  success: { min: 10, label: "WAW.Roll.Success" },
  partial: { min: 7, label: "WAW.Roll.Partial" },
  failure: { min: -Infinity, label: "WAW.Roll.Failure" }
};
