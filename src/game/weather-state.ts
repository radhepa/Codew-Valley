// The weather right now, shared between the visuals (weather.ts writes it
// every frame) and the sound (audio reads it for rain and wind loops).
// All values are 0 to 1.
export const weatherState = {
  /** How hard it is raining. */
  rain: 0,
  /** Wind strength: grass, trees, cloth and the wind sound follow it. */
  wind: 0.3,
  /** Thunder flash this frame (sound can play a rumble when it goes above 0). */
  thunder: 0,
  /** 0 at midnight, 0.5 at noon, if a day cycle exists. */
  timeOfDay: 0.4,
};
