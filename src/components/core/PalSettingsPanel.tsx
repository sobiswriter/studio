
"use client";

import type { UserProfile } from '@/types';
import { PAL_COLORS, DEFAULT_PERSONA_SETTINGS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Wand2 } from 'lucide-react';

interface PalSettingsPanelProps {
  userProfile: UserProfile | null;
  onUpdatePalSettings: (
    settings: Partial<{ palColorId: string; palPersona: UserProfile['palPersona'] }>
  ) => void;
}

export function PalSettingsPanel({ userProfile, onUpdatePalSettings }: PalSettingsPanelProps) {
  if (!userProfile) return null;

  const currentPalColorId = userProfile.palColorId || PAL_COLORS.find(c => c.id === 'default')?.id || 'default';
  const currentPersona = userProfile.palPersona || DEFAULT_PERSONA_SETTINGS;

  const handleColorChange = (colorId: string) => {
    onUpdatePalSettings({ palColorId: colorId });
  };

  const handlePersonaChange = (trait: keyof UserProfile['palPersona'], value: number) => {
    onUpdatePalSettings({
      palPersona: {
        // Ensure currentPersona (and its nested properties) is not null/undefined before spreading
        ...(currentPersona || DEFAULT_PERSONA_SETTINGS), 
        [trait]: value,
      },
    });
  };

  const unlockedPalColors = PAL_COLORS.filter(color => 
    userProfile.unlockedCosmetics?.includes(color.id)
  );
  
  const defaultColor = PAL_COLORS.find(col => col.id === 'default');
  if (defaultColor && !unlockedPalColors.some(c => c.id === defaultColor.id)) {
    unlockedPalColors.push(defaultColor);
  }

   if (unlockedPalColors.length === 0 && PAL_COLORS.length > 0 && defaultColor) {
      // Fallback to default if somehow no colors are unlocked but default exists
      unlockedPalColors.push(defaultColor);
   } else if (unlockedPalColors.length === 0 && PAL_COLORS.length > 0) {
      // Fallback to the first color in PAL_COLORS if default isn't found (should not happen with current constants)
      unlockedPalColors.push(PAL_COLORS[0]);
   }


  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2"><Wand2 size={20} /> Pal Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="pal-color-select" className="font-pixel block mb-1">Pal Color</Label>
          <Select
            value={currentPalColorId}
            onValueChange={handleColorChange}
          >
            <SelectTrigger id="pal-color-select" className="font-pixel input-pixel">
              <SelectValue placeholder="Select a color" />
            </SelectTrigger>
            <SelectContent className="font-pixel pixel-corners border-2 border-foreground">
              {unlockedPalColors.map(color => (
                <SelectItem key={color.id} value={color.id} className="font-pixel focus:bg-accent focus:text-accent-foreground">
                  <span style={{ color: color.hex }}>{color.name}</span>
                </SelectItem>
              ))}
               {unlockedPalColors.length === 0 && (
                 <SelectItem value="disabled-no-colors" disabled className="font-pixel">No colors unlocked</SelectItem>
               )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="sarcasm-slider" className="font-pixel block mb-1">
            Sarcasm Level: <span className="text-primary">{currentPersona.sarcasm}</span>
          </Label>
          <Slider
            id="sarcasm-slider"
            min={0}
            max={100}
            step={10}
            value={[currentPersona.sarcasm]} // Use value for controlled component
            onValueChange={(value) => handlePersonaChange('sarcasm', value[0])}
            className="my-2"
          />
        </div>

        <div>
          <Label htmlFor="helpfulness-slider" className="font-pixel block mb-1">
            Helpfulness: <span className="text-primary">{currentPersona.helpfulness}</span>
          </Label>
          <Slider
            id="helpfulness-slider"
            min={0}
            max={100}
            step={10}
            value={[currentPersona.helpfulness]} // Use value for controlled component
            onValueChange={(value) => handlePersonaChange('helpfulness', value[0])}
            className="my-2"
          />
        </div>

        <div>
          <Label htmlFor="chattiness-slider" className="font-pixel block mb-1">
            Chattiness: <span className="text-primary">{currentPersona.chattiness}</span>
          </Label>
          <Slider
            id="chattiness-slider"
            min={0}
            max={100}
            step={10}
            value={[currentPersona.chattiness]} // Use value for controlled component
            onValueChange={(value) => handlePersonaChange('chattiness', value[0])}
            className="my-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
