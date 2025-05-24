
"use client";

import type { UserProfile } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LEVEL_THRESHOLDS, MAX_LEVEL } from '@/lib/constants';
import { Sparkles } from 'lucide-react'; 
// Removed Logout button import as it's now handled directly in page.tsx

interface UserProfileCardProps {
  userProfile: UserProfile | null;
  // onLogout prop removed as logout button is now global in page.tsx
}

export function UserProfileCard({ userProfile }: UserProfileCardProps) {
  if (!userProfile) {
    return (
      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="font-pixel text-center">Hero Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="font-pixel text-center">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  const currentLevel = userProfile.level;
  const currentXP = userProfile.xp;
  
  const xpForCurrentLevel = LEVEL_THRESHOLDS[currentLevel - 1] || 0;
  const xpForNextLevel = currentLevel < MAX_LEVEL ? LEVEL_THRESHOLDS[currentLevel] : currentXP; 

  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  
  const progressPercentage = xpNeededForNextLevel > 0 ? (xpInCurrentLevel / xpNeededForNextLevel) * 100 : (currentLevel === MAX_LEVEL ? 100 : 0);

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel text-center">Hero Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="font-pixel">
          <p>Email: {userProfile.email || 'N/A'}</p>
          <p>Level: {userProfile.level}</p>
          <p>XP: {userProfile.xp}</p>
          <p className="flex items-center">
            Pal Credits: {userProfile.palCredits} 
            <Sparkles size={16} className="ml-1 text-yellow-400" />
          </p>
        </div>
        <div>
          <div className="flex justify-between text-xs font-pixel mb-1">
            <span>XP For Next Level</span>
            <span>{xpInCurrentLevel} / {xpNeededForNextLevel > 0 ? xpNeededForNextLevel : 'MAX'}</span>
          </div>
          <Progress value={progressPercentage} className="h-4 border border-foreground pixel-corners" />
        </div>
        {/* Logout button removed from here, will be handled globally in page.tsx */}
      </CardContent>
    </Card>
  );
}
