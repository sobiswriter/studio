"use client";

import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
// import { PixelTaskIcon } from '@/components/icons/PixelTaskIcon'; // Not used, can be removed if not needed elsewhere
import { Edit3, Trash2, Clock, CalendarDays, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onStartQuest?: (taskId: string) => void; // Optional for now, will be used from TaskList
}

export function TaskItem({ task, onToggleComplete, onEditTask, onDeleteTask, onStartQuest }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckboxChange = () => {
    onToggleComplete(task.id, !task.isCompleted);
  };

  return (
    <div
      id={`task-${task.id}`} // Added id for sparkle animation target
      className={cn(
        "flex items-center gap-3 p-3 rounded-md border-2 border-foreground bg-card transition-all duration-200 pixel-corners",
        task.isCompleted ? "bg-muted opacity-70" : "hover:shadow-[2px_2px_0px_hsl(var(--foreground))]",
        isHovered && !task.isCompleted ? "shadow-[2px_2px_0px_hsl(var(--foreground))]" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Checkbox
        id={`task-checkbox-${task.id}`} // Ensure unique id for label association
        checked={task.isCompleted}
        onCheckedChange={handleCheckboxChange}
        className="border-2 border-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground pixel-corners w-6 h-6"
        aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
        disabled={!!task.isStarted} // Disable checkbox if task is started
      />
      <div className="flex-grow">
        <label
          htmlFor={`task-checkbox-${task.id}`}
          className={cn(
            "font-pixel text-base cursor-pointer",
            task.isCompleted && "line-through text-muted-foreground",
            task.isStarted && !task.isCompleted && "text-accent" // Style for started task
          )}
        >
          {task.title} {task.isStarted && !task.isCompleted && "(Active)"}
        </label>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          {task.duration && (
            <span className="flex items-center gap-1 font-pixel"><Clock size={12} /> {task.duration} min</span>
          )}
          {task.dueDate && (
            <span className="flex items-center gap-1 font-pixel"><CalendarDays size={12} /> {task.dueDate}</span>
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
            aria-label={`Start quest ${task.title}`}
          >
            <PlayCircle size={18} className="text-primary" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEditTask(task)}
          className="w-8 h-8 p-1 hover:bg-accent/20 active:bg-accent/40"
          aria-label={`Edit task ${task.title}`}
          disabled={!!task.isStarted} // Disable edit if task is started
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
      </div>
    </div>
  );
}
