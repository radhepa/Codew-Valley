import type { Person } from "../types.ts";

export const MARLO: Person = {
  id: "fisher",
  name: "Marlo",
  title: "Fisher of the Dock",
  home: "dock",
  traits: ["quiet", "endlessly patient", "full of his gran's stories", "notices everything on the water"],
  voice: "Slow and sparse; short sentences with long pauses (...); often opens with what the water or the birds are doing; quotes his grandmother ('Gran always said...'); dry humour you almost miss; treats patience as the answer to most things, bugs included.",
  likes: ["a still morning on the water", "herons", "the first bite of the day", "mending nets by lamplight"],
  dislikes: ["being hurried", "loud splashing", "tangled lines left for someone else"],
  want: "To find out whether his gran's family really came from this valley, as her stories hinted. He still keeps her old fishing float, carved with a mark he's never been able to read.",
  talk: [
    [
      "Morning. ...Fish are slow today. So am I. We get on.",
      "My gran used to tell me about a bell under a lake. Rang on its own, she said, when nobody was listening. Daft story. ...I still listen, mind.",
      "Cast, wait, cast again. You'd call that a loop, I expect. Mine hasn't got an ending. Suits me.",
      "Pip asked if fish can read. Told Pip I've never seen one try. Pip seemed relieved.",
    ],
    [
      "Heron's been on that rock since dawn. Hasn't caught a thing. Hasn't complained either. ...There's a lesson in that.",
      "Gran always said the water tells you everything, if you stop talking long enough. I think your stone's the same.",
      "Saw you scowling at an error by the tavern. Same face I make at a tangled line. You undo it one loop at a time.",
      "Folk think fishing's about the fish. It's about the waiting. The fish are a bonus.",
    ],
    [
      "Sixty years I thought Gran made that bell up. Then I hooked it in your pond. ...She said lake. She always did round things up.",
      "Every time you get one of your runes right, the bell gives a little hum. Gran said it would. I didn't believe her. ...Sorry, Gran.",
      "I don't talk much. You might've noticed. But I talk more to you than I have to anyone in years.",
      "Mended my net last night and caught myself humming. Haven't done that since I was a boy.",
    ],
    [
      "Gran's old float has a mark carved on it. Never knew what it meant. Lately... it looks a lot like your runes.",
      "When I'm too old for the boat, I'd like to sit on this dock and watch you teach the young ones. That'd be enough.",
      "You're good company. Quiet when it counts. That's the best thing I know how to say about anyone.",
      "Gran would've sat you down and told you every story she had. I'm trying to do it for her. Slowly. ...Very slowly.",
    ],
  ],
  rain: [
    "Rain on the water. Every drop makes a ring. Gran said each one was a fish saying hello. ...She was mostly joking.",
    "Fish bite better in the rain. Folk don't. Sit under the awning if you like. There's room.",
  ],
  evening: [
    "Water goes gold this time of day. Then silver. Then black. ...Then I go home.",
    "Lantern's lit on the dock. Gran said a lit lantern means 'someone's still here'. So I keep it lit.",
  ],
  questions: [
    {
      id: "marlo-waiting",
      minHearts: 0,
      ask: "...You've been standing there a while. Do you like waiting?",
      choices: [
        { label: "Not really. I like doing", reply: "Most folk don't. Stand on this dock a week. You'll either learn to like it or learn to swim.", points: 15 },
        { label: "If it's somewhere peaceful", reply: "...Somewhere like this, then. You'll do.", points: 40 },
        { label: "I'm waiting for you to talk", reply: "Ha. ...You'll be waiting a while. That's alright. Pull up a crate.", points: 30 },
      ],
    },
    {
      id: "marlo-stories",
      minHearts: 3,
      ask: "Gran told stories every night. ...Did anyone tell you stories, growing up?",
      choices: [
        { label: "Every night", reply: "Then someone loved you proper. Hold on to them. The stories, I mean. And the people.", points: 35 },
        { label: "Not really", reply: "...Then I'll tell you some of Gran's. Fair's fair. They're mostly about fish. And bells.", points: 30 },
        { label: "Tell me one of hers", reply: "...Alright. Once there was a bell that rang for anyone learning something new. ...That's it. That's the story. Gran's were short too.", points: 45 },
      ],
    },
    {
      id: "marlo-float",
      minHearts: 6,
      ask: "This is Gran's float. See the mark? ...Do you think it means something, or am I a silly old man?",
      choices: [
        { label: "It looks like a rune", reply: "...I thought so too. Never dared say it. Thank you for saying it first.", points: 45 },
        { label: "Does it matter what it means?", reply: "Maybe not. It was hers. That's meaning enough. ...Still. I'd like to know.", points: 30 },
        { label: "You're not silly", reply: "Hm. That's kind. Gran said the same, once, and she was rarely wrong.", points: 35 },
      ],
    },
  ],
  milestones: [
    "Caught two this morning. Saved you the bigger one. ...Don't tell Bram, he'll want it for the stew.",
    "Brought out Gran's old tackle box. Haven't opened it in years. Thought you'd like to see inside.",
    "Made you a float. Carved it myself. It's a bit crooked. So am I. ...It floats, though.",
    "Told the bell about you this morning. Daft, I know. Gran used to talk to the water. Runs in the family.",
    "Gran always said the right people find you the way fish find a lantern: slowly, then all at once. ...I waited a long time for this valley. For you. Worth every minute.",
  ],
};
