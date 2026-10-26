// The moods shown on the Mood Selection page.
// `key` is sent to the backend (/songs/mood/{key}, /recommendations/mood/{key}),
// so keep it identical to the mood names your ML / backend team uses.
export const MOODS = [
  { key: "happy", label: "Happy", icon: "☀", tagline: "Bright, upbeat and sunny", from: "#7a4a35", to: "#3a2140" },
  { key: "sad", label: "Sad", icon: "☂", tagline: "Slow songs for heavy days", from: "#27325f", to: "#171a33" },
  { key: "chill", label: "Chill", icon: "☾", tagline: "Easy, calm and unhurried", from: "#263b68", to: "#20203c" },
  { key: "energetic", label: "Energetic", icon: "ϟ", tagline: "Pump it up and move", from: "#693c7c", to: "#302044" },
  { key: "romantic", label: "Romantic", icon: "♡", tagline: "Soft, warm and close", from: "#773b68", to: "#39203f" },
  { key: "focus", label: "Focus", icon: "✦", tagline: "Deep work, no distractions", from: "#285c69", to: "#1b303e" },
];

export const getMood = (key) =>
  MOODS.find((mood) => mood.key === String(key).toLowerCase());
