
"use client";

import type { PixelPalMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smile, ThumbsUp, BellRing, Lightbulb, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PixelPalLogProps {
  messages: PixelPalMessage[];
}

const getIconForType = (type: PixelPalMessage['type']) => {
  switch (type) {
    case 'greeting':
      return <Smile size={16} className="text-primary mr-2 shrink-0" />;
    case 'encouragement':
      return <ThumbsUp size={16} className="text-green-500 mr-2 shrink-0" />;
    case 'reminder':
      return <BellRing size={16} className="text-orange-500 mr-2 shrink-0" />;
    case 'suggestion':
      return <Lightbulb size={16} className="text-yellow-500 mr-2 shrink-0" />;
    case 'info':
    default:
      return <Info size={16} className="text-blue-500 mr-2 shrink-0" />;
  }
};

export function PixelPalLog({ messages }: PixelPalLogProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel text-center text-lg">Pal's Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] w-full pr-3"> {/* Adjust height as needed */}
          <div className="space-y-3">
            {messages.map((msg, index) => (
              <div key={`${msg.timestamp}-${index}`} className="flex items-start text-sm p-2 rounded bg-muted/50 border border-border pixel-corners">
                {getIconForType(msg.type)}
                <div className="flex-grow">
                  <p className="font-pixel text-foreground leading-tight">{msg.text}</p>
                  <p className="font-pixel text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
