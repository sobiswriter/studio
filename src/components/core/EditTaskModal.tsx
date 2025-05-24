"use client";

import { useState, useEffect } from 'react';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react'; // Added Loader2

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveTask: (task: Task) => Promise<void>; // Updated to Promise
  isSaving: boolean; // New prop
}

export function EditTaskModal({ task, isOpen, onClose, onSaveTask, isSaving }: EditTaskModalProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDuration(task.duration?.toString() || '');
      setDueDate(task.dueDate || '');
    }
  }, [task]);

  if (!task) return null;

  const handleSubmit = async () => {
    if (!title.trim() || isSaving) return;
    const updatedTaskData: Task = {
      ...task,
      title,
      duration: duration ? parseInt(duration, 10) : undefined,
      dueDate: dueDate || undefined,
    };
    await onSaveTask(updatedTaskData); // Await the onSaveTask call
    // No need to call onClose here if onSaveTask handles it or if it's part of a larger flow in page.tsx
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="font-pixel pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <DialogHeader>
          <DialogTitle className="font-pixel">Edit Quest</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="edit-task-title" className="font-pixel block mb-1">Quest Title</Label>
            <Input
              id="edit-task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-pixel input-pixel"
              disabled={isSaving}
            />
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-task-duration" className="font-pixel block mb-1">Duration (min)</Label>
              <Input
                id="edit-task-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                 className="font-pixel input-pixel"
                 disabled={isSaving}
              />
            </div>
            <div>
              <Label htmlFor="edit-task-due-date" className="font-pixel block mb-1">Due Date</Label>
              <Input
                id="edit-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="font-pixel input-pixel"
                disabled={isSaving}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button onClick={handleSubmit} className="font-pixel btn-pixel" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Recalculating XP & Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="font-pixel btn-pixel" disabled={isSaving}>Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
