
"use client";

import Image from 'next/image';
import type { UserProfile, PixelPalMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PAL_COLORS, HATS, ACCESSORIES } from '@/lib/constants';
import { useEffect, useState } from 'react';

interface PixelSpriteProps {
  userProfile: UserProfile | null;
  message: PixelPalMessage | null;
}

export function PixelSprite({ userProfile, message }: PixelSpriteProps) {
  const [basePalImageUrl, setBasePalImageUrl] = useState('https://placehold.co/128x128/8A2BE2/FFFFFF.png?text=Pal');
  const [hatImageUrl, setHatImageUrl] = useState<string | null>(null);
  const [accessoryImageUrl, setAccessoryImageUrl] = useState<string | null>(null);
  const [hatAlt, setHatAlt] = useState<string | null>(null);
  const [accessoryAlt, setAccessoryAlt] = useState<string | null>(null);
  const [hatDataAiHint, setHatDataAiHint] = useState<string | null>(null);
  const [accessoryDataAiHint, setAccessoryDataAiHint] = useState<string | null>(null);


  useEffect(() => {
    let currentSpriteColorHex = PAL_COLORS.find(c => c.id === 'default')?.hex || '#8A2BE2';
    if (userProfile?.pixelSpriteCosmetics.color) {
      const selectedColorObj = PAL_COLORS.find(c => c.id === userProfile.pixelSpriteCosmetics.color);
      if (selectedColorObj) {
        currentSpriteColorHex = selectedColorObj.hex;
      }
    }
    setBasePalImageUrl(`https://placehold.co/128x128/${currentSpriteColorHex.substring(1)}/FFFFFF.png?text=Pal&font=pixel`);

    if (userProfile?.pixelSpriteCosmetics.hat && userProfile.pixelSpriteCosmetics.hat !== 'none') {
      const hatDetails = HATS.find(h => h.id === userProfile.pixelSpriteCosmetics.hat);
      if (hatDetails) {
        setHatImageUrl(`https://placehold.co/64x48/00000000/FFFFFF.png?text=${encodeURIComponent(hatDetails.name)}&font=pixel`);
        setHatAlt(hatDetails.name);
        setHatDataAiHint(hatDetails.dataAiHint);
      } else {
        setHatImageUrl(null);
      }
    } else {
      setHatImageUrl(null);
    }

    if (userProfile?.pixelSpriteCosmetics.accessory && userProfile.pixelSpriteCosmetics.accessory !== 'none') {
      const accessoryDetails = ACCESSORIES.find(a => a.id === userProfile.pixelSpriteCosmetics.accessory);
      if (accessoryDetails) {
        setAccessoryImageUrl(`https://placehold.co/48x48/00000000/FFFFFF.png?text=${encodeURIComponent(accessoryDetails.name)}&font=pixel`);
        setAccessoryAlt(accessoryDetails.name);
        setAccessoryDataAiHint(accessoryDetails.dataAiHint);
      } else {
        setAccessoryImageUrl(null);
      }
    } else {
      setAccessoryImageUrl(null);
    }
  }, [userProfile?.pixelSpriteCosmetics]);

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="text-center font-pixel">Pixel Pal</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div 
          className="relative w-32 h-32 md:w-40 md:h-40 bg-muted/30 rounded pixel-corners flex items-center justify-center" 
          style={{ imageRendering: 'pixelated' }}
        >
          {/* Base Pal Image */}
          <Image
            key={basePalImageUrl} // Add key to force re-render on src change
            src={basePalImageUrl}
            alt="Pixel Pal Base"
            width={128}
            height={128}
            className="object-contain pixel-corners"
            data-ai-hint="pixel character base body"
            priority // Preload the base image
          />

          {/* Hat Image (Layered on top) */}
          {hatImageUrl && hatAlt && (
            <Image
              key={hatImageUrl}
              src={hatImageUrl}
              alt={hatAlt}
              width={64} // Adjust size as needed
              height={48} // Adjust size as needed
              className="absolute top-[-8px] left-1/2 -translate-x-1/2 object-contain pixel-corners z-10"
              style={{ imageRendering: 'pixelated' }}
              data-ai-hint={hatDataAiHint || "pixel hat"}
            />
          )}

          {/* Accessory Image (Layered on top) */}
          {accessoryImageUrl && accessoryAlt && (
            <Image
              key={accessoryImageUrl}
              src={accessoryImageUrl}
              alt={accessoryAlt}
              width={48} // Adjust size as needed
              height={48} // Adjust size as needed
              className="absolute bottom-[20px] right-[10px] object-contain pixel-corners z-10" // Adjust positioning
              style={{ imageRendering: 'pixelated' }}
              data-ai-hint={accessoryDataAiHint || "pixel accessory"}
            />
          )}
        </div>
        {message && (
          <div className="w-full p-3 bg-secondary rounded pixel-corners border border-foreground text-sm">
            <p className="font-pixel text-secondary-foreground">{message.text}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
