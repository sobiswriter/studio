
"use client";

import type { PixelPalMessage } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Smile, ThumbsUp, BellRing, Lightbulb, Info, MessageSquareText } from 'lucide-react';
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
    case 'askPalResponse':
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
  const askPalResponses = messages.filter(msg => msg.type === 'askPalResponse' || (msg.type === 'info' && msg.text.startsWith("You asked:")));
  const otherLogEntries = messages.filter(msg => msg.type !== 'askPalResponse' && !(msg.type === 'info' && msg.text.startsWith("You asked:")));

  const defaultTabValue = askPalResponses.length > 0 ? 'answers' : (otherLogEntries.length > 0 ? 'chatter' : 'answers');

  if (!messages || messages.length === 0) {
    return (
      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="font-pixel text-center text-lg">Pal's Log</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground font-pixel p-4">Pal hasn't said anything yet!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel text-center text-lg">Pal's Log</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTabValue} className="w-full">
          <TabsList className="grid w-full grid-cols-2 font-pixel mb-3 bg-muted p-1 rounded-md border border-border pixel-corners">
            <TabsTrigger
              value="answers"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-sm px-3 py-1.5 text-sm"
            >
              Pal's Answers
            </TabsTrigger>
            <TabsTrigger
              value="chatter"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-sm px-3 py-1.5 text-sm"
            >
              General Chatter
            </TabsTrigger>
          </TabsList>

          <TabsContent value="answers">
            {askPalResponses.length > 0 ? (
              <ScrollArea className="h-[200px] w-full pr-3 border border-border pixel-corners p-2 rounded">
                <div className="space-y-3">
                  {askPalResponses.map((msg, index) => (
                    <LogEntry key={`ask-${msg.timestamp}-${index}`} msg={msg} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-sm text-muted-foreground font-pixel p-4 border border-border pixel-corners rounded">No direct answers from Pal yet. Ask something!</p>
            )}
          </TabsContent>

          <TabsContent value="chatter">
            {otherLogEntries.length > 0 ? (
              <ScrollArea className="h-[200px] w-full pr-3 border border-border pixel-corners p-2 rounded">
                <div className="space-y-3">
                  {otherLogEntries.map((msg, index) => (
                    <LogEntry key={`other-${msg.timestamp}-${index}`} msg={msg} />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-center text-sm text-muted-foreground font-pixel p-4 border border-border pixel-corners rounded">Pal's been quiet on general chatter lately.</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
