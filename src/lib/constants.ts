
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

export const PAL_COLORS: { id: string; name: string; hex: string, dataAiHint: string }[] = [
  { id: 'default', name: 'Default', hex: '#8A2BE2', dataAiHint: 'pixel character purple' }, // Default purple
  { id: 'rose', name: 'Rose', hex: '#FF7F7F', dataAiHint: 'pixel character rose' },
  { id: 'sky', name: 'Sky', hex: '#87CEEB', dataAiHint: 'pixel character skyblue' },
  { id: 'forest', name: 'Forest', hex: '#228B22', dataAiHint: 'pixel character green' },
];

// INITIAL_UNLOCKED_COSMETICS now only includes Pal colors
export const INITIAL_UNLOCKED_COSMETICS = PAL_COLORS.map(c => c.id);

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

export const INITIAL_PAL_CREDITS = 5;
export const CREDITS_PER_LEVEL_UP = 20;
export const BONUS_CREDITS_PER_5_LEVELS = 25;
export const ASK_PAL_COST = 1;

export const BOUNTY_XP_REWARD = 25;
export const BOUNTY_CREDITS_REWARD = 5;
export const NUM_DAILY_BOUNTIES = 5;

// Default persona settings
export const DEFAULT_PERSONA_SETTINGS = {
  sarcasm: 50,    // Mid-range
  helpfulness: 75, // Generally helpful
  chattiness: 60,  // Moderately talkative
};
