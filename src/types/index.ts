
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

export interface CosmeticItem {
  id: string;
  name: string;
  type: 'hat' | 'accessory' | 'color';
  imageUrl?: string; // For placeholder or actual image
  dataAiHint?: string;
}

export interface UserProfile {
  uid: string; // Simulated User ID
  xp: number;
  level: number;
  palCredits: number;
  pixelSpriteCosmetics: {
    hat: string; // ID of the hat cosmetic item
    accessory: string; // ID of the accessory cosmetic item
    color: string; // ID of the color cosmetic item
  };
  unlockedCosmetics: string[]; // Array of cosmetic item IDs
  lastBountiesGeneratedDate?: string; // YYYY-MM-DD
}

export interface PixelPalMessage {
  text: string;
  type: 'greeting' | 'encouragement' | 'reminder' | 'suggestion' | 'info' | 'askPalResponse';
  timestamp: number;
}
