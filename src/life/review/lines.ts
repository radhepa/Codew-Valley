// Wren's words for the daily question, in her voice: brisk, practical, weather first,
// everything an if/else, "Why not both?". Pick with pickLine so the same day says the same.

export const WREN_LINES = {
  /** Greeting when today's question is waiting. {sky} is a weather note. */
  greet: [
    "Morning! {sky} I wrote you a question on the slate. Fresh as the bread.",
    "{sky} Good day for milling and for thinking. Why not both? There's a question on the slate.",
    "There you are. {sky} I've chalked up today's question. Solve it and the basket's yours.",
    "{sky} The field gave plenty this week. One question, one basket. Fair trade?",
    "I was up before the sun again. {sky} Wrote you a question while the kettle boiled.",
    "{sky} My grandmother said a sharp mind is like a sharp scythe: use it or it rusts. Slate's ready.",
  ],
  sky: {
    rain: ["Rain on the roof, so the sails are down.", "Wet one today. The wheat's drinking.", "Drizzle. Perfect weather for sums indoors."],
    clear: ["Steady west wind.", "Blue sky and a good breeze.", "Wind's up and the sails are singing."],
    morning: ["Dew's still on the field.", "Early light, best light."],
    evening: ["Wind's dropping with the sun.", "Long shadows on the field already."],
    night: ["Stars out, sails still.", "Quiet night. Good for thinking."],
  },
  /** On opening the question again the same day, before it's solved. */
  again: ["Back for another go? Good. The slate's patient.", "Still chewing on it? So was I, the first time.", "Take your time. The field isn't going anywhere."],
  /** When a check didn't pass (said once, after a few). */
  encourage: [
    "Wrong once just means you've found one way it isn't. My grandmother said that about bread.",
    "If it doesn't work, try again. Elif it still doesn't, try a hint. Else... I'll make tea.",
    "Stubborn's good. Stubborn built this mill.",
  ],
  /** Handing over the basket. {n} crops; {best} a nice item in it. */
  basket: [
    "There! {n} from the field, and I put in some {best}. Earned, every one.",
    "Knew you'd get it. Here's your basket: {n} crops, {best} on top.",
    "Right as rain. Well, righter. {n} crops for your trouble, {best} included.",
    "Why not both? A sharp mind and a full basket. {n} crops, with {best}.",
  ],
  /** When hints made the basket a little lighter. */
  lighter: ["Bit lighter with the hints, but a basket's a basket.", "I took a few out for the hints. Fair's fair. Still plenty for supper."],
  /** A mixed or hard question solved. */
  hard: ["That one had two ideas tangled together. You untangled them.", "That was a proper one. My grandmother would have nodded. She nodded about twice a year."],
  /** Today's done. */
  tomorrow: [
    "That's today's. Come back tomorrow, I'll have a new one chalked up by sunrise.",
    "Done for today. If you want more practice, the slate's still there. No basket, mind.",
    "Same time tomorrow? I'll be up. I'm always up.",
  ],
  /** Extra practice offered. */
  extra: ["Fancy another, just for practice? No basket, but your head will thank you.", "One more for the road? Practice only, nothing in the basket."],
  /** Extra practice solved. */
  extraDone: ["Nicely done. That one goes in the journal, not the basket.", "Good. Sharp as a new sickle."],
  /** The Sharpness page. */
  journal: ["Wren's field notes on what you know. Green is fresh. Droopy wants a little water."],
};

/** Pick a line by a number (a day, a seed) so the same moment always says the same thing. */
export function pickLine(lines: readonly string[], n: number) {
  return lines[Math.abs(Math.floor(n)) % lines.length];
}
