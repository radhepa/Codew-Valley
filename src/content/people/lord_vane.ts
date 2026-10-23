import type { Person } from "../types.ts";

export const VANE: Person = {
  id: "lord_vane",
  name: "Vane",
  title: "Lord of the Vane Trading Company",
  home: "market",
  traits: ["pompous", "devoted to paperwork", "secretly lonely", "better than he lets on"],
  voice: "Stiff, formal and long-winded; speaks in clauses, sub-clauses and 'per regulation'; offers a form for everything and notes things 'for the record'; tries very hard not to be charmed and fails. As he warms, short honest sentences slip out and seem to surprise him. Goes vague about his family and very awkward about mills.",
  likes: ["a fresh ream of paper", "a crisp wax seal", "correct indentation", "being asked his opinion"],
  dislikes: ["smudged ink", "mud on his boots", "windmills (he will not say why)"],
  want: "To set right what his grandfather did. His grandfather (with eleven greats in front, by the Company's count) once left this valley behind, and Aldous has come to believe the valley paid for it.",
  talk: [
    [
      "Lord Aldous Vane, Vane Trading Company. You may call me Lord Vane. You may also call me 'Your Lordship', but there's a form for that.",
      "Per the writ: no royal charter by midsummer, and the valley reverts to the Company. Nothing personal. It's all in triplicate, which is the very opposite of personal.",
      "I have inspected your market. The stalls are charming. The signage is non-compliant. I've drafted you a pamphlet. Forty pages. Light reading.",
      "The serpent hissed at me. Then it apologised. Then it hissed again, more politely. I've logged it as a formal complaint and a formal apology.",
    ],
    [
      "A dictionary, I'm told, pairs every key with a value. A ledger with better posture. I find I rather approve of dictionaries.",
      "Head office hasn't written in four months. Excellent. It means everything is in order. Presumably. I check the post twice a day regardless.",
      "The miller looks at me as though I were an unpaid bill. I have been avoiding the mill. Windmills unsettle me. All that... turning.",
      "The Company's oldest ledgers mention this valley. A great many pages, in an old family hand. I haven't read them all. I find I don't wish to, just yet.",
    ],
    [
      "I had tea at the tavern. Bram asked how I was. Nobody has asked me that in years. I said 'adequate'. I meant 'better, now'.",
      "My grandfather (eleven greats in front of that word; the Company counts them) once lived in this very valley. He left. The family never said why. I'm beginning to think I know.",
      "There is a form for nearly everything. There is no form for 'I was wrong'. I have begun drafting one. It is the hardest paperwork of my life.",
      "Your code is clear enough that someone else could read it and learn. Do you know how rare that is? My family kept what it knew locked in a drawer. I'm starting to see the cost.",
    ],
    [
      "My grandfather was one of the speakers who left this valley, and he took the Old Tongue with him. I can't undo that. But I can help you teach it.",
      "I have written to head office about a certain mill with a blue door. Forty-one forms. I've finished forty. The last needs her signature, and I haven't yet found the courage to ask.",
      "I used to think a man was measured by his ledgers. Now I think it's by who would notice if he stopped visiting. You would. I checked. Informally. Without a form.",
      "Aldous. Call me Aldous. There's no form for that either. I've decided some things shouldn't need one.",
    ],
  ],
  rain: [
    "Rain. My boots. My papers. My dignity. One of the three is waterproof, and it is not the dignity.",
    "My umbrella bears the Company crest. It leaks. I have filed a complaint against myself.",
  ],
  evening: [
    "In the evenings I go over the day's accounts by candlelight. Everything balances. It always balances. It's very quiet, balancing.",
    "At sunset your villagers all wave to each other across the square. Is that required? There is no regulation. They simply do it. Remarkable.",
  ],
  questions: [
    {
      id: "vane-forms",
      minHearts: 0,
      ask: "A question, for the record. Do you, or do you not, enjoy filling in forms?",
      choices: [
        { label: "Actually, yes", reply: "You... do? Truly? Splendid. That is, adequate. That is... would you care to see my stamp collection? Official stamps. Not the postal sort.", points: 45 },
        { label: "Depends on the form", reply: "A connoisseur. Yes. A well-designed form is a joy; a poor one is an insult to ink. We understand each other.", points: 35 },
        { label: "Not really", reply: "Hm. Noted. Most people say that. Most people are mistaken, but they are entitled to be mistaken on the correct form.", points: 15 },
      ],
    },
    {
      id: "vane-villain",
      minHearts: 3,
      ask: "Off the record, if there is such a thing: am I the villain of this valley?",
      choices: [
        { label: "You could be on our side", reply: "Your side. Hm. I've never been on a side that wasn't a ledger column. I shall consider it. Carefully. In writing.", points: 45 },
        { label: "No. Just very busy", reply: "Very busy. Yes. That's a kinder summary than my file deserves. Thank you.", points: 35 },
        { label: "A little bit, yes", reply: "Ah. Honesty. Bracing, like cold water on the face. Well, I did ask. I shall endeavour to be less of one.", points: 20 },
      ],
    },
    {
      id: "vane-amends",
      minHearts: 6,
      ask: "Suppose someone in your family did a great wrong, long ago. Would it be yours to set right?",
      choices: [
        { label: "Not undo it. Help now", reply: "Help now. Not undo, help. I believe I can manage that. I have a great deal of paper and, lately, some good intentions to fill it with.", points: 50 },
        { label: "Only if you want to", reply: "Want to. Hm. I find that I do. I'm as surprised as you are. More, probably. I've known me longer.", points: 40 },
        { label: "No. You aren't them", reply: "I'm not, no. It's kind of you to say. But I carry the name, and names come with a ledger of their own.", points: 30 },
      ],
    },
  ],
  milestones: [
    "I have issued you a Company pass. It grants access to nothing in particular. But it bears my seal, and I don't give my seal to just anyone.",
    "Here. A fountain pen, my second best. The best is for signing contracts. This one is for writing to friends. It's barely been used. I should like that to change.",
    "I told you about the ledgers in my family's old hand, didn't I? I've read them now. All of them. I'd rather not discuss it yet. I only wanted you to know I read them.",
    "I've taken the Company crest off my coat. Not out of shame. I'd simply rather people saw me first. You did. Long before I deserved it.",
    "My grandfather left this valley and never came back. I came here to take it, and instead it took me in. I've kept records all my life, and you are the one entry I would never let anyone strike out. Thank you, friend. Truly. No form required.",
  ],
};
