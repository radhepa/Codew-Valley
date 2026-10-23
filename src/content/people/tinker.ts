import type { Person } from "../types.ts";

export const TOCK: Person = {
  id: "tinker",
  name: "Tock",
  title: "Tinkerer of the Clock Tower",
  home: "clocktower",
  traits: ["restless hands", "fixes things before they break", "precise to the second", "pockets full of springs"],
  voice: "Quick and clipped, like a ticking clock: short bursts, then a sudden 'Ah!' when an idea lands; gives exact times and counts down out loud; tinkers mid-sentence and narrates it; sees gears and tests in everything and offers to tighten whatever's nearest, buttons included; goes shy and halting about the empty stool at the workbench.",
  likes: ["a fresh tin of oil", "the click of a gear seating", "things that run on time", "being asked how something works"],
  dislikes: ["'if it isn't broken, don't fix it'", "sticky springs", "being rushed while counting"],
  want: "To take on an apprentice. Tock keeps a second stool at the workbench and a second set of tiny screwdrivers, and nobody has ever stayed longer than an afternoon.",
  talk: [
    [
      "Hello! Hold this. No, the other end. Ah! Perfect. You're a natural. Don't let go.",
      "The valley clock stopped three hundred years ago. Every hand, the same moment. I'd like to know why. I'd also like to oil it.",
      "Your door hinge squeaks. Not yet. But it will. Tuesday, I'd say. I've fixed it already. You're welcome.",
      "Python folk write tests that check their code before anything goes wrong. I do that with doorknobs. Same idea. Fewer doorknobs complain.",
    ],
    [
      "Clocks start counting at twelve. Python counts from zero. I count from whenever I woke up. Today that was four fifteen. Busy day.",
      "Pip asked me to look at the rune stone. Then asked me not to touch it. Then asked me to look again. I looked. Very good stone. No gears.",
      "Ah! Loose button. Hold still. Three seconds. Two. One. There. It wasn't loose yet. Now it never will be.",
      "A function's just a little machine. Something goes in, it does its one job, something comes out. I could watch functions all day. Some days I do.",
    ],
    [
      "I've had four apprentices. One lasted a morning, two lasted an afternoon, and one was a cat. The cat was the best of them. Didn't stay either.",
      "Everyone says, 'Tock, it isn't broken.' But it will be. Everything will be, one day. I just like to get there first, with a spanner.",
      "Since the big clock started again I sit on the gallery at dusk and listen to the valley go round. Tick, tick, tick. Lovely.",
      "You read an error message the way I listen for a rattle. Something's loose. Find it. Tighten it. Try again. Same kind of person, you and me.",
    ],
    [
      "Made you a pocket watch. Runs four seconds fast. On purpose. So you're never late for anything that matters.",
      "There's a second stool at my bench. Empty a long time. I've stopped dusting it for strangers. I dust it for you now.",
      "When the big clock struck its first hour, I thought nothing could sound better. Then you shouted 'it works!' louder than the bell. Close contest. You won.",
      "Most things I take apart before I fix them. Not you. You were already running fine. I just liked having you near the workbench.",
    ],
  ],
  rain: [
    "Rain. Ah! Damp gets in the gears. I've been up the tower three times. Everything's fine. I'll go once more.",
    "Listen. Plink, plink, plink. Rain on the tower roof keeps better time than most clocks. Don't tell the clocks.",
  ],
  evening: [
    "Everyone else winds down in the evening. I wind up. The clock, I mean. Once a night. Forty-two turns. Not forty-one.",
    "The big gear's still warm from the day. Put your hand on it. Feel that? That's the whole valley, ticking.",
  ],
  questions: [
    {
      id: "tock-apart",
      minHearts: 0,
      ask: "Quick! You find a clock that works perfectly. Do you leave it alone, or take it apart to see how?",
      choices: [
        { label: "Take it apart", reply: "Ah! Yes! And put it back with one screw left over and wonder about it forever. Wonderful. You're wonderful.", points: 45 },
        { label: "Watch it for a while first", reply: "Watch first. Clever. Learn its tick before you touch it. That's what a good apprentice would say.", points: 35 },
        { label: "Leave it alone", reply: "Leave it. Hm. Brave. I couldn't. My fingers would itch for a week. Do your fingers itch? They should.", points: 15 },
      ],
    },
    {
      id: "tock-broken",
      minHearts: 3,
      ask: "People keep telling me, 'If it isn't broken, don't fix it.' What do you say?",
      choices: [
        { label: "Fix it before it breaks", reply: "Exactly! Like testing your code before you trust it. You understand. Hardly anybody understands.", points: 45 },
        { label: "Depends what it is", reply: "Depends. Fair. A bridge, yes. A sandwich, probably not. I've tried fixing sandwiches. Bad results.", points: 30 },
        { label: "Sometimes leave things be", reply: "Sometimes. Maybe. I'll write that down and read it later, when I'm calmer. Probably at four in the morning.", points: 20 },
      ],
    },
    {
      id: "tock-apprentice",
      minHearts: 6,
      ask: "If I asked you to learn tinkering with me, not every day, just now and then... would you?",
      choices: [
        { label: "I'd love to", reply: "You would? Ah! Ah. Hold on, I need to sit down. On the second stool. No, wait, that one's yours now. I'll stand.", points: 50 },
        { label: "Teach the village children too", reply: "Children. Small hands. Good for tiny screws. Ah! You're right. A whole bench of them. But you first, mind.", points: 40 },
        { label: "Sometimes, when I can", reply: "Sometimes is plenty. Sometimes is more than anyone's ever said. I'll leave the lamp on.", points: 35 },
      ],
    },
  ],
  milestones: [
    "I oiled your front gate. It didn't squeak. Now it never will. Call it a friendship gear.",
    "Here. A spring. Not for anything. Everyone should carry a good spring. Mine's in my left pocket. Yours goes in yours.",
    "I showed you my workbench drawer, didn't I? The one with my very first gear in it. Nobody sees the drawer. Nobody.",
    "I've engraved your name inside the big clock, behind the third gear. Nobody will ever see it. The clock will know. So will I.",
    "I spend my whole life fixing things before they break. Never thought anyone would do that for me. You did. Every visit. Tick, tock. That's all I've got. It means everything.",
  ],
};
