
"use client";

import Image from 'next/image';
import type { UserProfile, PixelPalMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PAL_COLORS, TYPING_SPEED_MS } from '@/lib/constants';
import { useEffect, useState } from 'react';

interface PixelSpriteProps {
  userProfile: UserProfile | null;
  message: PixelPalMessage | null;
}

const FALLBACK_IMAGE_URL = "https://drive.google.com/uc?export=view&id=1MSiI_tAarxp3sgXY9_7J2uc6OPNEzRA8"; // Default to purple wizard
const FALLBACK_DATA_AI_HINT = "pixel wizard purple";

export function PixelSprite({ userProfile, message }: PixelSpriteProps) {
  const [typedMessageText, setTypedMessageText] = useState('');
  const [currentPalImageUrl, setCurrentPalImageUrl] = useState(FALLBACK_IMAGE_URL);
  const [currentPalDataAiHint, setCurrentPalDataAiHint] = useState(FALLBACK_DATA_AI_HINT);


  useEffect(() => {
    let imageUrl = FALLBACK_IMAGE_URL;
    let dataAiHint = FALLBACK_DATA_AI_HINT;

    if (userProfile?.palColorId) {
      const selectedColor = PAL_COLORS.find(c => c.id === userProfile.palColorId);
      if (selectedColor) {
        imageUrl = selectedColor.imageUrl;
        dataAiHint = selectedColor.dataAiHint;
      } else { // Fallback to default color if selected ID is not found
        const defaultColor = PAL_COLORS.find(c => c.id === 'default') || (PAL_COLORS.length > 0 ? PAL_COLORS[0] : null);
        if (defaultColor) {
            imageUrl = defaultColor.imageUrl;
            dataAiHint = defaultColor.dataAiHint;
        }
      }
    } else { // Fallback to default color if no palColorId in profile
        const defaultColor = PAL_COLORS.find(c => c.id === 'default') || (PAL_COLORS.length > 0 ? PAL_COLORS[0] : null);
        if (defaultColor) {
            imageUrl = defaultColor.imageUrl;
            dataAiHint = defaultColor.dataAiHint;
        }
    }
    setCurrentPalImageUrl(imageUrl);
    setCurrentPalDataAiHint(dataAiHint);
  }, [userProfile?.palColorId]);


  useEffect(() => {
    setTypedMessageText(''); // Reset typed text when a new message prop comes in

    if (message?.text) {
      let index = 0;
      const intervalId = setInterval(() => {
        setTypedMessageText(prev => {
            if (message && message.text) { // Check if message and message.text are still valid
                return message.text.substring(0, index + 1);
            }
            return prev; // Keep previous text if message becomes invalid during typing
        });
        index++;
        if (!message || !message.text || index >= message.text.length) { // Check against current message's length
          clearInterval(intervalId);
        }
      }, TYPING_SPEED_MS);

      return () => clearInterval(intervalId); // Cleanup
    } else {
        // If message is null or message.text is null/undefined, ensure typedMessageText is cleared
        setTypedMessageText('');
    }
  }, [message]); // TYPING_SPEED_MS removed as it's a constant from import, effect re-runs on `message` change


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
            key={currentPalImageUrl} 
            src={currentPalImageUrl}
            alt="Pixel Pal"
            width={128}
            height={128}
            className="object-contain pixel-corners"
            data-ai-hint={currentPalDataAiHint}
            priority 
          />
        </div>
        <div className="w-full p-3 bg-secondary rounded pixel-corners border border-foreground text-sm min-h-[60px] flex items-center justify-center">
          <p className="font-pixel text-secondary-foreground text-center">
            {typedMessageText || (message?.text ? '' : '...')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
