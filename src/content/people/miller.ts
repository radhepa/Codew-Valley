import type { Person } from "../types.ts";

export const WREN: Person = {
  id: "miller",
  name: "Wren",
  title: "Miller of the Whistling Mill",
  home: "mill",
  traits: ["stubborn", "early riser", "reads the wind like a book", "can't sit still"],
  voice: "Brisk, practical and quick; talks about the weather like other people talk about friends; never takes no for an answer; turns everything into an if/else; softens only about her grandmother and the old family mill.",
  likes: ["a steady west wind", "fresh wheat", "being proven right", "her grandmother's songs"],
  dislikes: ["being told to rest", "still air", "debts and the people who collect them"],
  want: "To win back her family's mill, lost to a debt collector when she was young. She still has the key to its blue door.",
  talk: [
    [
      "Morning! Or it will be. I've been up since the wind changed. Very exciting wind.",
      "If it rains, I mill indoors. Elif it's windy, I mill outdoors. Else... I find something to mill.",
      "Don't tell me to slow down. Everybody tells me to slow down. The wheat doesn't slow down.",
      "Pip says my sails are 'dramatic'. Pip should look in a mirror.",
    ],
    [
      "You're one of the few people who doesn't tell me to rest. I like that about you.",
      "My grandmother could tell the weather by the way the cows lay down. I use a weathervane. And also the cows.",
      "Bread's just patience you can eat. My grandmother said that. She said a lot of things. Most of them were about bread.",
      "I tried one of your challenges in my head while milling. I got the elif in the wrong order. The mill didn't care, luckily.",
    ],
    [
      "When I lost the old mill I promised myself I'd never stand still again. Then you built me this one, and for the first time I wanted to.",
      "My grandmother used to sing to the millstone. Said it ground finer. Don't laugh. I sing to this one too.",
      "You know the funny thing about wind? You can't see it. You only see what it moves. I think you're a bit like that.",
      "Some days I stand on the gallery and just watch the valley. Don't tell anyone. They'll think I've gone soft.",
    ],
    [
      "I still have the key to our old blue door. I carry it everywhere. One day I'll tell you the whole story.",
      "If I'm ever tempted to leave and chase the old mill, will you remind me that I have this one? And you?",
      "You're the stubbornest person I know, after me. That's the nicest thing I've ever said to anyone.",
      "Grandmother would have liked you. She liked people who finished what they started.",
    ],
  ],
  rain: [
    "Rain! Sails down, doors shut, and I finally get to sort the sacks. Secretly my favourite day.",
    "Wet wheat is grumpy wheat. Like me before breakfast.",
  ],
  evening: [
    "Wind drops in the evening. The sails slow, and so do I. A bit. Don't get used to it.",
    "Sunset from the gallery's the best view in the valley. You should come up sometime.",
  ],
  questions: [
    {
      id: "wren-morning",
      minHearts: 0,
      ask: "Are you a morning person? Be honest. I can tell when people lie about mornings.",
      choices: [
        { label: "Up with the sun", reply: "I knew it! Finally, someone who understands. The best wind is at dawn.", points: 35 },
        { label: "Not even slightly", reply: "Hmph. Well, someone has to be awake when the stars are out, I suppose. Just don't be loud near the mill before noon. Actually, do. Wake me up.", points: 15 },
        { label: "Depends on the day", reply: "A diplomat. If the wind's good, you're a morning person. Elif it's raining, you're not. I respect that.", points: 25 },
      ],
    },
    {
      id: "wren-no",
      minHearts: 3,
      ask: "Somebody once told me I'd never run a mill of my own. What would you have said to them?",
      choices: [
        { label: "Watch her", reply: "Ha! That's exactly what I said. Well, I said it louder, with more flour.", points: 45 },
        { label: "That was cruel of them", reply: "It was. It also lit a fire under me, so... I'll take the fire and leave the cruelty.", points: 30 },
        { label: "Maybe they were worried", reply: "Maybe. Worry sounds a lot like 'no' when you're young. I still don't like it.", points: 10 },
      ],
    },
    {
      id: "wren-key",
      minHearts: 6,
      ask: "If you lost something you loved, would you try to get it back, or build something new?",
      choices: [
        { label: "Build something new", reply: "That's what you did with this valley, isn't it? Built something new where something was lost. I'm starting to think that's braver.", points: 40 },
        { label: "Get it back", reply: "That's what I always told myself. I still carry the key, you know. But lately I'm not so sure it's the door I want.", points: 30 },
        { label: "Why not both?", reply: "Both. Huh. That never occurred to me. Bit of an 'and' instead of an 'or'. I'll think about that.", points: 50 },
      ],
    },
  ],
  milestones: [
    "I saved you the first loaf from this week's flour. Well, the first loaf Bram didn't eat.",
    "I showed you my grandmother's weather notes, didn't I? Nobody else has seen those.",
    "Here's a secret: the debt collector who took our mill has a name. Vane. I'll tell you more one day.",
    "I named the third sail after you. The others are named after the four winds. Yours is the one that never stops.",
    "You're my family now. The kind you choose. I'm terrible at saying soft things, so that's all you get.",
  ],
};
