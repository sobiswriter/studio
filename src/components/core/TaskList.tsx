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
  onStartQuest: (taskId: string) => void;
}

export function TaskList({ tasks, onToggleComplete, onEditTask, onDeleteTask, onStartQuest }: TaskListProps) {
  const today = new Date().toISOString().split('T')[0];
  
  // Filter out tasks that are started and not completed, as they'll be in the ActiveQuests section
  const availableTasks = tasks.filter(task => !task.isStarted || task.isCompleted);

  const dueTodayTasks = availableTasks.filter(task => !task.isCompleted && task.dueDate === today);
  const upcomingTasks = availableTasks.filter(task => !task.isCompleted && task.dueDate && task.dueDate > today).sort((a,b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  const undatedTasks = availableTasks.filter(task => !task.isCompleted && !task.dueDate);
  const completedTasks = availableTasks.filter(task => task.isCompleted).sort((a,b) => (b.createdAt || 0) - (a.createdAt || 0));


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
              onStartQuest={onStartQuest}
            />
          ))}
        </div>
      </div>
    )
  );

  if (availableTasks.length === 0 && tasks.some(t => t.isStarted && !t.isCompleted)) {
     return (
      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="font-pixel flex items-center gap-2"><ListChecks size={20}/> Your Quests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground font-pixel">All available quests are active or completed. Check your Active Quests!</p>
        </CardContent>
      </Card>
    );
  }
  
  if (tasks.length === 0) { // This handles the case where there are absolutely no tasks (neither active nor available)
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
  
  const noAvailableTasksMessage = !dueTodayTasks.length && !upcomingTasks.length && !undatedTasks.length && !completedTasks.length;


  return (
    <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2"><ListChecks size={24}/> Your Available Quests</CardTitle>
      </CardHeader>
      <CardContent>
        {noAvailableTasksMessage && tasks.some(t => t.isStarted && !t.isCompleted) ? (
           <p className="text-center text-muted-foreground font-pixel">All available quests are active or completed. Check your Active Quests!</p>
        ) : noAvailableTasksMessage && tasks.length > 0 && tasks.every(t => t.isCompleted) ? (
           <p className="text-center text-muted-foreground font-pixel">All quests completed! Add more to continue.</p>
        ): (
        <ScrollArea className="h-[300px] pr-3"> {/* Adjust height as needed */}
          {renderTaskList(dueTodayTasks, "Due Today")}
          {renderTaskList(upcomingTasks, "Upcoming")}
          {renderTaskList(undatedTasks, "No Due Date")}
          {renderTaskList(completedTasks, "Completed")}
        </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
