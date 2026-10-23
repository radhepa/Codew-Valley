import type { Person } from "../types.ts";

export const MIRELA: Person = {
  id: "herbalist",
  name: "Mirela",
  title: "Herbalist of the Apothecary",
  home: "apothecary",
  traits: ["gentle", "talks to plants", "notices everything that grows", "forgets to eat"],
  voice: "Soft, slow and dreamy; turns mid-sentence to speak to a plant by name, then back to you; passes on what the plants 'said' as plain fact; sees roots, seasons and growing in everything; firm as an oak only when someone treads on a seedling.",
  likes: ["rainwater in a barrel", "chamomile at dusk", "being listened to by things with roots", "muddy knees"],
  dislikes: ["trodden seedlings", "shouting near the greenhouse", "an early frost"],
  want: "To grow a true healer's garden: one bed of every herb that ever grew in this valley. She carries a book of pressed leaves for the ones she hasn't found yet.",
  talk: [
    [
      "Oh, hello. Mind the mint, it's shy. There. Now it's waving. That's mint for 'welcome'.",
      "Plants grow better when someone talks to them. I read that in a book once, and then the plants told me it was true, so now I'm sure.",
      "The sage says you've been working too hard. I'm only passing it on. Sage is very blunt.",
      "I keep a list of every plant in the greenhouse. Adding one is easy, you just append it to the end. Taking one off makes me sad for a week.",
    ],
    [
      "The yarrow perked up when you walked past. It doesn't do that for everyone. It doesn't do that for me, and I water it.",
      "A garden's a bit like your Python, I think. Plant something small, wait, look, try again. Water, wait, repeat. It just takes longer to run.",
      "Bram brought me a wild garlic bulb, so I planted it by the door. He comes to visit it. I think he's making sure it's treated well.",
      "The flowers on the north side lean away from the hill, the way you'd lean away from a draught. I've asked them why. They go very quiet.",
    ],
    [
      "I used to think I talked to plants because people were hard. Now I think I just like being listened to. You listen too. You'd make a lovely fern.",
      "My mother grew herbs on a windowsill in the city. Three pots and a dream. She'd have cried to see this greenhouse. Happy crying. The pots would have too.",
      "When the grey fog drifts down from the hill, the leaves curl up tight. When you speak runes nearby, they open again. I've written that in my notebook twice, and underlined it.",
      "I keep digging up old clay pots with runes scratched on them. Somebody grew herbs here long before me. I like to think they talked to them too.",
    ],
    [
      "This garden started as a list of what I'd lost. Now it's a list of who visits. You're near the top. Just under the bees. The bees were here first.",
      "I've pressed a flower for every day you came up the greenhouse path. The book's getting very thick. I'll need a second book. I'm not complaining.",
      "The plants know your footsteps now. When you come up the path, the whole greenhouse rustles. I tell people it's the wind. It isn't.",
      "When the garden's finished, I'll keep one bed with nothing useful in it at all, just somewhere for you to sit. Even healers need a place to rest. That's what the chamomile says, anyway.",
    ],
  ],
  rain: [
    "Rain! Listen to them drink. That's the happiest sound a garden makes. The second happiest is someone saying thank you to it.",
    "I leave the greenhouse door open in the rain so the seedlings can hear it. They like to know what they're missing.",
  ],
  evening: [
    "Evening's when the night-scented stock wakes up. It's a terrible show-off. Come and smell it.",
    "I read to the herbs before bed. Tonight it's a book about soil. They find it gripping.",
  ],
  questions: [
    {
      id: "mirela-plant",
      minHearts: 0,
      ask: "If you were a plant, which would you be? The basil wants to know. The basil is very nosy.",
      choices: [
        { label: "Something that heals", reply: "A healer's answer. Chamomile, maybe, or feverfew. The basil approves. It says you'd go nicely with tomatoes.", points: 40 },
        { label: "A big old oak", reply: "Deep roots and lots of birds to talk to. That's a good life. The basil's a little jealous, I think.", points: 30 },
        { label: "A cactus. Leave me be", reply: "Ha! Cacti are softer than they look, you know. They just need fewer visits. I'll visit anyway.", points: 15 },
      ],
    },
    {
      id: "mirela-listen",
      minHearts: 3,
      ask: "Be honest with me. Do you think the plants really listen?",
      choices: [
        { label: "Of course they do", reply: "I know they do. But it's nice to hear someone else say it. Thank you. The fern says thank you too.", points: 45 },
        { label: "Maybe you're the one listening", reply: "Oh. Oh, that's lovely. Maybe that's the same thing, in the end.", points: 35 },
        { label: "Not really, but it's sweet", reply: "That's all right. You don't have to believe it. Just don't say so near the roses. They're sensitive.", points: 10 },
      ],
    },
    {
      id: "mirela-garden",
      minHearts: 6,
      ask: "Some of the herbs in my pressed-leaf book might not grow anywhere any more. Should I keep looking for them?",
      choices: [
        { label: "Keep looking. Things come back", reply: "Things come back. Yes. This whole valley came back, didn't it? I'll keep the book open.", points: 50 },
        { label: "Can I help you look?", reply: "You'd do that? Then we'll go walking on the dry days. Bring a trowel. And boots. And a great deal of patience.", points: 45 },
        { label: "Love the ones you have", reply: "That's wise. Wise as an old root. I'll try. I'll still peek at the book now and then.", points: 25 },
      ],
    },
  ],
  milestones: [
    "The mint asked after you today. I told it you were busy building things. It sulked. Mint sulks, you know.",
    "Here, I've potted a cutting for your windowsill. Talk to it now and then. It'll tell me if you don't.",
    "I showed you my pressed-leaf book, didn't I? I don't show anyone. Even the plants only get to see their own pages.",
    "I've named the new rose after you. It's a little prickly at first, and then it's the sweetest thing in the garden. I didn't plan that. It just grew that way.",
    "I came to this valley to grow a garden. I never thought I'd grow a home as well. You're the best thing that's ever taken root here. The plants agree. It was unanimous.",
  ],
};
