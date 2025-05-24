
"use client";

import Image from 'next/image';
import type { UserProfile, PixelPalMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PAL_COLORS, TYPING_SPEED_MS } from '@/lib/constants'; // Import TYPING_SPEED_MS
import { useEffect, useState } from 'react';

interface PixelSpriteProps {
  userProfile: UserProfile | null;
  message: PixelPalMessage | null;
}

const NEW_PAL_IMAGE_URL = "https://drive.google.com/uc?export=view&id=1MSiI_tAarxp3sgXY9_7J2uc6OPNEzRA8";

export function PixelSprite({ userProfile, message }: PixelSpriteProps) {
  // Base Pal image is now fixed to the new sprite
  const basePalImageUrl = NEW_PAL_IMAGE_URL;
  const [typedMessageText, setTypedMessageText] = useState('');

  // User specific customizations like hats or accessories could still be applied here in the future
  // For now, we only have the base Pal image.

  useEffect(() => {
    setTypedMessageText('');

    if (message?.text) {
      let index = 0;
      const intervalId = setInterval(() => {
        setTypedMessageText(message.text.substring(0, index + 1));
        index++;
        if (index === message.text.length) {
          clearInterval(intervalId);
        }
      }, TYPING_SPEED_MS); // Use constant for typing speed

      return () => clearInterval(intervalId);
    }
  }, [message]);

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
          <Image
            key={basePalImageUrl}
            src={basePalImageUrl}
            alt="Pixel Pal Base"
            width={128}
            height={128}
            className="object-contain pixel-corners"
            data-ai-hint="pixel wizard character" // Updated data-ai-hint
            priority
          />
          {/* Future layers for hats/accessories would go here, positioned absolutely */}
        </div>
        <div className="w-full p-3 bg-secondary rounded pixel-corners border border-foreground text-sm min-h-[60px] flex items-center justify-center">
          <p className="font-pixel text-secondary-foreground text-center">
            {typedMessageText || (message ? '' : '...')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
