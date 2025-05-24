
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Task, UserProfile, PixelPalMessage } from '@/types';
import { AddTaskForm } from '@/components/core/AddTaskForm';
import { TaskList } from '@/components/core/TaskList';
import { ActiveQuestItem } from '@/components/core/ActiveQuestItem';
import { PixelSprite } from '@/components/core/PixelSprite';
import { UserProfileCard } from '@/components/core/UserProfileCard';
import { EditTaskModal } from '@/components/core/EditTaskModal';
import { CosmeticCustomizationPanel } from '@/components/core/CosmeticCustomizationPanel';
import { AnimatedCompletion } from '@/components/core/AnimatedCompletion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { suggestTasks as suggestTasksFlow, type SuggestTasksOutput } from '@/ai/flows/suggest-tasks';
import { calculateTaskXp as calculateTaskXpFlow, type CalculateTaskXpInput, type CalculateTaskXpOutput } from '@/ai/flows/calculate-task-xp'; // New import
import { XP_PER_TASK, LEVEL_THRESHOLDS, MAX_LEVEL, INITIAL_UNLOCKED_COSMETICS, HATS, ACCESSORIES, PAL_COLORS } from '@/lib/constants';
import { Award, Lightbulb, Zap, Loader2 } from 'lucide-react'; // Added Loader2

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [lastCompletedTaskElement, setLastCompletedTaskElement] = useState<HTMLElement | null>(null);
  const [pixelPalMessage, setPixelPalMessage] = useState<PixelPalMessage | null>(null);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiSuggestionsModal, setShowAiSuggestionsModal] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false); // For AddTaskForm loading state
  const [isSavingTask, setIsSavingTask] = useState(false); // For EditTaskModal loading state

  const { toast } = useToast();

  // --- User Profile Management ---
  const initializeUserProfile = () => {
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    } else {
      const initialProfile: UserProfile = {
        uid: 'simulated-user-123',
        xp: 0,
        level: 1,
        pixelSpriteCosmetics: {
          hat: HATS.find(h => h.id === 'none')?.id || 'none',
          accessory: ACCESSORIES.find(a => a.id === 'none')?.id || 'none',
          color: PAL_COLORS.find(c => c.id === 'default')?.id || 'default',
        },
        unlockedCosmetics: INITIAL_UNLOCKED_COSMETICS,
      };
      setUserProfile(initialProfile);
      localStorage.setItem('userProfile', JSON.stringify(initialProfile));
    }
  };

  const updateUserProfile = useCallback((updates: Partial<UserProfile>) => {
    setUserProfile(prev => {
      if (!prev) return null;
      const newProfile = { ...prev, ...updates };
      localStorage.setItem('userProfile', JSON.stringify(newProfile));
      return newProfile;
    });
  }, []);

  // --- Task Management ---
  const initializeTasks = () => {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
      const loadedTasks = (JSON.parse(storedTasks) as Task[]).map(task => ({
        ...task,
        isStarted: false, 
        startTime: undefined,
        timerId: undefined,
        xp: task.xp ?? XP_PER_TASK, // Assign default XP if missing
      }));
      setTasks(loadedTasks);
    }
  };

  const saveTasks = useCallback((updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  }, []);

  // --- Effects ---
  useEffect(() => {
    initializeUserProfile();
    initializeTasks();
    setPixelPalMessage({ text: "Hey there, Task Hero! Let's get questing!", type: 'greeting', timestamp: Date.now() });
  }, []);

  useEffect(() => {
    return () => {
      tasks.forEach(task => {
        if (task.timerId) {
          clearTimeout(task.timerId);
        }
      });
    };
  }, [tasks]);


  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt' | 'xp'>) => {
    setIsAddingTask(true);
    let taskXp = XP_PER_TASK; // Default XP

    try {
      const xpInput: CalculateTaskXpInput = {
        taskTitle: newTaskData.title,
        taskDuration: newTaskData.duration,
      };
      const xpResult: CalculateTaskXpOutput = await calculateTaskXpFlow(xpInput);
      taskXp = xpResult.xp;
      setPixelPalMessage({ text: `Calculated ${taskXp} XP for "${newTaskData.title}"!`, type: 'info', timestamp: Date.now() });
    } catch (error) {
      console.error("Error calculating task XP:", error);
      toast({
        title: "XP Calculation Error",
        description: `Could not calculate XP for "${newTaskData.title}". Using default ${XP_PER_TASK} XP.`,
        variant: "destructive",
        className: "font-pixel pixel-corners",
      });
      setPixelPalMessage({ text: `Hmm, had trouble figuring out XP for "${newTaskData.title}". Defaulting it!`, type: 'info', timestamp: Date.now() });
    }

    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      isCompleted: false,
      createdAt: Date.now(),
      isStarted: false,
      xp: taskXp,
    };
    saveTasks([...tasks, newTask]);
    setPixelPalMessage({ text: `Quest "${newTask.title}" added (${taskXp} XP)! You got this!`, type: 'info', timestamp: Date.now() });
    setIsAddingTask(false);
  };

  const handleToggleComplete = (taskId: string, isCompleted: boolean) => {
    const taskElement = document.getElementById(`task-${taskId}`);
    setLastCompletedTaskElement(taskElement);

    let taskTitleForMessage = "";
    let wasTimerSkipped = false; 
    let completedTaskXp = XP_PER_TASK;

    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        taskTitleForMessage = task.title;
        completedTaskXp = task.xp ?? XP_PER_TASK;
        wasTimerSkipped = task.isStarted && isCompleted && task.timerId !== undefined;

        if (task.isCompleted !== isCompleted) {
            if (isCompleted && userProfile) {
                const newXP = userProfile.xp + completedTaskXp; // Use task's specific XP
                let newLevel = userProfile.level;
                let leveledUp = false;
                
                while (newLevel < MAX_LEVEL && newXP >= LEVEL_THRESHOLDS[newLevel -1]) { // LEVEL_THRESHOLDS is 0-indexed for level requirements
                  if (newXP >= LEVEL_THRESHOLDS[newLevel]) { // Check against threshold for *next* level
                     newLevel++;
                     leveledUp = true;
                  } else {
                    break; 
                  }
                }


                const unlockedCosmetics = [...userProfile.unlockedCosmetics];
                if (leveledUp) {
                  const nextHat = HATS.find(h => !unlockedCosmetics.includes(h.id));
                  if(nextHat) unlockedCosmetics.push(nextHat.id);
                  const nextAccessory = ACCESSORIES.find(a => !unlockedCosmetics.includes(a.id));
                  if(nextAccessory) unlockedCosmetics.push(nextAccessory.id);
                  const nextColor = PAL_COLORS.find(c => !unlockedCosmetics.includes(c.id));
                  if(nextColor) unlockedCosmetics.push(nextColor.id);
                
                  toast({
                      title: "Level Up!",
                      description: `Congratulations! You've reached Level ${newLevel}! New cosmetics might be available!`,
                      className: "font-pixel pixel-corners border-2 border-primary shadow-[2px_2px_0px_hsl(var(--primary))]",
                  });
                  setPixelPalMessage({ text: `Woohoo! Level ${newLevel}! You're awesome!`, type: 'encouragement', timestamp: Date.now() });
                }
                
                updateUserProfile({ xp: newXP, level: newLevel, unlockedCosmetics });
                setShowCompletionAnimation(true);
            }
        }
        if (task.timerId && isCompleted) {
            clearTimeout(task.timerId);
        }
        return { 
          ...task, 
          isCompleted, 
          isStarted: isCompleted ? false : task.isStarted, 
          timerId: isCompleted ? undefined : task.timerId, 
          startTime: isCompleted ? undefined : task.startTime 
        };
      }
      return task;
    });
    
    if (isCompleted && taskTitleForMessage) {
       const originalTask = tasks.find(t => t.id === taskId);
       if (wasTimerSkipped) {
            setPixelPalMessage({ text: `Quest "${taskTitleForMessage}" timer skipped! Gained ${completedTaskXp} XP!`, type: 'encouragement', timestamp: Date.now() });
       } else if (originalTask && originalTask.isStarted) {
            setPixelPalMessage({ text: `Quest "${taskTitleForMessage}" auto-completed! ${completedTaskXp} XP earned!`, type: 'encouragement', timestamp: Date.now() });
       } else {
            setPixelPalMessage({ text: `Great job on completing "${taskTitleForMessage}"! ${completedTaskXp} XP for you!`, type: 'encouragement', timestamp: Date.now() });
       }
    }

    saveTasks(updatedTasks);
  };

  const handleEditTask = (taskToEdit: Task) => {
    if (taskToEdit.isStarted) {
        toast({ title: "Active Quest", description: "Cannot edit a quest while its timer is running.", className: "font-pixel pixel-corners"});
        return;
    }
    setEditingTask(taskToEdit);
  };

  const handleSaveTask = async (updatedTaskData: Task) => {
    setIsSavingTask(true);
    let finalTask = { ...updatedTaskData };
    const originalTask = tasks.find(t => t.id === updatedTaskData.id);

    // Recalculate XP if title or duration changed
    if (originalTask && (originalTask.title !== updatedTaskData.title || originalTask.duration !== updatedTaskData.duration)) {
      try {
        const xpInput: CalculateTaskXpInput = {
          taskTitle: updatedTaskData.title,
          taskDuration: updatedTaskData.duration,
        };
        const xpResult: CalculateTaskXpOutput = await calculateTaskXpFlow(xpInput);
        finalTask.xp = xpResult.xp;
        setPixelPalMessage({ text: `XP for "${updatedTaskData.title}" updated to ${xpResult.xp} XP!`, type: 'info', timestamp: Date.now() });
      } catch (error) {
        console.error("Error recalculating task XP:", error);
        finalTask.xp = originalTask.xp ?? XP_PER_TASK; // Fallback to old or default XP
        toast({
          title: "XP Recalculation Error",
          description: `Could not update XP for "${updatedTaskData.title}". Keeping previous XP.`,
          variant: "destructive",
          className: "font-pixel pixel-corners",
        });
        setPixelPalMessage({ text: `Trouble updating XP for "${updatedTaskData.title}". Previous XP kept.`, type: 'info', timestamp: Date.now() });
      }
    }

    saveTasks(tasks.map((task) => (task.id === finalTask.id ? finalTask : task)));
    setPixelPalMessage({ text: `Quest "${finalTask.title}" updated!`, type: 'info', timestamp: Date.now() });
    setIsSavingTask(false);
    setEditingTask(null); // Close modal after saving
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      if (taskToDelete.timerId) {
        clearTimeout(taskToDelete.timerId);
      }
      saveTasks(tasks.filter((task) => task.id !== taskId));
      setPixelPalMessage({ text: `Quest "${taskToDelete.title}" removed.`, type: 'info', timestamp: Date.now() });
    }
  };
  
  const handleUpdateCosmetics = (newCosmetics: UserProfile['pixelSpriteCosmetics']) => {
    if (userProfile) {
      updateUserProfile({ pixelSpriteCosmetics: newCosmetics });
      setPixelPalMessage({ text: `Lookin' good! Nice style choice!`, type: 'info', timestamp: Date.now() });
    }
  };

  const fetchAiSuggestions = async () => {
    setIsLoadingAiSuggestions(true);
    setPixelPalMessage({ text: "Let me think of some quests for you...", type: 'info', timestamp: Date.now() });
    try {
      const result: SuggestTasksOutput = await suggestTasksFlow({}); 
      setAiSuggestions(result.suggestedTasks);
      if (result.suggestedTasks.length > 0) {
        setShowAiSuggestionsModal(true);
        setPixelPalMessage({ text: "I've got some quest ideas for you!", type: 'suggestion', timestamp: Date.now() });
      } else {
        setPixelPalMessage({ text: "Hmm, can't think of anything right now. You're on top of it!", type: 'info', timestamp: Date.now() });
         toast({
            title: "No Suggestions",
            description: "Pixel Pal couldn't find any new task suggestions right now.",
            className: "font-pixel pixel-corners",
          });
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      setPixelPalMessage({ text: "Oops! Had a little trouble thinking. Try again later?", type: 'info', timestamp: Date.now() });
      toast({
        title: "AI Error",
        description: "Could not fetch task suggestions.",
        variant: "destructive",
        className: "font-pixel pixel-corners",
      });
    } finally {
      setIsLoadingAiSuggestions(false);
    }
  };

  const handleAddSuggestedTask = async (title: string) => {
    // For suggested tasks, we still go through handleAddTask to calculate XP
    await handleAddTask({ title, duration: 30 }); // Default duration 30 min for suggested
  };

  const handleStartQuest = (taskId: string) => {
    const taskToStart = tasks.find(t => t.id === taskId);
    if (taskToStart && taskToStart.duration && !taskToStart.isCompleted && !taskToStart.isStarted) {
      const timerDurationMs = taskToStart.duration * 60 * 1000;
      
      const newTimerId = setTimeout(() => {
        handleToggleComplete(taskId, true); 
      }, timerDurationMs) as unknown as number;

      saveTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, isStarted: true, startTime: Date.now(), timerId: newTimerId } 
          : t
      ));
      setPixelPalMessage({ text: `Quest "${taskToStart.title}" has begun! Good luck!`, type: 'info', timestamp: Date.now() });
    }
  };

  const handleCancelQuest = (taskId: string) => {
    const taskToCancel = tasks.find(t => t.id === taskId);
    if (taskToCancel && taskToCancel.timerId) {
      clearTimeout(taskToCancel.timerId);
      saveTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, isStarted: false, timerId: undefined, startTime: undefined } 
          : t
      ));
      setPixelPalMessage({ text: `Quest "${taskToCancel.title}" timer cancelled.`, type: 'info', timestamp: Date.now() });
    }
  };

  const handleSkipQuest = (taskId: string) => {
    handleToggleComplete(taskId, true);
  };

  const activeQuests = tasks.filter(task => task.isStarted && !task.isCompleted);
  const availableTasksForList = tasks; 

  return (
    <div className="container mx-auto p-4 space-y-6 md:space-y-8 max-w-5xl">
      <header className="text-center py-4">
        <h1 className="text-4xl md:text-5xl font-pixel text-primary drop-shadow-[3px_3px_0px_hsl(var(--foreground))]">Pixel Due</h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <section className="md:col-span-2 space-y-6">
          <AddTaskForm onAddTask={handleAddTask} isAdding={isAddingTask} />

          {activeQuests.length > 0 && (
            <Card className="pixel-corners border-2 border-primary shadow-[4px_4px_0px_hsl(var(--primary))]">
              <CardHeader>
                <CardTitle className="font-pixel flex items-center gap-2 text-primary"><Zap size={20} /> Active Quests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeQuests.map(task => (
                  <ActiveQuestItem 
                    key={task.id} 
                    task={task} 
                    onCancelQuest={handleCancelQuest} 
                    onSkipQuest={handleSkipQuest}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          <TaskList
            tasks={availableTasksForList}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onStartQuest={handleStartQuest}
          />
        </section>

        <aside className="space-y-6">
          {userProfile && <UserProfileCard userProfile={userProfile} />}
          <PixelSprite userProfile={userProfile} message={pixelPalMessage} />
          {userProfile && <CosmeticCustomizationPanel userProfile={userProfile} onUpdateCosmetics={handleUpdateCosmetics} />}
           <Button 
            onClick={fetchAiSuggestions} 
            disabled={isLoadingAiSuggestions}
            className="w-full font-pixel btn-pixel flex items-center justify-center gap-2"
          >
            {isLoadingAiSuggestions ? <Loader2 size={18} className="animate-spin" /> : <Lightbulb size={18} />}
            {isLoadingAiSuggestions ? "Thinking..." : "Get Quest Suggestions"}
          </Button>
        </aside>
      </main>

      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSaveTask={handleSaveTask}
        isSaving={isSavingTask}
      />
      
      <AnimatedCompletion
        show={showCompletionAnimation}
        onAnimationEnd={() => setShowCompletionAnimation(false)}
        targetElement={lastCompletedTaskElement}
      />

      <Dialog open={showAiSuggestionsModal} onOpenChange={setShowAiSuggestionsModal}>
        <DialogContent className="font-pixel pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
          <DialogHeader>
            <DialogTitle className="font-pixel flex items-center gap-2"><Award size={20}/> Pixel Pal Suggests!</DialogTitle>
            <DialogDescription className="font-pixel text-muted-foreground">
              Here are some quests you might want to add:
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc list-inside space-y-2 py-2 font-pixel">
            {aiSuggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
           <Button 
            onClick={async () => {
                for (const title of aiSuggestions) {
                  await handleAddSuggestedTask(title); // Add tasks one by one to calculate XP
                }
                setShowAiSuggestionsModal(false);
                toast({title: "Suggestions Added!", description: "Pixel Pal's suggested quests are now in your list.", className: "font-pixel pixel-corners"});
            }}
            className="w-full font-pixel btn-pixel mt-4"
            disabled={aiSuggestions.length === 0 || isAddingTask} // Disable if adding any task
            >
            {isAddingTask && aiSuggestions.length > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add All to My Quests"
              )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
