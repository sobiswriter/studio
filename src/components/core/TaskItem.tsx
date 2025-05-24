"use client";

import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PixelTaskIcon } from '@/components/icons/PixelTaskIcon';
import { Edit3, Trash2, Clock, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskItem({ task, onToggleComplete, onEditTask, onDeleteTask }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCheckboxChange = () => {
    onToggleComplete(task.id, !task.isCompleted);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-md border-2 border-foreground bg-card transition-all duration-200 pixel-corners",
        task.isCompleted ? "bg-muted opacity-70" : "hover:shadow-[2px_2px_0px_hsl(var(--foreground))]",
        isHovered && !task.isCompleted ? "shadow-[2px_2px_0px_hsl(var(--foreground))]" : ""
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Checkbox
        id={`task-${task.id}`}
        checked={task.isCompleted}
        onCheckedChange={handleCheckboxChange}
        className="border-2 border-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground pixel-corners w-6 h-6"
        aria-label={`Mark task ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
      />
      <div className="flex-grow">
        <label
          htmlFor={`task-${task.id}`}
          className={cn(
            "font-pixel text-base cursor-pointer",
            task.isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
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
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEditTask(task)}
          className="w-8 h-8 p-1 hover:bg-accent/20 active:bg-accent/40"
          aria-label={`Edit task ${task.title}`}
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
