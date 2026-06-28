/**
 * The four Houses, transcribed from the Core Rulebook (v1.4). Built into a
 * JournalEntry compendium for in-game reference. Each character also gets one
 * of the listed benefits (recorded on the character sheet).
 */
export const HOUSES = [
  {
    n: "Gryffindor",
    ghost: "Nearly Headless Nick",
    commonRoom: "Top of Gryffindor Tower",
    entrance: "Entrance by password",
    benefits: [
      "Automatically succeed on a Show Courage move once per day.",
      "Shake off the Injured condition once per day.",
      "Take +1 forward to all Body rolls for 1 scene, once per day."
    ]
  },
  {
    n: "Hufflepuff",
    ghost: "The Fat Friar",
    commonRoom: "Large barrels in the kitchen corridor",
    entrance: "Entrance by rhythmic tapping",
    benefits: [
      "Automatically succeed on a Treat Wounds move once per day.",
      "Shake off the Exhausted condition once per day.",
      "Take +1 forward to all Soul rolls for 1 scene, once per day."
    ]
  },
  {
    n: "Ravenclaw",
    ghost: "The Grey Lady",
    commonRoom: "Top of Ravenclaw Tower",
    entrance: "Entrance by riddle",
    benefits: [
      "Automatically succeed on an I Read About That move once per day.",
      "Shake off the Dazed condition once per day.",
      "Take +1 forward to all Mind rolls for 1 scene, once per day."
    ]
  },
  {
    n: "Slytherin",
    ghost: "The Bloody Baron",
    commonRoom: "The Dungeons",
    entrance: "Secret entrance by password",
    benefits: [
      "Automatically succeed on a Convince move once per day.",
      "Shake off the Upset condition once per day.",
      "Reroll a roll once per day."
    ]
  }
];
