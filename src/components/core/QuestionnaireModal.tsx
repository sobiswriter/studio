
"use client";

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export type ButtonConfigType = 'yesNo' | 'continue' | 'okay' | 'none';

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  buttonConfig: ButtonConfigType;
  onYes?: () => void;
  onNo?: () => void;
  onContinue?: () => void;
  onOkay?: () => void;
  isProcessing?: boolean; // To disable buttons during an action
}

export function QuestionnaireModal({
  isOpen,
  onClose,
  message,
  buttonConfig,
  onYes,
  onNo,
  onContinue,
  onOkay,
  isProcessing,
}: QuestionnaireModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="font-pixel pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <DialogHeader>
          <DialogTitle className="font-pixel text-primary">A Quick Word...</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="font-pixel text-foreground whitespace-pre-line">{message}</p>
        </div>
        <DialogFooter className="gap-2 sm:justify-center">
          {buttonConfig === 'yesNo' && (
            <>
              <Button onClick={onYes} className="font-pixel btn-pixel" disabled={isProcessing}>Yes</Button>
              <Button onClick={onNo} variant="outline" className="font-pixel btn-pixel" disabled={isProcessing}>No</Button>
            </>
          )}
          {buttonConfig === 'continue' && (
            <Button onClick={onContinue} className="font-pixel btn-pixel" disabled={isProcessing}>Continue...</Button>
          )}
          {buttonConfig === 'okay' && (
            <Button onClick={onOkay} className="font-pixel btn-pixel" disabled={isProcessing}>Okay!</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
