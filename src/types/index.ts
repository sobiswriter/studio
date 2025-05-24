
export interface Task {
  id: string;
  title: string;
  duration?: number; // Optional, in minutes
  isCompleted: boolean;
  createdAt: number; // Timestamp
  dueDate?: string; // YYYY-MM-DD format for simplicity
  isStarted?: boolean; // True if the timer for this task is active
  startTime?: number; // Timestamp of when the task was started
  timerId?: number; // ID of the setTimeout for the timer
  xp?: number; // Experience points for completing the task
  isBounty?: boolean; // True if this task is a daily bounty
  bountyPalCredits?: number; // Pal Credits awarded for completing a bounty
  bountyGenerationDate?: string; // YYYY-MM-DD, when the bounty was generated
}

export interface UserProfile {
  uid: string;
  displayName?: string; // User's preferred display name
  xp: number;
  level: number;
  palCredits: number;
  palColorId: string; // ID of the Pal's base color
  palPersona: {
    sarcasm: number; // e.g., 0-100
    helpfulness: number; // e.g., 0-100
    chattiness: number; // e.g., 0-100
  };
  unlockedCosmetics: string[]; // Array of PAL_COLOR item IDs
  lastBountiesGeneratedDate?: string; // YYYY-MM-DD
}

export interface PixelPalMessage {
  text: string;
  type: 'greeting' | 'encouragement' | 'reminder' | 'suggestion' | 'info' | 'askPalResponse';
  timestamp: number;
}
