
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'user' | 'pal';
  text: string;
}

interface AskPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskQuery: (query: string) => Promise<string | null>; // Now returns Pal's response
  isProcessingQuery: boolean; // Renamed from isAsking for clarity
  setIsProcessingQuery: (isProcessing: boolean) => void; // Allow modal to control parent's loading state
}

export function AskPalModal({
  isOpen,
  onClose,
  onAskQuery,
  isProcessingQuery,
  setIsProcessingQuery,
}: AskPalModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when conversation updates
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, [conversation]);

  useEffect(() => {
    // Clear conversation when modal is closed externally or re-opened
    if (!isOpen) {
      setConversation([]);
      setInputValue('');
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessingQuery) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: inputValue.trim(),
    };
    setConversation(prev => [...prev, userMessage]);
    const currentQuery = inputValue.trim();
    setInputValue('');
    setIsProcessingQuery(true);

    try {
      const palResponseText = await onAskQuery(currentQuery);
      if (palResponseText) {
        const palMessage: ChatMessage = {
          id: `pal-${Date.now()}`,
          sender: 'pal',
          text: palResponseText,
        };
        setConversation(prev => [...prev, palMessage]);
      } else {
        // Handle case where Pal doesn't respond or an error occurred
        const palErrorMessage: ChatMessage = {
            id: `pal-error-${Date.now()}`,
            sender: 'pal',
            text: "Hmm, my circuits are a bit fuzzy. Couldn't quite get that. Try again?",
        };
        setConversation(prev => [...prev, palErrorMessage]);
      }
    } catch (error) {
        console.error("Error during Pal query in modal:", error);
        const palErrorMessage: ChatMessage = {
            id: `pal-error-${Date.now()}`,
            sender: 'pal',
            text: "Whoops! A cosmic ray hit my brain. Maybe ask something else?",
        };
        setConversation(prev => [...prev, palErrorMessage]);
    } finally {
      setIsProcessingQuery(false);
    }
  };

  const handleDialogClose = () => {
    if (!isProcessingQuery) {
      setInputValue('');
      setConversation([]); // Clear conversation on manual close
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="font-pixel pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] sm:max-w-[525px] flex flex-col h-[70vh] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-center">Chat with Pixel Pal</DialogTitle>
        </DialogHeader>

        <ScrollArea ref={scrollAreaRef} className="flex-grow p-1 mb-2 border border-border rounded-md pixel-corners bg-muted/30 overflow-y-auto">
          <div className="space-y-3 p-3">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col p-2 rounded-md max-w-[80%] break-words pixel-corners border",
                  msg.sender === 'user'
                    ? 'bg-primary/20 border-primary/50 self-end text-right'
                    : 'bg-secondary/20 border-secondary/50 self-start text-left'
                )}
              >
                <p className={cn(
                    "text-xs font-bold mb-0.5",
                     msg.sender === 'user' ? 'text-primary' : 'text-secondary-foreground'
                )}>
                    {msg.sender === 'user' ? 'You' : 'Pixel Pal'}
                </p>
                <p className="text-sm text-foreground leading-snug">{msg.text}</p>
              </div>
            ))}
             {conversation.length === 0 && (
                <div className="text-center text-muted-foreground py-10">
                    <p>Ask Pixel Pal anything!</p>
                    <p className="text-xs">(Each question costs 1 Pal Credit)</p>
                </div>
             )}
          </div>
        </ScrollArea>

        <div className="space-y-2">
          <Label htmlFor="pal-query" className="font-pixel sr-only">Your Question:</Label>
          <div className="flex gap-2">
            <Input
              id="pal-query"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your Pal..."
              className="font-pixel input-pixel flex-grow"
              disabled={isProcessingQuery}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isProcessingQuery && inputValue.trim()) {
                  e.preventDefault(); // Prevents form submission if inside a form
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} className="font-pixel btn-pixel" disabled={isProcessingQuery || !inputValue.trim()}>
              {isProcessingQuery ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-center mt-2">
          <DialogClose asChild>
            <Button variant="outline" className="font-pixel btn-pixel" disabled={isProcessingQuery}>Close Chat</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
