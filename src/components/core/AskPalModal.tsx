
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Send } from 'lucide-react'; // Added Send icon

interface AskPalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAskQuery: (query: string) => Promise<void>;
  isAsking: boolean; // To show loading state on the send button
}

export function AskPalModal({ isOpen, onClose, onAskQuery, isAsking }: AskPalModalProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = async () => {
    if (!query.trim() || isAsking) return;
    await onAskQuery(query);
    setQuery(''); // Clear input after sending
    // onClose(); // The calling function (handleAskPalQuery) will handle closing the modal
  };

  const handleDialogClose = () => {
    if (!isAsking) { // Prevent closing if Pal is currently "thinking"
        setQuery(''); // Clear query if modal is closed manually
        onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="font-pixel pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <DialogHeader>
          <DialogTitle className="font-pixel">Ask Pixel Pal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="pal-query" className="font-pixel block mb-1">Your Question:</Label>
            <Input
              id="pal-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., What's up, Pal?"
              className="font-pixel input-pixel"
              disabled={isAsking}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isAsking) handleSubmit(); }}
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button onClick={handleSubmit} className="font-pixel btn-pixel flex items-center gap-2" disabled={isAsking || !query.trim()}>
            {isAsking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Pal is thinking...
              </>
            ) : (
              <>
                <Send size={16} /> Send to Pal
              </>
            )}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="font-pixel btn-pixel" disabled={isAsking}>Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
