
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
        ...currentPersona, // Spread existing persona to ensure all fields are present
        [trait]: value,
      },
    });
  };

  const unlockedPalColors = PAL_COLORS.filter(color => 
    userProfile.unlockedCosmetics?.includes(color.id) // Add null check for unlockedCosmetics
  );
  
  // Ensure default color is available if unlocked list is empty or doesn't contain it
  const defaultColorExists = unlockedPalColors.some(c => c.id === (PAL_COLORS.find(col => col.id === 'default')?.id || 'default'));
  if (!defaultColorExists && PAL_COLORS.find(col => col.id === 'default')) {
    const defaultColor = PAL_COLORS.find(col => col.id === 'default')!;
     if (!unlockedPalColors.find(c => c.id === defaultColor.id)) {
        unlockedPalColors.push(defaultColor);
     }
  }
   if (unlockedPalColors.length === 0 && PAL_COLORS.length > 0) {
      unlockedPalColors.push(PAL_COLORS[0]);
   }


  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2"><Wand2 size={20} /> Pal Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="color-select" className="font-pixel block mb-1">Pal Color</Label>
          <Select
            value={currentPalColorId}
            onValueChange={handleColorChange}
          >
            <SelectTrigger id="color-select" className="font-pixel input-pixel">
              <SelectValue placeholder="Select a color" />
            </SelectTrigger>
            <SelectContent className="font-pixel pixel-corners border-2 border-foreground">
              {unlockedPalColors.map(color => (
                <SelectItem key={color.id} value={color.id} className="font-pixel focus:bg-accent focus:text-accent-foreground">
                  <span style={{ color: color.hex }}>{color.name}</span>
                </SelectItem>
              ))}
               {unlockedPalColors.length === 0 && (
                 <SelectItem value="disabled" disabled className="font-pixel">No colors unlocked</SelectItem>
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
            defaultValue={[currentPersona.sarcasm]}
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
            defaultValue={[currentPersona.helpfulness]}
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
            defaultValue={[currentPersona.chattiness]}
            onValueChange={(value) => handlePersonaChange('chattiness', value[0])}
            className="my-2"
          />
        </div>
      </CardContent>
    </Card>
  );
}
