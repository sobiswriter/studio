"use client";

import Image from 'next/image';
import type { UserProfile, PixelPalMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PAL_COLORS } from '@/lib/constants';
import { useEffect, useState } from 'react';

interface PixelSpriteProps {
  userProfile: UserProfile | null;
  message: PixelPalMessage | null;
}

export function PixelSprite({ userProfile, message }: PixelSpriteProps) {
  const [spriteColor, setSpriteColor] = useState(PAL_COLORS.find(c => c.id === 'default')?.hex || '#8A2BE2');

  useEffect(() => {
    if (userProfile?.pixelSpriteCosmetics.color) {
      const selectedColorObj = PAL_COLORS.find(c => c.id === userProfile.pixelSpriteCosmetics.color);
      if (selectedColorObj) {
        setSpriteColor(selectedColorObj.hex);
      }
    }
  }, [userProfile?.pixelSpriteCosmetics.color]);

  const hat = userProfile?.pixelSpriteCosmetics.hat !== 'none' ? userProfile?.pixelSpriteCosmetics.hat : null;
  const accessory = userProfile?.pixelSpriteCosmetics.accessory !== 'none' ? userProfile?.pixelSpriteCosmetics.accessory : null;

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="text-center font-pixel">Pixel Pal</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-32 md:w-40 md:h-40 bg-muted rounded pixel-corners" style={{ backgroundColor: spriteColor, imageRendering: 'pixelated' }}>
          <Image
            src={`https://placehold.co/128x128/${spriteColor.substring(1)}/FFFFFF.png?text=Pal`} // Use color in placeholder
            alt="Pixel Sprite"
            width={128}
            height={128}
            className="object-contain pixel-corners"
            data-ai-hint="pixel character cute"
          />
          {hat && (
            <Image
              src={`https://placehold.co/64x32.png`} // Placeholder for hat
              alt={`${hat} Hat`}
              width={64}
              height={32}
              className="absolute top-0 left-1/2 -translate-x-1/2 object-contain pixel-corners"
              data-ai-hint={`pixel ${hat}`}
            />
          )}
          {accessory && (
            <Image
              src={`https://placehold.co/48x48.png`} // Placeholder for accessory
              alt={`${accessory} Accessory`}
              width={48}
              height={48}
              className="absolute bottom-2 right-0 object-contain pixel-corners"
              data-ai-hint={`pixel ${accessory}`}
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
