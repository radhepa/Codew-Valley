import type { Person } from "../types.ts";

export const SABLE: Person = {
  id: "merchant",
  name: "Sable",
  title: "Trader of the Market Square",
  home: "market",
  traits: ["fast-talking", "nose for a bargain", "secretly sentimental", "keeps a ledger for everything"],
  voice: "Rapid-fire and breathless; piles ideas up with commas and 'and, and'; puts a price on everything, then gives half of it away; calls the player 'partner'; thinks in lists, ledgers and rules numbered one to three; only slows down, and gets prickly, when Fennick comes up.",
  likes: ["a fair haggle", "shiny buttons", "a full ledger", "rumours with the ink still wet", "honey cakes"],
  dislikes: ["fixed prices", "empty stalls", "being undersold", "hearing the name Fennick"],
  want: "To finally beat Fennick Gale, their old rival from the Lantern Road fairs, who undersold them at every market for ten years. Sable says it's about winning. It isn't, quite: Fennick was the only one who ever kept up.",
  talk: [
    [
      "Partner! Just the face I wanted. Buttons, ribbons, a teapot that whistles in two keys at once, make me an offer, any offer, well, not any offer.",
      "Empty valley, new market, nobody selling anything yet? That's not a problem, partner. That's an opportunity with its coat still on.",
      "I keep my stock in a list, my prices in a dict, and my opinions in my mouth. Two of those are tidy.",
      "Pip tried to trade me a shiny pebble for a ribbon. I took it. Don't tell anyone I'm soft, it's terrible for business.",
    ],
    [
      "You know what sells best? Not silk, not spice. A story. Tell folk where a thing came from and they'll pay double, and honestly, they should!",
      "Rule one of trading: know what a thing's worth. Rule two: know what it's worth to them. Rule three... I'll tell you rule three when you buy something.",
      "Traders talk, and traders are talking about this valley. 'A village coming back from nowhere.' Do you know what that does for footfall? Wonderful things, partner.",
      "Counted my coins three times this morning and got three different answers. I should write a function for that. Don't tell me I should write a function for that.",
    ],
    [
      "Between you and me, I've never stayed anywhere more than a season. Pack the stall, load the cart, off I go. I haven't loaded the cart in months. Huh.",
      "Lord Vane tried to haggle with me over a pair of gloves. Pompous man, dreadful haggler, I almost felt sorry for him. Almost. He paid full price.",
      "There was a trader on the Lantern Road, Fennick Gale. Undersold me at every fair for ten years. Not that I'm counting. I'm counting.",
      "I've written you into my ledger. Not as a debt, don't look like that! Under 'assets'. Top of the column.",
    ],
    [
      "Everything has a price, I used to say. Then you came along and ruined that for me. Thank you. I think. I'll check the ledger.",
      "If Fennick ever turns up at this market, I want you standing right next to me. For moral support. And to stop me giving them a discount.",
      "Gave a family a whole basket of apples today and charged them one smile. One smile! I'm losing my edge, partner, and I don't even mind.",
      "First stall I've ever had that doesn't have wheels. I keep checking. Still no wheels. Best deal I ever made.",
    ],
  ],
  rain: [
    "Rain! Terrible for silk, wonderful for umbrellas, and guess who stocked up on umbrellas last week. Go on, guess.",
    "Slow day, wet stall, nobody to haggle with. You'll have to do, partner. Pick a button, any button, I'll overcharge you lovingly.",
  ],
  evening: [
    "Closing time's the best time. Count the till, cover the stall, tell the cat the day's news. There's no cat. I'm working on it.",
    "Evening market's where the real deals happen. Lanterns make everything look more valuable. Including me.",
  ],
  questions: [
    {
      id: "sable-haggle",
      minHearts: 0,
      ask: "Quick one, partner, first impressions matter: do you haggle, or do you pay the price on the tag?",
      choices: [
        { label: "Always haggle", reply: "A professional! Oh, we're going to get along, and I'm going to have to watch my margins around you.", points: 40 },
        { label: "Pay the tag", reply: "Bless you. Honest, generous and terrible for my soul. I'll knock a copper off anyway, don't tell anyone.", points: 20 },
        { label: "There are tags?", reply: "Ha! No. There aren't. I decide the price when I see your face. You've got an expensive face. That's a compliment.", points: 30 },
      ],
    },
    {
      id: "sable-rival",
      minHearts: 3,
      ask: "Hypothetically. If someone undersold you at every market for ten years, would you get even, or get over it?",
      choices: [
        { label: "Get even", reply: "Yes! Thank you! Someone sensible at last. ...Although it sounds a bit petty out loud. Hm.", points: 25 },
        { label: "Get over it", reply: "Over it. Right. Easy. Done. ...Not done. I'll work on it. I'll put it in the ledger.", points: 20 },
        { label: "Sounds like you miss them", reply: "Miss them? Fennick? I... oh, that's very rude of you, being right. Nobody else ever kept up with me, alright? There. Happy?", points: 45 },
      ],
    },
    {
      id: "sable-worth",
      minHearts: 6,
      ask: "I've priced every single thing I've ever owned. So, partner: what's the most valuable thing in this market?",
      choices: [
        { label: "The friends you've made here", reply: "Oh, don't. Don't do that, I've a stall to run and now my eyes are leaking. ...Yes. Obviously. Top of the column.", points: 50 },
        { label: "Your ledger", reply: "Smart answer! Twenty years of trading in one book. Mostly prices. A few feelings, in the margins.", points: 30 },
        { label: "The two-key teapot", reply: "You remembered the teapot! Nobody remembers the teapot. It's yours. Free. I'll be sick about it later.", points: 25 },
      ],
    },
  ],
  milestones: [
    "I put a little sign on the stall: 'Friends of the Founder, ten percent off.' There's one friend of the Founder on the list. It's you.",
    "I let you see the real ledger today. Not the one I show customers. That's more trust than I give my own mother, partner.",
    "I wrote to Fennick. A short note. Very businesslike. Two lines. Took me nine drafts.",
    "Bought a hammer and nails today. For a shelf. In a house. That I'm staying in. Do you know how strange that is for me?",
    "Twenty years on the road and I never kept a thing I couldn't sell. Then you gave me somewhere to stay, and I found the one thing I'd never part with at any price. It's you, partner. Obviously. Don't make me say it twice.",
  ],
};
