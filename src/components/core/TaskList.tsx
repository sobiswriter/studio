"use client";

import type { Task } from '@/types';
import { TaskItem } from './TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ListChecks } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function TaskList({ tasks, onToggleComplete, onEditTask, onDeleteTask }: TaskListProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const dueTodayTasks = tasks.filter(task => !task.isCompleted && task.dueDate === today);
  const upcomingTasks = tasks.filter(task => !task.isCompleted && task.dueDate && task.dueDate > today).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  const undatedTasks = tasks.filter(task => !task.isCompleted && !task.dueDate);
  const completedTasks = tasks.filter(task => task.isCompleted).sort((a,b) => b.createdAt - a.createdAt);


  const renderTaskList = (taskList: Task[], title: string) => (
    taskList.length > 0 && (
      <div key={title}>
        <h3 className="font-pixel text-lg my-3 ml-1">{title}</h3>
        <div className="space-y-2">
          {taskList.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
            />
          ))}
        </div>
      </div>
    )
  );

  if (tasks.length === 0) {
    return (
      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="font-pixel flex items-center gap-2"><ListChecks size={20}/> Your Quests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground font-pixel">No quests yet. Add some to start your adventure!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2"><ListChecks size={24}/> Your Quests</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-3"> {/* Adjust height as needed */}
          {renderTaskList(dueTodayTasks, "Due Today")}
          {renderTaskList(upcomingTasks, "Upcoming")}
          {renderTaskList(undatedTasks, "No Due Date")}
          {renderTaskList(completedTasks, "Completed")}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
