
"use client";

import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit3, Trash2, Clock, CalendarDays, PlayCircle, Star, Award } from 'lucide-react'; // Added Award for bounty credits
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { XP_PER_TASK, BOUNTY_CREDITS_REWARD, BOUNTY_XP_REWARD } from '@/lib/constants';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStartQuest?: (taskId: string) => void;
}

export function TaskItem({ task, onToggleComplete, onEditTask, onDeleteTask, onStartQuest }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckboxChange = () => {
    onToggleComplete(task.id, !task.isCompleted);
  };

  const displayXp = task.isBounty ? BOUNTY_XP_REWARD : (task.xp ?? XP_PER_TASK);
  const displayCredits = task.isBounty ? BOUNTY_CREDITS_REWARD : null;

  return (
    <div
      id={`task-${task.id}`}
      className={cn(
        "flex items-center gap-3 p-3 rounded-md border-2 border-foreground bg-card transition-all duration-200 pixel-corners",
        task.isCompleted ? "bg-muted opacity-70" : "hover:shadow-[2px_2px_0px_hsl(var(--foreground))]",
        isHovered && !task.isCompleted ? "shadow-[2px_2px_0px_hsl(var(--foreground))]" : "",
        task.isBounty && !task.isCompleted && "border-accent shadow-[2px_2px_0px_hsl(var(--accent))]"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Checkbox
        id={`task-checkbox-${task.id}`}
        checked={task.isCompleted}
        onCheckedChange={handleCheckboxChange}
        className="border-2 border-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground pixel-corners w-6 h-6"
        aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
        disabled={!!task.isStarted}
      />
      <div className="flex-grow">
        <label
          htmlFor={`task-checkbox-${task.id}`}
          className={cn(
            "font-pixel text-base cursor-pointer",
            task.isCompleted && "line-through text-muted-foreground",
            task.isStarted && !task.isCompleted && "text-accent",
            task.isBounty && !task.isCompleted && "text-accent-foreground"
          )}
        >
          {task.title} {task.isStarted && !task.isCompleted && "(Active)"}
          {task.isBounty && <Award size={14} className="inline ml-1 text-yellow-500" />}
        </label>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {task.duration && (
            <span className="flex items-center gap-1 font-pixel"><Clock size={12} /> {task.duration} min</span>
          )}
          {task.dueDate && !task.isBounty && ( // Hide due date for bounties as they are daily
            <span className="flex items-center gap-1 font-pixel"><CalendarDays size={12} /> {task.dueDate}</span>
          )}
          {!task.isCompleted && (
            <>
              <span className="flex items-center gap-1 font-pixel text-yellow-500">
                <Star size={12} className="text-yellow-400" /> {displayXp} XP
              </span>
              {displayCredits !== null && (
                <span className="flex items-center gap-1 font-pixel text-purple-400">
                  <Award size={12} className="text-purple-500" /> {displayCredits} Credits
                </span>
              )}
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        {onStartQuest && task.duration && !task.isCompleted && !task.isStarted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onStartQuest(task.id)}
            className="w-8 h-8 p-1 hover:bg-accent/20 active:bg-accent/40"
            aria-label={`Start ${task.isBounty ? 'bounty' : 'quest'} ${task.title}`}
          >
            <PlayCircle size={18} className="text-primary" />
          </Button>
        )}
        {!task.isBounty && ( // Hide Edit/Delete for bounties
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditTask(task)}
              className="w-8 h-8 p-1 hover:bg-accent/20 active:bg-accent/40"
              aria-label={`Edit task ${task.title}`}
              disabled={!!task.isStarted}
            >
              <Edit3 size={16} className="text-foreground" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteTask(task.id)}
              className="w-8 h-8 p-1 hover:bg-destructive/20 active:bg-destructive/40"
              aria-label={`Delete task ${task.title}`}
            >
              <Trash2 size={16} className="text-destructive" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
