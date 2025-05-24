
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

const TYPING_SPEED_MS = 50; // Milliseconds per character

export function PixelSprite({ userProfile, message }: PixelSpriteProps) {
  const [basePalImageUrl, setBasePalImageUrl] = useState('https://placehold.co/128x128/8A2BE2/FFFFFF.png?text=Pal&font=pixel');
  const [typedMessageText, setTypedMessageText] = useState('');

  useEffect(() => {
    let currentSpriteColorHex = PAL_COLORS.find(c => c.id === 'default')?.hex || '#8A2BE2';
    if (userProfile?.palColorId) {
      const selectedColorObj = PAL_COLORS.find(c => c.id === userProfile.palColorId);
      if (selectedColorObj) {
        currentSpriteColorHex = selectedColorObj.hex;
      }
    }
    setBasePalImageUrl(`https://placehold.co/128x128/${currentSpriteColorHex.substring(1)}/FFFFFF.png?text=Pal&font=pixel`);
  }, [userProfile?.palColorId]);

  useEffect(() => {
    setTypedMessageText(''); // Reset typed text when the message object itself changes or becomes null

    if (message?.text) {
      let index = 0;
      const intervalId = setInterval(() => {
        setTypedMessageText((prev) => message.text.substring(0, index + 1));
        index++;
        if (index === message.text.length) {
          clearInterval(intervalId);
        }
      }, TYPING_SPEED_MS);

      return () => clearInterval(intervalId); // Cleanup interval on new message or unmount
    }
  }, [message]); // Depend on the message object itself

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
            data-ai-hint="pixel character purple"
            priority
          />
        </div>
        {/* Display typed message. Ensure a min-height for the text area. */}
        <div className="w-full p-3 bg-secondary rounded pixel-corners border border-foreground text-sm min-h-[60px] flex items-center justify-center">
          <p className="font-pixel text-secondary-foreground text-center">
            {typedMessageText || (message ? '' : '...')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
