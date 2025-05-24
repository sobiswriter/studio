"use client";

import { useState } from 'react';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Loader2 } from 'lucide-react'; // Added Loader2

interface AddTaskFormProps {
  onAddTask: (taskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt' | 'xp'>) => Promise<void>; // Updated to Promise
  isAdding: boolean; // New prop
}

export function AddTaskForm({ onAddTask, isAdding }: AddTaskFormProps) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [dueDate, setDueDate] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isAdding) return;

    await onAddTask({ // Await the onAddTask call
      title,
      duration: duration ? parseInt(duration, 10) : undefined,
      dueDate: dueDate || undefined,
    });

    setTitle('');
    setDuration('');
    setDueDate('');
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
              placeholder="e.g., Study Maths for 50 min"
              required
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
                className="font-pixel input-pixel"
                disabled={isAdding}
              />
            </div>
            <div>
              <Label htmlFor="task-due-date" className="font-pixel block mb-1">Due Date (Optional)</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
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
