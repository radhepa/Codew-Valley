import type { Person } from "../types.ts";

export const INGRID: Person = {
  id: "smith",
  name: "Ingrid",
  title: "Blacksmith of the Forge",
  home: "forge",
  traits: ["blunt", "fiercely skilled", "hates waste", "loyal to the bone"],
  voice: "Short, hard sentences, like hammer blows; sorts everything into 'good work' and 'scrap'; reaches for heat and metal in every comparison; never flatters, so her rare praise lands; growls about the Vane Company's plans but stays fair to the people in it; softens only about her old crew.",
  likes: ["a clean weld", "honest work", "tools that outlast their owners", "cold water after a hot day"],
  dislikes: ["waste", "flattery", "cheap iron", "the Vane Company's plans for the valley"],
  want: "To bring her old crew back together: Dagny, Hollis and young Pell, still hammering at the Vane Company works. She walked out in a temper and left them behind, and she's never forgiven herself.",
  talk: [
    [
      "Forge is hot. Anvil's level. That's a good day. Anything else is extra.",
      "Twelve years I made tools for the Vane Company. Then I saw the plans. Drain the pond. Quarry the hills. I put my hammer down and walked.",
      "Smithing's simple. Heat it, hit it, check it. Wrong? Heat it again. Same as your code. Run it, read the error, fix it.",
      "Pip asked if I could make a tiny helmet. For Pip. I said no. ...I'm thinking about it.",
    ],
    [
      "A good tool does one job and does it well. You say the same about functions. Good rule. Keep it.",
      "Vane's not cruel. He's just never had to stand next to a drained pond. Men who only read maps forget there's water under them.",
      "You held the tongs right first time. Didn't flinch at the sparks. ...Good.",
      "Iron tells you when it's ready. Dull red, then cherry, then orange. Don't rush it. Don't wait too long. That's the whole trade.",
    ],
    [
      "Had a crew at the Company works. Dagny, Hollis, young Pell. Best hands I ever worked beside. I left without saying goodbye. Not my finest work.",
      "I don't say 'well done' much. Means more when I do. Well done.",
      "I hate waste. Iron, wood, time, people. The Company wastes all four. This valley doesn't. That's why I stay.",
      "Made you a hook for your door. Nothing fancy. It'll last a hundred years. Don't hang anything daft on it.",
    ],
    [
      "If Pell ever walks through that door, I'll hand over a hammer before hello. That's how I say sorry. Badly. With tools.",
      "You built this forge with words. I've made a thousand things with my hands and never felt like that once. ...Don't let it go to your head.",
      "You're good iron. Took the heat. Didn't crack. I've said that to two anvils and a horseshoe. Now you.",
      "When Vane's done being stubborn, I'll make him a proper pair of tongs. Everybody deserves good tools. Him too. Maybe him most.",
    ],
  ],
  rain: [
    "Rain hisses on the chimney. Forge doesn't care. Stand closer. You'll dry.",
    "Wet day. Good for small work. Nails, hinges, fiddly things. Sit if you want. Don't touch anything orange.",
  ],
  evening: [
    "Fire's banked. Hammer's hung. Arms ache. Good day's work.",
    "Evenings, I sit out here and watch the coals go dark. Best part of the day. Don't tell anyone I sit.",
  ],
  questions: [
    {
      id: "ingrid-tool",
      minHearts: 0,
      ask: "New tool. You want it pretty, or you want it to last?",
      choices: [
        { label: "To last", reply: "Good answer. Pretty rusts. Honest stays.", points: 40 },
        { label: "Both?", reply: "Hm. Greedy. ...Fair, though. Can be done. Takes twice as long.", points: 30 },
        { label: "Pretty", reply: "Pretty. Right. I'll put a curl on the handle. It'll still last. I don't make the other kind.", points: 15 },
      ],
    },
    {
      id: "ingrid-quit",
      minHearts: 3,
      ask: "Was I right to walk out on the Company? Be straight with me. I can't stand flattery.",
      choices: [
        { label: "Yes. You stood by what's right", reply: "Plain enough. Good. ...Still wish I'd done it better.", points: 30 },
        { label: "Maybe you could've changed it from inside", reply: "Maybe. Tried, at first. Vane doesn't hear 'no' from smiths. But it's a fair thought. Thanks for not just nodding.", points: 45 },
        { label: "I'm just glad you're here", reply: "...That's not an answer. ...It's a nice one, though. I'll take it.", points: 25 },
      ],
    },
    {
      id: "ingrid-crew",
      minHearts: 6,
      ask: "I could write to my old crew. Might be they don't want to hear from me. Should I?",
      choices: [
        { label: "Write. Tonight", reply: "Tonight. Right. No sense letting the metal cool. ...You'll check the spelling? Smiths aren't scribes.", points: 50 },
        { label: "Go and see them", reply: "Walk into the Company works? The foreman would have kittens. ...Might be worth it for his face. I'll think on it.", points: 35 },
        { label: "Give it time", reply: "It's been two years. Time's had its go. ...But you're right. No sense rushing a weld.", points: 15 },
      ],
    },
  ],
  milestones: [
    "Sharpened your axe while you weren't looking. It was a disgrace. It isn't now.",
    "Made you a rune-hammer. Small. Balanced. Your initials on the grip. Don't make a thing of it.",
    "Wrote to Dagny. Three lines. Took me all evening. Hammering's easier.",
    "Pell wrote back. One line: 'Took you long enough.' ...Best letter I've ever had.",
    "I walked out of the Company with a hammer and a temper. Thought I'd work alone the rest of my days. Then you built me a forge in a valley full of people worth making things for. You're my crew now. First name on the list. That's the truest thing I've got.",
  ],
};
