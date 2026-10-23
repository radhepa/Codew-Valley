import type { Person } from "../types.ts";

export const THISTLE: Person = {
  id: "mayor",
  name: "Thistle",
  title: "Mayor (by a landslide)",
  home: "townhall",
  traits: ["elderly and unstoppable", "loves a good speech", "keeps minutes of everything", "always campaigning"],
  voice: "Grand, old-fashioned oratory with a twinkle; opens with 'Ahem!' and calls everyone 'citizen'; quotes votes, motions and the minutes of meetings nobody else attended; wanders into long anecdotes and catches the thread too late; under the bluster, quietly worried about being an old mayor nobody needs.",
  likes: ["a well-attended meeting", "a rubber stamp with a satisfying thunk", "cutting ribbons", "peppermint humbugs"],
  dislikes: ["being interrupted mid-speech", "rain on polling day", "the words 'early retirement'"],
  want: "To win re-election, and to know the town truly wants an old mayor. Thistle took seven votes of eight last time and has been campaigning ever since.",
  talk: [
    [
      "Ahem! Welcome, citizen. Seven votes out of eight. A landslide, the papers would say, if we had papers. I'm working on papers.",
      "I arrived on a Tuesday and was elected on the Wednesday. Nobody else stood. I like to think it was the speech.",
      "As your mayor, I promise three things: honest records, open doors, and a humbug for anyone who sits through an entire meeting.",
      "I've kept the minutes of every meeting I ever attended. Some of those meetings were just me and a duck. The duck made some very good points.",
    ],
    [
      "A firm handshake and you read the fine print. Two qualities I admire in a citizen. Three, if you count turning up, which I always do.",
      "Your Python keeps records in files, I'm told. Open one, write it down, close it after, or use 'with' and it closes itself. Very tidy. I'd vote for 'with'.",
      "When I was mayor of Lower Puddlecombe... well, deputy mayor... well, I chaired the turnip committee. Experience is experience, citizen.",
      "A good mayor listens more than they talk. I read that somewhere. I'd tell you where, but it's a long story, and I'm practising the listening part.",
    ],
    [
      "A place isn't really a town until people argue about where the benches go. We had our first bench argument yesterday. I've never been so proud.",
      "I've written every name on our register by hand. Yours I wrote twice. The first one wobbled. My hands aren't what they were.",
      "Between us, I'm not sure I'm a very good mayor. I'm just the one who stands up when the room goes quiet. Somebody has to.",
      "Some of the old stones round here have names carved on them, bold as you like. I hope someone looks at my little signatures that way one day.",
    ],
    [
      "Ahem. I have prepared a speech about what you mean to this town. It is fourteen pages. I'll spare you. The short version is: everything.",
      "When the next election comes, I've decided I don't need to win. Well. I'd like to. But I'd like even more to see this town choose for itself.",
      "People used to say 'old Thistle' like it was a warning. Here they say it like a nickname. That's your doing, I suspect.",
      "If you ever stood for mayor, I'd campaign for you. I'd also be secretly furious. Mostly the first thing.",
    ],
  ],
  rain: [
    "Rain on polling day is a mayor's worst nightmare. It isn't polling day. I simply like to be prepared to worry.",
    "A wet town hall is a full town hall. Everyone comes in to dry off and then, aha! The agenda.",
  ],
  evening: [
    "Evening is for reading the day's minutes back to myself. Today's highlight: two citizens agreed on something. I've underlined it.",
    "Lamps lit, doors open. As your mayor, I declare this evening officially pleasant. Motion carried.",
  ],
  questions: [
    {
      id: "thistle-vote",
      minHearts: 0,
      ask: "Ahem. Purely hypothetically, citizen: if there were an election tomorrow, who would get your vote?",
      choices: [
        { label: "You, Mayor", reply: "Ha! Splendid! I'll have that in writing. No, no, I won't. Secret ballot. But I'll remember the look on your face.", points: 40 },
        { label: "Whoever has the best ideas", reply: "A principled voter! Marvellous. Infuriating, but marvellous. I suppose I'll have to come up with better ideas.", points: 30 },
        { label: "Pip", reply: "Pip?! Pip can't even reach the ballot box. ...Pip's been campaigning, hasn't it. I knew it. The humming.", points: 15 },
      ],
    },
    {
      id: "thistle-speech",
      minHearts: 3,
      ask: "I'm drafting a speech for the whole town. Should it be short and sweet, or long and grand?",
      choices: [
        { label: "Long and grand", reply: "A citizen of taste! I'll add a section about the benches. And one about the duck.", points: 45 },
        { label: "Just say what you mean", reply: "Just say what I mean? In my entire career nobody has suggested that. It's radical. I'll try it on Thursday.", points: 35 },
        { label: "Short and sweet", reply: "Short. Yes. Very modern. I'll cut it down to nine pages.", points: 20 },
      ],
    },
    {
      id: "thistle-old",
      minHearts: 6,
      ask: "Can I ask you something, not as your mayor? Does a town want an old leader, or a new one?",
      choices: [
        { label: "A good one. That's you", reply: "...Thank you. I'll pretend that's pollen in my eye. There's a great deal of pollen about. Mirela's been busy.", points: 50 },
        { label: "Ask the voters", reply: "Ha! The proper answer. Democracy. I suppose I'll have to keep earning it, then. Good. I like earning it.", points: 40 },
        { label: "Someone new, one day", reply: "One day. Yes. When it's time, I'd like to hand the keys to someone kind. Not yet, mind. Not quite yet.", points: 25 },
      ],
    },
  ],
  milestones: [
    "I've entered you in the town register as 'Founder, Citizen, and Good Egg'. The last part isn't official. It is now. I stamped it.",
    "Here, a humbug. Don't tell anyone, I only give these out after full meetings. You've earned an honorary meeting.",
    "I read you a page of my old minutes, didn't I? From the turnip committee. Nobody's heard those since the turnips.",
    "A secret from the ballot box. The one vote I didn't get? I cast it myself. I voted for Bram. It felt rude to vote for myself.",
    "I've given a great many speeches, and I've never known how to give this one. You turned this valley into a town, and you made an old mayor feel needed again. Thank you, citizen. Thank you, friend. Motion carried, unanimously.",
  ],
};
