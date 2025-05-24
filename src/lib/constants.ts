
export const XP_PER_TASK = 10; // Default XP, used as fallback if AI calc fails

export const LEVEL_THRESHOLDS = [
  0,    // Level 1
  50,   // Level 2
  120,  // Level 3
  200,  // Level 4
  300,  // Level 5
  450,  // Level 6
  600,  // Level 7
  800,  // Level 8
  1000, // Level 9
  1250, // Level 10
  // Add more levels as needed
];

export const PAL_COLORS: { id: string; name: string; imageUrl: string; dataAiHint: string }[] = [
  { id: 'default', name: 'Default (Purple)', imageUrl: 'https://drive.google.com/uc?export=view&id=1MSiI_tAarxp3sgXY9_7J2uc6OPNEzRA8', dataAiHint: 'pixel wizard purple' },
  { id: 'rose', name: 'Rose', imageUrl: 'https://drive.google.com/uc?export=view&id=1oJJYGrqvqKmYdpKDOtfFUxA0XbIePo77', dataAiHint: 'pixel wizard rose' },
  { id: 'sky', name: 'Sky', imageUrl: 'https://drive.google.com/uc?export=view&id=1dJ0BXsOZT-tFPe5cdOqeQ3r3_77JIDon', dataAiHint: 'pixel wizard skyblue' },
  { id: 'forest', name: 'Forest', imageUrl: 'https://drive.google.com/uc?export=view&id=1r8Kr0OKuRi5pLU0WK1pU308nWFowAWQq', dataAiHint: 'pixel wizard green' },
];

export const INITIAL_UNLOCKED_COSMETICS = PAL_COLORS.map(c => c.id); // All colors unlocked by default

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export const INITIAL_PAL_CREDITS = 5;
export const CREDITS_PER_LEVEL_UP = 20;
export const BONUS_CREDITS_PER_5_LEVELS = 25;
export const ASK_PAL_COST = 1;

export const BOUNTY_XP_REWARD = 25;
export const BOUNTY_CREDITS_REWARD = 5;
export const NUM_DAILY_BOUNTIES = 5;

export const DEFAULT_PERSONA_SETTINGS = {
  sarcasm: 50,
  helpfulness: 75,
  chattiness: 60,
};

// For Pixel Pal message typing effect
export const TYPING_SPEED_MS = 50; // Milliseconds per character
export const POST_TYPING_PAUSE_MS = 2500; // Milliseconds to pause after typing
export const INITIAL_AI_WELCOME_DELAY_MS = 3000; // Milliseconds to delay initial AI welcome

