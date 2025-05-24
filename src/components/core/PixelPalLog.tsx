
"use client";

import type { PixelPalMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smile, ThumbsUp, BellRing, Lightbulb, Info, MessageSquareText } from 'lucide-react'; // Added MessageSquareText
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
    case 'suggestion': // For general AI suggestions, if any in future
      return <Lightbulb size={16} className="text-yellow-500 mr-2 shrink-0" />;
    case 'askPalResponse': // New icon for Pal's direct answers
      return <MessageSquareText size={16} className="text-purple-500 mr-2 shrink-0" />;
    case 'info':
    default:
      return <Info size={16} className="text-blue-500 mr-2 shrink-0" />;
  }
};

const LogEntry = ({ msg }: { msg: PixelPalMessage }) => (
  <div className="flex items-start text-sm p-2 rounded bg-muted/50 border border-border pixel-corners">
    {getIconForType(msg.type)}
    <div className="flex-grow">
      <p className="font-pixel text-foreground leading-tight">{msg.text}</p>
      <p className="font-pixel text-xs text-muted-foreground mt-1">
        {formatDistanceToNow(new Date(msg.timestamp), { addSuffix: true })}
      </p>
    </div>
  </div>
);

export function PixelPalLog({ messages }: PixelPalLogProps) {
  if (!messages || messages.length === 0) {
    return null;
  }

  const askPalResponses = messages.filter(msg => msg.type === 'askPalResponse' || (msg.type === 'info' && msg.text.startsWith("You asked:")));
  const otherLogEntries = messages.filter(msg => msg.type !== 'askPalResponse' && !(msg.type === 'info' && msg.text.startsWith("You asked:")));

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel text-center text-lg">Pal's Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {askPalResponses.length > 0 && (
          <div>
            <h3 className="font-pixel text-base mb-2 text-center text-purple-500">Pal's Answers</h3>
            <ScrollArea className="h-[150px] w-full pr-3 border border-border pixel-corners p-2 rounded">
              <div className="space-y-3">
                {askPalResponses.map((msg, index) => (
                  <LogEntry key={`ask-${msg.timestamp}-${index}`} msg={msg} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {otherLogEntries.length > 0 && (
          <div>
            <h3 className="font-pixel text-base mb-2 text-center text-foreground/80">General Chatter</h3>
            <ScrollArea className="h-[150px] w-full pr-3 border border-border pixel-corners p-2 rounded">
              <div className="space-y-3">
                {otherLogEntries.map((msg, index) => (
                  <LogEntry key={`other-${msg.timestamp}-${index}`} msg={msg} />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
         {(askPalResponses.length === 0 && otherLogEntries.length === 0 && messages.length > 0) && (
             <ScrollArea className="h-[200px] w-full pr-3">
                 <div className="space-y-3">
                     {messages.map((msg, index) => (
                         <LogEntry key={`all-${msg.timestamp}-${index}`} msg={msg} />
                     ))}
                 </div>
             </ScrollArea>
         )}
      </CardContent>
    </Card>
  );
}
