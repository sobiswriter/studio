"use client";

import { useState, useEffect, useCallback } from 'react';
import type { Task, UserProfile, PixelPalMessage } from '@/types';
import { AddTaskForm } from '@/components/core/AddTaskForm';
import { TaskList } from '@/components/core/TaskList';
import { PixelSprite } from '@/components/core/PixelSprite';
import { UserProfileCard } from '@/components/core/UserProfileCard';
import { EditTaskModal } from '@/components/core/EditTaskModal';
import { CosmeticCustomizationPanel } from '@/components/core/CosmeticCustomizationPanel';
import { AnimatedCompletion } from '@/components/core/AnimatedCompletion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";
import { suggestTasks as suggestTasksFlow, type SuggestTasksOutput } from '@/ai/flows/suggest-tasks';
import { XP_PER_TASK, LEVEL_THRESHOLDS, MAX_LEVEL, INITIAL_UNLOCKED_COSMETICS, HATS, ACCESSORIES, PAL_COLORS } from '@/lib/constants';
import { Award, Lightbulb } from 'lucide-react';

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

  const { toast } = useToast();

  // --- User Profile Management ---
  const initializeUserProfile = () => {
    // Try to load from local storage
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      setUserProfile(JSON.parse(storedProfile));
    } else {
      // Default initial profile
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
      setTasks(JSON.parse(storedTasks));
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


  const handleAddTask = (newTaskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: crypto.randomUUID(),
      isCompleted: false,
      createdAt: Date.now(),
    };
    saveTasks([...tasks, newTask]);
    setPixelPalMessage({ text: `Quest "${newTask.title}" added! You got this!`, type: 'info', timestamp: Date.now() });
  };

  const handleToggleComplete = (taskId: string, isCompleted: boolean) => {
    const taskElement = document.getElementById(`task-${taskId}`);
    setLastCompletedTaskElement(taskElement);

    saveTasks(
      tasks.map((task) => {
        if (task.id === taskId && task.isCompleted !== isCompleted) {
          if (isCompleted && userProfile) { // Task marked as complete
            const newXP = userProfile.xp + XP_PER_TASK;
            let newLevel = userProfile.level;
            let leveledUp = false;
            
            while (newLevel < MAX_LEVEL && newXP >= LEVEL_THRESHOLDS[newLevel]) {
              newLevel++;
              leveledUp = true;
            }

            const unlockedCosmetics = [...userProfile.unlockedCosmetics];
            if (leveledUp) {
              // For simplicity, unlock one of each type if available and not yet unlocked
              // This logic would be more sophisticated in a full app
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
            } else {
              setPixelPalMessage({ text: `Great job on completing "${task.title}"! Keep it up!`, type: 'encouragement', timestamp: Date.now() });
            }
            
            updateUserProfile({ xp: newXP, level: newLevel, unlockedCosmetics });
            setShowCompletionAnimation(true);
          }
          return { ...task, isCompleted };
        }
        return task;
      })
    );
  };

  const handleEditTask = (taskToEdit: Task) => {
    setEditingTask(taskToEdit);
  };

  const handleSaveTask = (updatedTask: Task) => {
    saveTasks(tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)));
    setPixelPalMessage({ text: `Quest "${updatedTask.title}" updated!`, type: 'info', timestamp: Date.now() });
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    saveTasks(tasks.filter((task) => task.id !== taskId));
    if (taskToDelete) {
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
      // Simulate AI call, in real app you'd pass user task history or relevant data
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

  return (
    <div className="container mx-auto p-4 space-y-6 md:space-y-8 max-w-5xl">
      <header className="text-center py-4">
        <h1 className="text-4xl md:text-5xl font-pixel text-primary drop-shadow-[3px_3px_0px_hsl(var(--foreground))]">Task Sprite Quest</h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <section className="md:col-span-2 space-y-6">
          <AddTaskForm onAddTask={handleAddTask} />
          <TaskList
            tasks={tasks}
            onToggleComplete={handleToggleComplete}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
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
            <Lightbulb size={18} />
            {isLoadingAiSuggestions ? "Thinking..." : "Get Quest Suggestions"}
          </Button>
        </aside>
      </main>

      <EditTaskModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSaveTask={handleSaveTask}
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
            onClick={() => {
                aiSuggestions.forEach(title => handleAddTask({ title }));
                setShowAiSuggestionsModal(false);
                toast({title: "Suggestions Added!", description: "Pixel Pal's suggested quests are now in your list.", className: "font-pixel pixel-corners"});
            }}
            className="w-full font-pixel btn-pixel mt-4"
            disabled={aiSuggestions.length === 0}
            >
            Add All to My Quests
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
