"use client";

import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TimerIcon, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ActiveQuestItemProps {
  task: Task;
  onCancelQuest: (taskId: string) => void;
}

const formatTime = (totalSeconds: number): string => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export function ActiveQuestItem({ task, onCancelQuest }: ActiveQuestItemProps) {
  const calculateRemainingTime = () => {
    if (!task.startTime || typeof task.duration !== 'number') return 0;
    const elapsedMilliseconds = Date.now() - task.startTime;
    const totalDurationMilliseconds = task.duration * 60 * 1000;
    const remaining = Math.max(0, totalDurationMilliseconds - elapsedMilliseconds);
    return Math.round(remaining / 1000); // Remaining time in seconds
  };

  const [remainingTime, setRemainingTime] = useState(calculateRemainingTime());

  useEffect(() => {
    if (!task.isStarted || task.isCompleted) {
      setRemainingTime(0);
      return;
    }

    // Recalculate initial remaining time in case of component re-mount or prop change
    setRemainingTime(calculateRemainingTime());

    const intervalId = setInterval(() => {
      setRemainingTime(prevTime => {
        if (prevTime <= 1) {
          clearInterval(intervalId);
          // The actual completion is handled by the setTimeout in page.tsx
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [task.id, task.isStarted, task.isCompleted, task.startTime, task.duration]);


  if (!task.isStarted || task.isCompleted) return null;

  return (
    <Card className={cn(
        "flex items-center justify-between p-3 rounded-md border-2 border-accent bg-card transition-all duration-200 pixel-corners shadow-[2px_2px_0px_hsl(var(--accent))] mb-2"
      )}>
      <div className="flex-grow">
        <p className="font-pixel text-base text-accent-foreground">{task.title}</p>
        <div className="flex items-center gap-1 text-sm text-accent-foreground/80 mt-1">
          <TimerIcon size={16} />
          <span className="font-pixel">{formatTime(remainingTime)}</span>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onCancelQuest(task.id)}
        className="w-8 h-8 p-1 hover:bg-destructive/20 active:bg-destructive/40"
        aria-label={`Cancel quest ${task.title}`}
      >
        <XCircle size={18} className="text-destructive" />
      </Button>
    </Card>
  );
}
