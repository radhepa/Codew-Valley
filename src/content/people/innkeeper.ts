import type { Person } from "../types.ts";

export const BRAM: Person = {
  id: "innkeeper",
  name: "Bram",
  title: "Innkeeper of the Sleepy Serpent",
  home: "tavern",
  traits: ["big-hearted", "proud of his stew", "full of road stories", "won't talk about his sister"],
  voice: "Booming and warm; cooking metaphors for everything; calls people 'friend'; tells caravan stories that wander off; goes quiet and gruff whenever family comes up.",
  likes: ["a full dining room", "wild garlic", "a good story told twice", "cider by the fire"],
  dislikes: ["cold soup", "people who skip breakfast", "talking about Hazel"],
  want: "To find out what happened to his old caravan crew. He took a wrong turn one winter, they kept going, and he never saw them again.",
  talk: [
    [
      "Sit, sit! Nobody leaves the Serpent hungry. House rule. I made it up just now, but it's a rule.",
      "Twenty years on the caravan roads, and I never once had a kitchen that stayed put. This one doesn't even rattle.",
      "Stew's the same as code, friend. Get the order wrong and it tastes like regret.",
      "Pip keeps sniffing at my pot. I don't think snakes eat stew. Pip says it's 'research'.",
    ],
    [
      "You know what makes a good inn? Not the beds. Not the roof. It's who keeps coming back through the door. So keep coming back, eh?",
      "Our caravan cook before me used to say: salt early, taste often. I think that's how you write your Python too. Run early, run often.",
      "I tried writing a recipe in your Python last night. Pip says 'add_more_garlic' isn't a real function. I say it should be.",
      "We crossed the Saltgrass Flats once with nothing but onions and optimism. The onions held out longer.",
    ],
    [
      "I don't say this to many folk, but I'm glad I got lost on that road. If I hadn't, I'd never have found this valley. Or you.",
      "Had a crew of six, once. Old Tamsin, the twins, Gorran who sang all night... I wonder where the road took them.",
      "You've got flour on your sleeve and ink on your fingers. You're turning into a proper villager.",
      "Some nights the Serpent's so full of laughing I have to step outside just to hear myself think. Best problem I've ever had.",
    ],
    [
      "You're family here, friend. Not 'like family'. Family. There's a mug on the shelf with your name on it. Well, a snake on it. Pip painted it.",
      "If I ever find the old crew, the first thing I'll do is cook for them. The second thing is tell them about you.",
      "You built me a home with your own words. I'm not a crying man, but I've cut a lot of onions lately and I'm not cutting any right now.",
      "When my sister... never mind. Another time. Maybe soon. You make a fellow want to be braver.",
    ],
  ],
  rain: [
    "Rain's good for business! Nothing brings folk in like a wet road and the smell of soup.",
    "Hear it on the roof? Thatch holds. You did good work, friend.",
  ],
  evening: [
    "Evening crowd's the best crowd. Grab a seat by the fire before Pip claims it.",
    "Lamps are lit, stew's on, and the day's work is done. That's my favourite sum.",
  ],
  questions: [
    {
      id: "bram-stew",
      minHearts: 0,
      ask: "Right, honest answer, friend: what's the best part of a stew?",
      choices: [
        { label: "The bread for dipping", reply: "A dipper! A person of culture. My sister used to say the same. ...Anyway! More bread for you.", points: 30 },
        { label: "The spices", reply: "Ah, you've got a nose for it. Wild garlic, a pinch of smoked salt. Our secret.", points: 25 },
        { label: "I don't really like stew", reply: "You... what? In MY tavern? I'll pretend I didn't hear that. I'll find the stew that changes your mind.", points: 5 },
      ],
    },
    {
      id: "bram-road",
      minHearts: 3,
      ask: "Do you ever miss wherever you came from before this valley?",
      choices: [
        { label: "Sometimes", reply: "Aye. Me too. Missing a place means it was good to you. Nothing wrong with keeping a little of it.", points: 35 },
        { label: "Not really. This is home now", reply: "Ha! That's how I feel. Funny how a place finds you when you stop looking.", points: 30 },
        { label: "Do you miss your crew?", reply: "...Every day, friend. Every single day. Thanks for asking. Nobody ever asks.", points: 45 },
      ],
    },
    {
      id: "bram-hazel",
      minHearts: 6,
      ask: "Can I ask you something? If you'd said something hard to someone you loved, years ago... would you be the first to say sorry?",
      choices: [
        { label: "Yes, even if it's hard", reply: "Even if it's hard. Aye. That's what I'd tell anyone else, isn't it? Funny how it sounds different when it's you.", points: 50 },
        { label: "Only if they were wrong too", reply: "Maybe. We were both stubborn as old bread. Still. Somebody has to break first.", points: 20 },
        { label: "Is this about your sister?", reply: "...You're sharper than you look, friend. Yes. Her name's Hazel. Let's leave it there for now.", points: 35 },
      ],
    },
  ],
  milestones: [
    "Here, I've started setting a bowl aside for you every evening. Don't argue. It's done.",
    "I told you about the Saltgrass Flats, didn't I? Well, now you're one of the few who knows the whole true version.",
    "You know, I've got a letter I never sent. Ten years old. Maybe one day I'll show you.",
    "I carved your name into the beam above the fire. Everyone who sits there will know who built this place.",
    "Whatever road brought you here, I'm grateful to it. You're the best thing that's happened to this old cook.",
  ],
};
