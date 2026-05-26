export const COOP_EASY_WORDS = [
  "apple", "cat", "dog", "car", "tree", "bicycle", "book", "camera", "chair", 
  "clock", "cup", "eye", "flower", "glasses", "hat", "house", "key", "pants", 
  "pizza", "shoe", "smiley face", "star", "sun", "umbrella", "moon", "cloud",
  "bird", "fish", "snake", "door", "window", "table", "phone"
];

export const COOP_HARD_WORDS = [
  "sunset behind mountains", "rabbit", "dinosaur", "helicopter", "eiffel tower",
  "lighthouse", "spider web", "campfire", "astronaut", "spaceship", "mermaid",
  "dragon", "castle", "knight", "robot", "alien", "submarine", "octopus",
  "roller coaster", "ferris wheel", "hot air balloon", "volcano", "tornado"
];

export const getRandomWord = (difficulty = 'easy') => {
  const words = difficulty === 'hard' ? COOP_HARD_WORDS : COOP_EASY_WORDS;
  return words[Math.floor(Math.random() * words.length)];
};
