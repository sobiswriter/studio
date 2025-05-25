
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

// Helper to format Google Drive links for direct viewing
const getDirectDriveLink = (originalLink: string): string => {
  // Try to extract ID from common Google Drive "file/d/.../view" links
  let match = originalLink.match(/file\/d\/([^/]+)\//);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  // Try to extract ID from common Google Drive "uc?id=..." links (often the result of the first format)
  match = originalLink.match(/uc\?id=([^&]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  // Try to extract ID from "open?id=" links
  match = originalLink.match(/open\?id=([^&]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }
  // Fallback if the link format is already direct or unrecognized
  if (originalLink.includes('/uc?export=view&id=')) {
    return originalLink;
  }
  // If it's a completely different format, warn and return original
  console.warn(`Unrecognized Google Drive link format, using original: ${originalLink}`);
  return originalLink;
};


export const PAL_COLORS: { id: string; name: string; imageUrl: string; dataAiHint: string }[] = [
  { id: 'default', name: 'Default', imageUrl: getDirectDriveLink('https://drive.google.com/file/d/1MSiI_tAarxp3sgXY9_7J2uc6OPNEzRA8/view?usp=drivesdk'), dataAiHint: 'pixel wizard purple' },
  { id: 'rose', name: 'Rose', imageUrl: getDirectDriveLink('https://drive.google.com/file/d/1oJJYGrqvqKmYdpKDOtfFUxA0XbIePo77/view?usp=drivesdk'), dataAiHint: 'pixel wizard rose' },
  { id: 'sky', name: 'Sky', imageUrl: getDirectDriveLink('https://drive.google.com/file/d/1dJ0BXsOZT-tFPe5cdOqeQ3r3_77JIDon/view?usp=drivesdk'), dataAiHint: 'pixel wizard skyblue' },
  { id: 'forest', name: 'Forest', imageUrl: getDirectDriveLink('https://drive.google.com/file/d/1r8Kr0OKuRi5pLU0WK1pU308nWFowAWQq/view?usp=drivesdk'), dataAiHint: 'pixel wizard green' },
];


export const INITIAL_UNLOCKED_COSMETICS = PAL_COLORS.map(c => c.id);

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
export const TYPING_SPEED_MS = 20; // Milliseconds per character
export const POST_TYPING_PAUSE_MS = 2000; // Milliseconds to pause after typing
export const INITIAL_AI_WELCOME_DELAY_MS = 7000; // Milliseconds to delay initial AI welcome

export const FIVE_MINUTES_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
