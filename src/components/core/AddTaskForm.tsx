
"use client";

import { useState } from 'react';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react';

export interface AddTaskFormValues {
  title: string;
  duration?: number; // Kept optional here as form input is string
  dueDate?: string;   // Kept optional here as form input is string
}
interface AddTaskFormProps {
  onAddTask: (taskData: AddTaskFormValues) => Promise<void>;
  isAdding: boolean;
}

export function AddTaskForm({ onAddTask, isAdding }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [dueDate, setDueDate] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Basic client-side check for empty strings, more robust validation in page.tsx
    if (isAdding) return;

    // Pass string values for duration and dueDate; page.tsx will parse duration
    await onAddTask({
      title,
      duration: duration ? parseInt(duration, 10) : undefined, // Or let page.tsx handle parsing
      dueDate: dueDate || undefined,
    });

    // Clear fields only if onAddTask doesn't throw (or if validation passes in page.tsx)
    // For now, we assume onAddTask handles success/failure feedback and form clearing if needed.
    // If handleAddTask in page.tsx shows a toast for validation failure, we might not want to clear.
    // This behavior can be refined based on how page.tsx handles it.
    // For simplicity now, let's clear if it's not adding.
    if(!isAdding) {
        setTitle('');
        setDuration('');
        setDueDate('');
    }
  };

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2"><PlusCircle size={20} /> Add New Quest</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="task-title" className="font-pixel block mb-1">Quest Title</Label>
            <Input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Conquer Mount TypeScript"
              required // HTML5 required
              className="font-pixel input-pixel"
              disabled={isAdding}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="task-duration" className="font-pixel block mb-1">Duration (min)</Label>
              <Input
                id="task-duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 60"
                required // HTML5 required
                min="1" // Optional: ensure duration is positive
                className="font-pixel input-pixel"
                disabled={isAdding}
              />
            </div>
            <div>
              <Label htmlFor="task-due-date" className="font-pixel block mb-1">Due Date</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required // HTML5 required
                className="font-pixel input-pixel"
                disabled={isAdding}
              />
            </div>
          </div>
          <Button type="submit" className="w-full font-pixel btn-pixel" disabled={isAdding}>
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating XP & Adding...
              </>
            ) : (
              "Add Quest"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
