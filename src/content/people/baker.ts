import type { Person } from "../types.ts";

export const HAZEL: Person = {
  id: "baker",
  name: "Hazel",
  title: "Baker of the Hearth Bakery",
  home: "bakery",
  traits: ["dry-witted", "precise", "patient as rising dough", "still cross with her brother (mostly)"],
  voice: "Quiet, dry and exact; short, tidy sentences; measures everything in minutes, grams and steps; notices what people eat and how they hold their hands; teases with a straight face; when Bram comes up she turns careful and a little too precise, but never unkind.",
  likes: ["dough that springs back", "a properly hot oven", "the hour before anyone else is awake", "bread for dipping"],
  dislikes: ["slammed oven doors", "guessing instead of measuring", "being told she 'never leaves'", "loud entrances (Bram's especially)"],
  want: "To mend things with Bram. Ten years ago he left on the caravans the week she opened her first bakery; she said he always runs, he said she'd never once left their street. They were both a little right, which is the worst way to be.",
  talk: [
    [
      "Oven's lit. Forty minutes to come up to heat. Good. I like things that can't be hurried.",
      "You've got a kind face and flour-free hands. We'll fix the second one.",
      "Knead, fold, turn. While the dough isn't ready, you keep going. You'd write that as a loop, I expect. I'd call it Tuesday.",
      "I'm told the innkeeper is my brother. I'm told he makes a decent stew. I'm told a great many things. I haven't been over yet.",
    ],
    [
      "You eat the crust first. That says something about a person. I haven't decided what.",
      "Bram's stew deserves better bread than he's been getting. Don't tell him I said so. Don't tell him I said anything. ...Did he ask about me?",
      "Pip watched me shape loaves for an hour without blinking. I'm not sure Pip blinks. Very good audience, though.",
      "A recipe is exact steps in the right order. So is your Python, from what I can see. It's stricter about indentation than I am. That takes some doing.",
    ],
    [
      "He left the week I opened my first shop. I said he always runs. He said I'd never once left our street. We were both a little right. That's the worst way to be.",
      "Bram came in this morning for a loaf. Stood at the counter six minutes. I timed it. Then he said 'nice oven' and left. ...It's a start.",
      "I bake a dipping loaf every evening. It's for nobody. ...It's for whoever comes by. Usually a large man pretending he's only passing.",
      "You're easy to talk to. I don't usually talk. I bake, and people talk at me, and I nod.",
    ],
    [
      "Mum writes every month asking if we've made up. This month I wrote back 'mostly'. She posted us a cake. It arrived as crumbs. Best crumbs I've ever had.",
      "I've left our street now, haven't I? All the way to a valley that wasn't on any map. Don't tell Bram he was right. I'll tell him myself. Eventually.",
      "You always turn up just as the bread comes out. I've started to think you can smell it from the square.",
      "I've baked for a great many people. Hardly any stayed long enough to become friends. You stayed. That's rarer than good yeast.",
    ],
  ],
  rain: [
    "Rain's good for the dough. Damp air, slow rise. Sit by the oven. You're dripping on my floor.",
    "Wet days, people want something warm in their hands. I've doubled the rolls. I'm rarely wrong about rain.",
  ],
  evening: [
    "Last batch is in. Twenty-two minutes. Then I sweep, then I sit, then I eat the burnt one. Baker's privilege.",
    "The bakery's quiet in the evening. You can hear the loaves crackle as they cool. That isn't a joke. Listen.",
  ],
  questions: [
    {
      id: "hazel-bread",
      minHearts: 0,
      ask: "Settle something for me. How should bread be eaten?",
      choices: [
        { label: "Cooled and sliced properly", reply: "Patience. Clean edges, no squashed crumb. You'd make a good baker.", points: 30 },
        { label: "Warm, torn by hand", reply: "Burnt fingers and ragged crumbs. My brother eats it like that. ...I won't hold it against you. Much.", points: 20 },
        { label: "Dipped in stew", reply: "...That's how we ate it as children. His stew, my bread. Strange, being asked a question that makes you miss something.", points: 40 },
      ],
    },
    {
      id: "hazel-doorstep",
      minHearts: 3,
      ask: "If someone you'd quarrelled with left a jar on your doorstep and didn't knock, would you go and knock on theirs?",
      choices: [
        { label: "Yes. Go and knock", reply: "You make it sound simple. It's forty-one steps from my door to his. I've counted. ...I suppose I could walk them.", points: 45 },
        { label: "Leave a jar back", reply: "A jar for a jar. Very fair. Very us. We could keep that up for another ten years, couldn't we.", points: 30 },
        { label: "Wait for them to knock", reply: "That's what I've done for ten years. It's very comfortable. It doesn't work.", points: 15 },
      ],
    },
    {
      id: "hazel-sorry",
      minHearts: 6,
      ask: "Bram and I both said hard things. Does it matter who says sorry first?",
      choices: [
        { label: "Not at all", reply: "No. It doesn't, does it. Ten years keeping score in a game with no prize. That's a lot of wasted flour.", points: 50 },
        { label: "Whoever was more wrong", reply: "Then we'd argue about that for another ten years. We're very good at arguing. It's the one thing we share, besides the nose.", points: 20 },
        { label: "Say it together", reply: "Together. On a count of three. He'd go on two. He always goes early. ...That would be alright, actually.", points: 40 },
      ],
    },
  ],
  milestones: [
    "Here. A roll, still warm. I made one extra. I always make one extra now. It's yours.",
    "I wrote out my starter recipe for you. Nobody has that. Not even Bram. Especially not Bram.",
    "I walked the forty-one steps to the Serpent last night. Didn't go in. Walked back. Thirty-nine steps. I was quicker coming home.",
    "Bram and I had supper together. He talked the whole time and I let him. Best stew I've had in ten years. Don't tell him.",
    "Ten years I waited for the right moment to come home. Turns out home was a valley I'd never heard of, a brother who still burns the onions, and a friend who kept turning up just as the bread came out. Thank you. I mean it more than I know how to measure.",
  ],
};
