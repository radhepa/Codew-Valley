import type { Person } from "../types.ts";

export const ODO: Person = {
  id: "librarian",
  name: "Odo",
  title: "Keeper of the Scribe's Library",
  home: "library",
  traits: ["absent-minded", "endlessly curious", "covered in ink", "never finishes a sentence (or a book)"],
  voice: "Rambling and delighted; starts a thought, wanders down a side-path, then asks 'where was I?'; adds spoken footnotes ('Footnote: ...'); forever losing his spectacles (they're on his head); loves odd facts, old words and the comment lines in your code; goes shy and changes the subject when his unfinished book comes up.",
  likes: ["a fresh pot of ink", "wide margins", "footnotes", "people who ask follow-up questions", "tea he forgets to drink"],
  dislikes: ["dog-eared pages", "being asked 'is it finished yet?'", "damp", "endings (in his own writing)"],
  want: "To finish his book, 'A Gentle History of Forgotten Alphabets'. He started it thirty-one years ago, it runs to nine hundred pages, and it still has no last chapter, because every time he gets close he finds one more footnote.",
  talk: [
    [
      "Ah! Hello! You must be the, er, the one who, yes, the Founder! I was just looking for my spectacles. Footnote: they were on my head. They usually are.",
      "Did you know 'library' comes from an old word for the inner bark of a tree, which people once wrote on? Lovely, isn't it? I've forgotten why I brought it up. Also lovely.",
      "I've been reading over your shoulder. Your comments! The little lines after a hash. Python skips them entirely, but people read them. Notes to the future. A scholar's favourite thing.",
      "Pip asked me what my book is about. I talked for forty minutes. Pip fell asleep. Very politely, though.",
    ],
    [
      "A Python list starts counting at zero. Zero! So my book now has a chapter zero. It's the preface. I'm terribly pleased about it.",
      "Footnote: yes, there's ink on my nose. There's been ink on my nose since I was about twelve. It's structural now.",
      "These shelves are so beautifully empty. Every empty shelf is a promise, you know, a sort of... where was I? Shelves. Yes. Lovely.",
      "Old books smell faintly of vanilla. Something in the paper, breaking down very slowly. I find that comforting. Things can grow old and still smell sweet.",
    ],
    [
      "My book? Oh, it's, ah, coming along. Nine hundred pages. Thirty-one years. Very nearly done. Is that a bird? Look, a bird.",
      "I found a word in an old carving this week that nobody's said aloud in centuries. So I said it, very quietly, just so it wasn't lonely.",
      "You ask follow-up questions. Do you know how rare that is? Most people ask one and then edge towards the door. You stay for the footnotes.",
      "I've started writing down everything you learn, in the margins of my notes. Purely for scholarly reasons. Also because I'm proud of you. Mostly the second one.",
    ],
    [
      "I think I've been afraid to finish my book. Once it's done, it can be wrong. While it's unfinished, it's only... hopeful. Footnote: that's a very silly reason. I know.",
      "If I ever do finish, you're in the dedication. 'To the Founder, who asked how it ends.' The ink's already dry. Somewhere. I've lost the page.",
      "Spectacles! Found them. On my head. You told me to look up. You're very good at reminding people to look up.",
      "A book is a letter to someone you'll never meet. A friend is a letter that writes back. I prefer the second sort, I've discovered. Rather late. But not too late.",
    ],
  ],
  rain: [
    "Rain! Everyone indoors with a book, I hope. Footnote: not near the window. Damp is the enemy. Well, an enemy. A soggy one.",
    "Perfect reading weather. I've made tea. I'll forget to drink it. That's part of the ritual.",
  ],
  evening: [
    "Is it evening already? I sat down after lunch to check one tiny date. I've read four books. The date's still wrong.",
    "Candlelight on old pages. Best light there is for reading. Worst light there is for finding spectacles.",
  ],
  questions: [
    {
      id: "odo-margins",
      minHearts: 0,
      ask: "Forgive me, quick question, purely for research, very important: do you write in the margins of books?",
      choices: [
        { label: "Never. It's rude", reply: "Ah, a preservationist! Very proper. Very tidy. Slightly heartbreaking. Margins are where a book gets to talk back!", points: 20 },
        { label: "All the time", reply: "Oh, wonderful! A fellow scribbler! Footnote: future scholars will treasure your notes. Probably. Do write neatly.", points: 40 },
        { label: "Only in pencil", reply: "Pencil! A diplomat. Notes for now, rubbed out later if need be. I approve. With a small asterisk.", points: 30 },
      ],
    },
    {
      id: "odo-learning",
      minHearts: 3,
      ask: "When you learn something new, what's the very first thing you do with it?",
      choices: [
        { label: "Tell someone", reply: "Yes! Yes! Knowledge kept in a drawer just goes musty. I tell Pip things. Pip mostly listens. It counts.", points: 45 },
        { label: "Write it down", reply: "A note-taker! My people. Footnote: then you lose the note. That's my method, anyway.", points: 35 },
        { label: "Try it out", reply: "Practical! Like your Python: read it, then run it. I tend to read it, then read about it, then read about the reading. Different method.", points: 30 },
      ],
    },
    {
      id: "odo-ending",
      minHearts: 6,
      ask: "Hypothetically, if a book had nine hundred pages and no last chapter, would you... would you still read it?",
      choices: [
        { label: "Yes, and help you write the end", reply: "Help? You'd... oh. Oh, that never occurred to me. A book doesn't have to be finished alone. Footnote: I may need to sit down.", points: 50 },
        { label: "I'd want an ending", reply: "Yes. Yes, everyone does. That's the trouble. Endings are so very... final. I'll try. I'll try harder.", points: 25 },
        { label: "The middle's the best part", reply: "Ha! Exactly what I keep telling my publisher! Footnote: I don't have a publisher. It's what I keep telling myself.", points: 30 },
      ],
    },
  ],
  milestones: [
    "I've lent you my second-best pen. Footnote: my best pen is lost, so really it's my best pen. Guard it.",
    "I read you a page of my book today and you didn't fall asleep. Pip did. You didn't. I've written that down.",
    "I found my old notes for the last chapter. They were in my hat. I've been wearing them for six years.",
    "I wrote three whole pages of the final chapter last night. No footnotes. Well, one. It's about you.",
    "Thirty-one years I've written about people who handed words down to one another, and I never had anyone to hand mine to. Then you walked into my library and asked how the story ends. I still don't know. But I know who I want to tell first. Footnote: it's you. It was always going to be you.",
  ],
};
