
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
  palCredits: number; // New: Pal Credits
  pixelSpriteCosmetics: {
    hat: string; // ID of the hat cosmetic item
    accessory: string; // ID of the accessory cosmetic item
    color: string; // ID of the color cosmetic item
  };
  unlockedCosmetics: string[]; // Array of cosmetic item IDs
}

export interface PixelPalMessage {
  text: string;
  type: 'greeting' | 'encouragement' | 'reminder' | 'suggestion' | 'info';
  timestamp: number;
}
