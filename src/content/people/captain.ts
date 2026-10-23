import type { Person } from "../types.ts";

export const ROOK: Person = {
  id: "captain",
  name: "Rook",
  title: "Captain of the Guild Hall",
  home: "guildhall",
  traits: ["gruff but kind", "full of tall tales", "a scar and a different story for it", "itching for the road"],
  voice: "Low, dry and clipped; drops words like an old soldier ('Seen worse.'); calls the player 'recruit'; quotes numbered 'rules of the road', always out of order; tells a new tall tale about the scar every time, straight-faced; softens only over maps, tea and the old crew.",
  likes: ["a good map", "strong tea, no sugar", "boots that are properly broken in", "a quiet morning before a long walk"],
  dislikes: ["being called retired", "rocking chairs", "anyone touching the map pins"],
  want: "One last adventure. Rook hung up the sword years ago, but still keeps a packed bag under the bed, just in case.",
  talk: [
    [
      "Recruit. You've got the look of someone who builds things. Good. Guild needs builders. Also tea. Mostly tea.",
      "The scar? Wyvern. Big one, on the Ashfen Pass. Took a bite at me. I took a bite back. We parted friends.",
      "Rule three of the road: always know where the door is. Rule one is pack socks. Rule two I've forgotten. Three's the important one.",
      "Storm sitting on the north hill. Not moving. I've seen a lot of weather, recruit. Never seen weather that waits.",
    ],
    [
      "Every expedition's a try block, the way you'd put it. Always plan an except for the trouble. Never leave without one.",
      "The scar? Ogre. Arm-wrestling match. I won. He cried. We still write.",
      "Somebody keeps calling me retired. I'm not retired. I'm resting between adventures. Long rest. Twenty years. Still counts.",
      "The lord with all the papers asked to join the guild. Filled in his own form, in triplicate, and stamped it himself. Can't fault the effort.",
    ],
    [
      "Had a crew once. Three of us and a mule. People assumed the mule was in charge. Some days the mule was.",
      "Thing nobody tells you about adventures, recruit: the best bit's the walk home. Knowing somebody's lit a lamp for you.",
      "You don't flinch at a hard problem. You squint, scratch your head, go again. That's all courage is. Squinting and going again.",
      "That road up the hill's the first real road I've walked in years. Knees complained. Told them to file a report with the lord.",
    ],
    [
      "Spent my whole life hunting the next adventure. Turned out to be a village, a snake and you. Should've read the map closer.",
      "Packed bag's still under the bed. But these days I think: if I left, who'd make the guild tea? You'd miss my tea. Admit it.",
      "Used to say adventurers don't need anybody. Said it loud. Said it often. Wrong every time. Took a valley to show me.",
      "If there's one last adventure left in these old boots, I want you walking with me. Not behind. Next to.",
    ],
  ],
  rain: [
    "Rain. Good. Keeps the boots honest. Rained nine days straight on the Ashfen once. Grew moss on my hat. Kept the moss.",
    "Can't march in this. Can sit by the fire and polish a sword I don't use. Best of both.",
  ],
  evening: [
    "Evening watch. Old habit. I sit by the door and count the lamps. All lit. Good village.",
    "Sun's going down behind the hills. Used to mean find a camp. Now it means tea. I'll take it.",
  ],
  questions: [
    {
      id: "rook-scar",
      minHearts: 0,
      ask: "Go on, recruit. You're staring at the scar. Ask. Everybody asks.",
      choices: [
        { label: "Is it a good story?", reply: "Ha! Best kind of question. It's a different story every time. Pick a day you like the sound of and I'll tell you that one.", points: 45 },
        { label: "How'd you get it?", reply: "Sea serpent. Big as the tavern. Punched it on the nose and it apologised. True story. Mostly.", points: 35 },
        { label: "I wasn't staring", reply: "You were. Good manners, though. I'll give you that. Bad liar. I'll give you that too.", points: 15 },
      ],
    },
    {
      id: "rook-pack",
      minHearts: 3,
      ask: "Long trip. One bag. First thing you pack?",
      choices: [
        { label: "A map", reply: "Right answer. A map tells you where you are when your feet forget. Good, recruit. Very good.", points: 45 },
        { label: "A friend", reply: "Can't fit a friend in a bag. Tried once. He complained. But you've got the idea. Best thing you can bring.", points: 40 },
        { label: "Snacks", reply: "Ha. Practical. You'd be popular on the road. Everybody loves the one with snacks.", points: 25 },
      ],
    },
    {
      id: "rook-last",
      minHearts: 6,
      ask: "Straight question, recruit. Am I too old for one last adventure?",
      choices: [
        { label: "Not if you bring me", reply: "Bring you? ...Aye. That's the only way I'd go now. Deal.", points: 50 },
        { label: "Never", reply: "Never. Good word. I'll stitch it on the bag. Then I'll pack the bag. Again.", points: 45 },
        { label: "Maybe a gentle one", reply: "Gentle. Hm. Like a picnic, with swords. I could manage a picnic. Wouldn't tell the old crew.", points: 25 },
      ],
    },
  ],
  milestones: [
    "Here. Guild badge. Tin, slightly bent. Means you're one of us. Don't polish it. It's meant to look lived in.",
    "Showed you my old map, didn't I? Every pin's a place I've been. Put a new pin in last night. This valley. It's staying.",
    "Told you the whole mule story. Nobody gets the whole mule story. The mule would be honoured. Probably. Hard to read, mules.",
    "The scar. Truth this time. First day as a guard, tripped over a goose and landed in a rose bush. Never told a soul. Keep it that way, recruit.",
    "Spent my whole life chasing the next horizon. Never thought I'd find a place I didn't want to leave. You did that. Rule one of the road, the real one: find your people. I found you.",
  ],
};
