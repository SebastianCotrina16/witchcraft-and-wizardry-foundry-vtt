/**
 * The 13 basic Moves, transcribed from the Core Rulebook (v1.4).
 * `key` links to CONFIG.WAW.moves; `attr` is the attribute rolled.
 * s / p / f = the 10+, 7-9 and 6- outcomes (blank where the GM decides).
 */
export const MOVES = [
  {
    key: "quickAndQuiet", attr: "body",
    d: "Roll +Body when you try to move quickly and/or quietly.",
    s: "You move quickly and go unnoticed.",
    p: "You move quickly or quietly — which is it?",
    f: ""
  },
  {
    key: "toughItOut", attr: "body",
    d: "Roll +Body when you take a hit.",
    s: "It seemed more dangerous than it was; you shrug off the hit without any problems.",
    p: "It takes you off guard. Choose two: take an appropriate condition; you're knocked out of position, putting you in more danger; you lose something important.",
    f: "You're hurt badly. Choose one: pass out or flee; you're cursed, severely injured or deeply affected (the GM tells you how); or take all three options from the 7-9 list."
  },
  {
    key: "struggle", attr: "body",
    d: "Roll +Body when you try to struggle against someone or something.",
    s: "You struggle successfully, taking damage. Choose two.",
    p: "Choose one: shrug off the damage; take something from them; surprise them; frighten them.",
    f: ""
  },
  {
    key: "convince", attr: "heart",
    d: "Roll +Heart when you try to make someone hear you, through intimidation or conversation.",
    s: "They hear you and believe you.",
    p: "Choose one: they need proof; they go along with it… for now; they do it but are terrified of you; you bribe them.",
    f: ""
  },
  {
    key: "readBetweenTheLines", attr: "heart",
    d: "Roll +Heart when you try to understand what someone or something is really thinking.",
    s: "You read them like a book. Choose two questions.",
    p: "Choose one: Are they telling the truth? What are they planning? How do they see me? How can I get them to trust me? How can I make them angry? How are they feeling?",
    f: ""
  },
  {
    key: "treatWounds", attr: "heart",
    d: "Roll +Heart when you take time to treat someone's wounds with items, potions or physical means.",
    s: "You heal one condition.",
    p: "Choose one: you jerry-rig something temporary that won't last; it costs you something; it takes all your concentration, taking longer and leaving you vulnerable.",
    f: ""
  },
  {
    key: "iReadAboutThat", attr: "mind",
    d: "Roll +Mind when you try to remember some history, personal or otherwise.",
    s: "Ask three questions.",
    p: "Ask two: What does it do? What does it look, sound, smell, taste or feel like? Is it dangerous? Where is it from? Who do I know related to it?",
    f: ""
  },
  {
    key: "investigate", attr: "mind",
    d: "Roll +Mind when you take time to closely examine something and figure out what's going on.",
    s: "Ask two questions.",
    p: "Ask one: Are there any traps? Is there remaining magic here? Anything strange physically? Similar to something I've seen before? Anything of use here?",
    f: ""
  },
  {
    key: "noticeSomething", attr: "mind",
    d: "Roll +Mind when something catches your attention and you try to see what it is.",
    s: "Ask two questions.",
    p: "Ask one: Is anyone or anything sneaking around? Did it seem dangerous? How do we get out of here? What did it look like?",
    f: ""
  },
  {
    key: "inspireOthers", attr: "soul",
    d: "Roll +Soul when you try to inspire others. Explain how you try to inspire them.",
    s: "You inspire someone. Choose two: make another feel strong (+1 forward to Body), perceptive (+1 forward to Heart) or clever (+1 forward to Mind).",
    p: "You help a little; choose one of the above.",
    f: "You aren't convincing and the other person takes -2 forward to Body, Heart or Mind."
  },
  {
    key: "resistInfluence", attr: "soul",
    d: "Roll +Soul when you try to resist someone's influence.",
    s: "You resist their influence and take +1 forward if they try to influence you again.",
    p: "You resist, but it lingers: take -1 forward to resisting further influence from them.",
    f: "You listen intently to their influence and do what they say."
  },
  {
    key: "showCourage", attr: "soul",
    d: "Roll +Soul when you try to show courage in the face of something truly terrifying.",
    s: "You look fear in the eye and do not break. Gain +1 forward when challenging it.",
    p: "You stand strong but stay scared. Choose one: you're terrified and everyone knows; you take -1 forward when challenging it; you let your friends down but gain +1 forward when challenging it.",
    f: "You cower in fear, running from the fight, and take -1 forward when challenging it."
  },
  {
    key: "castASpell", attr: "magic",
    d: "Roll +Magic when you try to cast a spell. -1 forward for each year above your character, +1 forward for each year below.",
    s: "The spell succeeds.",
    p: "The spell succeeds with side effects; choose two: an ally takes a condition from a partial misfire (they choose); the spell is different than expected; someone or something is alerted to the casting; your wand is thrown from your hands and lands nearby.",
    f: "The spell rebounds and the caster takes a condition — one additional condition for each year past the current year of the spell attempted."
  }
];
