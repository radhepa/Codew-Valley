import type { Person } from "../types.ts";

export const PIP: Person = {
  id: "pip",
  name: "Pip",
  title: "Keeper of the last rune stone",
  traits: ["chatty", "dramatic", "secretly ancient", "never far from the stone"],
  voice: "Quick, warm and theatrical; repeats words when excited (hello hello); hums when nervous; dodges questions about the north hill and the old days. Gives hints, never answers.",
  likes: ["warm stones in the sun", "hearing runes spoken aloud", "a well-placed indent", "Bram's stew (the smell, anyway)"],
  dislikes: ["the north hill", "the word 'quiet'", "cold mornings"],
  want: "To see the whole valley with their own eyes. Pip has never once left the rune stone, and won't say why.",
  talk: [
    [
      "Every word of Python you learn, the stone hums a little louder. Can you hear it? No? Put your ear closer. Closer. That's a stone. Lovely, isn't it?",
      "I'd help carry the logs, but I'm mostly tail. Very supportive tail, though.",
      "Did you know a variable is just a name with a promise? You promise to remember, and Python does the remembering. Good deal.",
      "Don't mind me. I'm just keeping the stone warm. It's a full-time job. Very important. Very... stony.",
    ],
    [
      "You're getting good, you know. Last week you'd have stared at an error for an hour. Now you squint at it for five minutes. Growth!",
      "When you speak to the stone, I get a little tingle in my scales. Like sunshine, but from the inside.",
      "Bram gave me a crust of bread today. I don't eat bread. I held it for an hour out of politeness.",
      "Sometimes I dream in Python. Last night it was a loop. A nice one. It ended. Not all of them do.",
    ],
    [
      "I've watched this valley for a very long time. Longer than I let on. It's never looked this alive.",
      "Can I tell you something? When you first walked up the path with that deed, I hid behind the stone. I thought I'd forgotten how to talk to people.",
      "The north hill? Oh, it's just a hill. Grass, rocks, a view. Let's talk about something else. Anything else. Do you like soup?",
      "You read error messages now instead of panicking. Do you know how rare that is? Some of the old speakers never learned.",
    ],
    [
      "If I could leave the stone, do you know where I'd go first? Everywhere. All at once. I'd be very tired.",
      "Three hundred years is a long time to talk to yourself. You've ruined me for it. I like the answering back too much now.",
      "Whatever happens up on that hill, I'm glad it was you who came. I wanted you to know that while I can still say it plainly.",
      "You're not my student any more, not really. You're a speaker. A real one. I'm allowed to be a bit misty about it.",
    ],
  ],
  rain: [
    "Rain! The stone loves rain. Makes the runes shine. I love it slightly less. Scales and puddles don't mix.",
    "Hear that pattering? Like a thousand tiny print() calls on the roof.",
  ],
  evening: [
    "Evening's my favourite. The runes glow brighter in the dark. Like they're showing off.",
    "The lanterns are lit. Everyone's indoors. That means I get the stars all to myself. Well, I'll share.",
  ],
  questions: [
    {
      id: "pip-favourite",
      minHearts: 0,
      ask: "Quick question, very scientific: what's your favourite thing about Python so far?",
      choices: [
        { label: "Seeing my code work", reply: "Yes! That little moment when it runs and does exactly what you meant. Nothing like it. I get it too, and I don't even have hands.", points: 30 },
        { label: "The error messages", reply: "Ha! You're joking. You're not joking? Well. You'll make a wonderful debugger. A strange one, but wonderful.", points: 20 },
        { label: "Honestly? It's hard", reply: "It is hard. Anyone who says otherwise is fibbing. But you're still here, aren't you? That's the whole secret.", points: 35 },
      ],
    },
    {
      id: "pip-hill",
      minHearts: 4,
      ask: "You keep looking at the north hill. Is... is something up there? You can tell me. Or not. Probably not. Definitely don't go up there.",
      choices: [
        { label: "Why are you scared of it?", reply: "Scared? Me? I'm not scared. I'm cautious. There's a difference. The difference is... a long story. Another day.", points: 15 },
        { label: "I won't go without you", reply: "Oh. That's... that's a very kind thing to say to a snake who can't leave a rock. Thank you. Really.", points: 45 },
        { label: "Fine, I'll leave it", reply: "Good. Yes. Good. Let's look at nice things. That tree. Lovely tree.", points: 10 },
      ],
    },
    {
      id: "pip-teach",
      minHearts: 7,
      ask: "If someone new came to the valley one day and didn't know any Python, would you teach them?",
      choices: [
        { label: "Of course", reply: "That's it. That's the whole thing, really. A language lives while it's taught. Someone very wise told me that once.", points: 50 },
        { label: "I'd send them to you", reply: "Me? I'm flattered. But you'd be better. You remember what it's like not to know. That matters.", points: 25 },
      ],
    },
  ],
  milestones: [
    "You know what? I think we're friends. Proper friends. I haven't had one of those in a while.",
    "I hummed a tune this morning without being nervous at all. I think that's because of you.",
    "I'm going to tell you a secret: I remember the old village. Not all of it. Just the bells. Don't ask me how.",
    "When you're near the stone it feels warmer. I used to think that was the sun.",
    "Whatever I am, and whatever happens next, you are my favourite speaker. Of all of them. Don't tell the others. There aren't any others. Still.",
  ],
};
