
"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TYPING_SPEED_MS } from '@/lib/constants';

interface ChatMessage {
  id: string;
  sender: 'user' | 'pal';
  text: string;
  isTyping?: boolean;
  fullText?: string;
}

interface AskPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskQuery: (query: string) => Promise<string | null>;
  isProcessingQuery: boolean;
  setIsProcessingQuery: (isProcessing: boolean) => void;
}

const ASK_PAL_COST_DISPLAY = 1; // Assuming cost is 1 for display purposes in the modal

export function AskPalModal({
  isOpen,
  onClose,
  onAskQuery,
  isProcessingQuery,
  setIsProcessingQuery,
}: AskPalModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [conversation, setConversation] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [conversation]);

  useEffect(() => {
    if (!isOpen) {
      setConversation([]);
      setInputValue('');
    }
  }, [isOpen]);

  useEffect(() => {
    const messageToType = conversation.find(
      (msg) => msg.sender === 'pal' && msg.isTyping && msg.fullText && msg.text !== msg.fullText
    );

    if (!messageToType || !messageToType.fullText) {
      return;
    }

    if (TYPING_SPEED_MS <= 0) {
      setConversation((prevConv) =>
        prevConv.map((msg) =>
          msg.id === messageToType.id ? { ...msg, text: msg.fullText!, isTyping: false } : msg
        )
      );
      return;
    }

    let currentTextLength = messageToType.text.length;
    const intervalId = setInterval(() => {
      if (currentTextLength < messageToType.fullText!.length) {
        currentTextLength++;
        setConversation((prevConv) =>
          prevConv.map((msg) =>
            msg.id === messageToType.id
              ? { ...msg, text: msg.fullText!.substring(0, currentTextLength) }
              : msg
          )
        );
      } else {
        clearInterval(intervalId);
        setConversation((prevConv) =>
          prevConv.map((msg) =>
            msg.id === messageToType.id ? { ...msg, isTyping: false } : msg
          )
        );
      }
    }, TYPING_SPEED_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessingQuery) return;

    const userMessageText = inputValue.trim();
    const userMessageId = `user-${Date.now()}-${Math.random()}`;
    const userMessage: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: userMessageText,
    };
    setConversation(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue('');
    setIsProcessingQuery(true);

    const thinkingMessageId = `pal-thinking-${Date.now()}`;
    const thinkingMessage: ChatMessage = {
      id: thinkingMessageId,
      sender: 'pal',
      text: '...',
      isTyping: true,
      fullText: "Thinking..."
    };
    setConversation(prev => [...prev, thinkingMessage]);

    try {
      const palResponseText = await onAskQuery(currentQuery);
      setConversation(prev => prev.filter(msg => msg.id !== thinkingMessageId));

      if (palResponseText) {
        const palMessageId = `pal-response-${Date.now()}-${Math.random()}`;
        const palMessage: ChatMessage = {
          id: palMessageId,
          sender: 'pal',
          text: '',
          isTyping: true,
          fullText: palResponseText,
        };
        setConversation(prev => [...prev, palMessage]);
      } else {
        const palErrorMessageId = `pal-error-${Date.now()}-${Math.random()}`;
        const palErrorMessage: ChatMessage = {
          id: palErrorMessageId,
          sender: 'pal',
          text: "Hmm, my circuits are a bit fuzzy. Couldn't quite get that. Try again?",
        };
        setConversation(prev => [...prev, palErrorMessage]);
      }
    } catch (error) {
      console.error("Error during Pal query in modal:", error);
      setConversation(prev => prev.filter(msg => msg.id !== thinkingMessageId));
      const palErrorCatchMessageId = `pal-error-catch-${Date.now()}-${Math.random()}`;
      const palErrorCatchMessage: ChatMessage = {
        id: palErrorCatchMessageId,
        sender: 'pal',
        text: "Whoops! A cosmic ray hit my brain. Maybe ask something else?",
      };
      setConversation(prev => [...prev, palErrorCatchMessage]);
    } finally {
      setIsProcessingQuery(false);
    }
  };

  const handleDialogClose = () => {
    if (!isProcessingQuery) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="font-pixel pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] sm:max-w-[525px] flex flex-col h-[70vh] max-h-[600px]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-center text-primary">Chat with Pixel Pal</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-grow p-1 mb-2 border border-border rounded-md pixel-corners bg-background overflow-y-auto">
          <div className="space-y-3 p-3">
            {conversation.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col p-2.5 rounded-md max-w-[85%] break-words pixel-corners border text-sm leading-snug",
                  msg.sender === 'user'
                    ? 'bg-primary/10 border-primary/30 self-end ml-auto'
                    : 'bg-secondary/10 border-secondary/30 self-start mr-auto'
                )}
              >
                <p className={cn(
                  "text-xs font-bold mb-1",
                  msg.sender === 'user' ? 'text-primary text-right' : 'text-secondary-foreground text-left'
                )}>
                  {msg.sender === 'user' ? 'You' : 'Pixel Pal'}
                </p>
                <p className={cn("text-foreground", msg.sender === 'user' ? 'text-right' : 'text-left')}>
                  {msg.text}
                  {msg.sender === 'pal' && msg.isTyping && msg.text !== "Thinking..." && <span className="inline-block w-1 h-3 bg-foreground animate-pulse ml-0.5" />}
                </p>
              </div>
            ))}
            {conversation.length === 0 && (
              <div className="text-center text-muted-foreground py-10 h-full flex flex-col justify-center items-center">
                <p>Ask Pixel Pal anything!</p>
                <p className="text-xs">(Each question costs {ASK_PAL_COST_DISPLAY} Pal Credit)</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="mt-auto pt-2 border-t border-border">
          <Label htmlFor="pal-query" className="font-pixel sr-only">Your Question:</Label>
          <div className="flex gap-2 items-center">
            <Input
              id="pal-query"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask your Pal..."
              className="font-pixel input-pixel flex-grow h-10"
              disabled={isProcessingQuery}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isProcessingQuery && inputValue.trim()) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} className="font-pixel btn-pixel h-10 px-3" disabled={isProcessingQuery || !inputValue.trim()}>
              {isProcessingQuery ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send size={18} />
              )}
            </Button>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-center mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="font-pixel btn-pixel" disabled={isProcessingQuery}>Close Chat</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
