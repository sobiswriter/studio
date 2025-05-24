"use client";

import type { UserProfile } from '@/types';
import { HATS, ACCESSORIES, PAL_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Wand2 } from 'lucide-react';

interface CosmeticCustomizationPanelProps {
  userProfile: UserProfile | null;
  onUpdateCosmetics: (cosmetics: UserProfile['pixelSpriteCosmetics']) => void;
}

export function CosmeticCustomizationPanel({ userProfile, onUpdateCosmetics }: CosmeticCustomizationPanelProps) {
  if (!userProfile) return null;

  const currentCosmetics = userProfile.pixelSpriteCosmetics;

  const handleSave = (newCosmetics: Partial<UserProfile['pixelSpriteCosmetics']>) => {
    onUpdateCosmetics({ ...currentCosmetics, ...newCosmetics });
  };

  const unlockedHats = HATS.filter(hat => userProfile.unlockedCosmetics.includes(hat.id));
  const unlockedAccessories = ACCESSORIES.filter(acc => userProfile.unlockedCosmetics.includes(acc.id));
  const unlockedColors = PAL_COLORS.filter(col => userProfile.unlockedCosmetics.includes(col.id));

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2"><Wand2 size={20} /> Customize Your Pal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="hat-select" className="font-pixel block mb-1">Hat</Label>
          <Select
            value={currentCosmetics.hat}
            onValueChange={(value) => handleSave({ hat: value })}
          >
            <SelectTrigger id="hat-select" className="font-pixel input-pixel">
              <SelectValue placeholder="Select a hat" />
            </SelectTrigger>
            <SelectContent className="font-pixel pixel-corners border-2 border-foreground">
              {unlockedHats.map(hat => (
                <SelectItem key={hat.id} value={hat.id} className="font-pixel focus:bg-accent focus:text-accent-foreground">
                  {hat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="accessory-select" className="font-pixel block mb-1">Accessory</Label>
          <Select
            value={currentCosmetics.accessory}
            onValueChange={(value) => handleSave({ accessory: value })}
          >
            <SelectTrigger id="accessory-select" className="font-pixel input-pixel">
              <SelectValue placeholder="Select an accessory" />
            </SelectTrigger>
            <SelectContent className="font-pixel pixel-corners border-2 border-foreground">
              {unlockedAccessories.map(accessory => (
                <SelectItem key={accessory.id} value={accessory.id} className="font-pixel focus:bg-accent focus:text-accent-foreground">
                  {accessory.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="color-select" className="font-pixel block mb-1">Pal Color</Label>
          <Select
            value={currentCosmetics.color}
            onValueChange={(value) => handleSave({ color: value })}
          >
            <SelectTrigger id="color-select" className="font-pixel input-pixel">
              <SelectValue placeholder="Select a color" />
            </SelectTrigger>
            <SelectContent className="font-pixel pixel-corners border-2 border-foreground">
              {unlockedColors.map(color => (
                <SelectItem key={color.id} value={color.id} className="font-pixel focus:bg-accent focus:text-accent-foreground">
                  <span style={{ color: color.hex }}>{color.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Note: Save button removed as selections now auto-save for simplicity */}
      </CardContent>
    </Card>
  );
}
