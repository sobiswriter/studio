
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
import { calculateTaskXp as calculateTaskXpFlow, type CalculateTaskXpInput, type CalculateTaskXpOutput } from '@/ai/flows/calculate-task-xp';
import { XP_PER_TASK, LEVEL_THRESHOLDS, MAX_LEVEL, INITIAL_UNLOCKED_COSMETICS, HATS, ACCESSORIES, PAL_COLORS } from '@/lib/constants';
import { Award, Lightbulb, Zap, Loader2, CloudCog } from 'lucide-react';
import {
  onUserProfileSnapshot,
  createUserProfile as createUserProfileInDB,
  updateUserProfileData,
  onTasksSnapshot,
  addTaskToDB,
  updateTaskInDB,
  deleteTaskFromDB,
} from '@/services/firestoreService';
import type { Unsubscribe } from 'firebase/firestore';

const SIMULATED_USER_ID = 'simulated-user-123';

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
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const { toast } = useToast();

  // --- Firestore Listeners & Initialization ---
  useEffect(() => {
    setPixelPalMessage({ text: "Yo! Ready to crush some quests today? Let's do this!", type: 'greeting', timestamp: Date.now() });

    const unsubProfile = onUserProfileSnapshot(SIMULATED_USER_ID, (profileData) => {
      if (profileData) {
        setUserProfile(profileData);
      } else {
        // Create initial profile if it doesn't exist
        const initialProfile: UserProfile = {
          uid: SIMULATED_USER_ID,
          xp: 0,
          level: 1,
          pixelSpriteCosmetics: {
            hat: HATS.find(h => h.id === 'none')?.id || 'none',
            accessory: ACCESSORIES.find(a => a.id === 'none')?.id || 'none',
            color: PAL_COLORS.find(c => c.id === 'default')?.id || 'default',
          },
          unlockedCosmetics: INITIAL_UNLOCKED_COSMETICS,
        };
        createUserProfileInDB(SIMULATED_USER_ID, initialProfile).then(() => {
          setUserProfile(initialProfile);
          setPixelPalMessage({ text: "New hero profile set up in the cloud! Welcome aboard!", type: 'info', timestamp: Date.now() });
        }).catch(err => {
          console.error("Failed to create profile in DB:", err);
          setPixelPalMessage({ text: "Hmm, couldn't save your new profile to the cloud. We'll try again later.", type: 'info', timestamp: Date.now() });
        });
      }
      setIsLoadingProfile(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      toast({ title: "Profile Error", description: "Could not load user profile from Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
      setIsLoadingProfile(false);
      setPixelPalMessage({ text: "Yikes! Trouble loading your hero stats from the cloud.", type: 'info', timestamp: Date.now() });
    });

    const unsubTasks = onTasksSnapshot(SIMULATED_USER_ID, (fetchedTasks) => {
      const loadedTasks = fetchedTasks.map(task => ({
        ...task,
        isStarted: task.isStarted ?? false,
        startTime: task.startTime,
        timerId: undefined, // Timers are client-side only, re-establish if needed
        xp: task.xp ?? XP_PER_TASK,
      }));
      setTasks(loadedTasks);
      setIsLoadingTasks(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Tasks Error", description: "Could not load tasks from Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
      setIsLoadingTasks(false);
      setPixelPalMessage({ text: "Error summoning your quests from the Firebase ether!", type: 'info', timestamp: Date.now() });
    });

    return () => {
      unsubProfile();
      unsubTasks();
      // Clear any active client-side timers
      tasks.forEach(task => {
        if (task.timerId) clearTimeout(task.timerId);
      });
    };
  }, [tasks]); // Rerun if tasks change to clear old timers

  // --- Task Management ---
  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt' | 'xp' | 'isStarted'>) => {
    setIsAddingTask(true);
    let taskXp = XP_PER_TASK;

    try {
      setPixelPalMessage({ text: `XP crunchin' for "${newTaskData.title}"... Hold tight!`, type: 'info', timestamp: Date.now() });
      const xpInput: CalculateTaskXpInput = {
        taskTitle: newTaskData.title,
        taskDuration: newTaskData.duration,
      };
      const xpResult: CalculateTaskXpOutput = await calculateTaskXpFlow(xpInput);
      taskXp = xpResult.xp;
      setPixelPalMessage({ text: `XP calculation complete! "${newTaskData.title}" is worth ${taskXp} XP. Sweet!`, type: 'info', timestamp: Date.now() });
    } catch (error) {
      console.error("Error calculating task XP:", error);
      toast({
        title: "XP Calculation Error",
        description: `Could not calculate XP for "${newTaskData.title}". Using default ${XP_PER_TASK} XP.`,
        variant: "destructive",
        className: "font-pixel pixel-corners",
      });
      setPixelPalMessage({ text: `Math is hard sometimes... Had trouble with XP for "${newTaskData.title}". Defaulting it to ${XP_PER_TASK} XP!`, type: 'info', timestamp: Date.now() });
    }

    const newTask: Omit<Task, 'id'> = { // Firestore generates ID
      ...newTaskData,
      isCompleted: false,
      createdAt: Date.now(),
      isStarted: false,
      xp: taskXp,
    };

    try {
      const addedTask = await addTaskToDB(SIMULATED_USER_ID, newTask);
      if (addedTask) {
        // UI will update via onSnapshot listener
        setPixelPalMessage({ text: `Alright, quest "${newTask.title}" locked and loaded in the cloud! Go get 'em!`, type: 'info', timestamp: Date.now() });
      } else {
        throw new Error("Task not added to DB");
      }
    } catch (error) {
      console.error("Error adding task to DB:", error);
      toast({ title: "Save Error", description: `Could not save "${newTask.title}" to Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
      setPixelPalMessage({ text: `Hmm, cloud save for "${newTask.title}" hiccuped. Try again?`, type: 'info', timestamp: Date.now() });
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleComplete = async (taskId: string, isCompletedParam: boolean) => {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask || !userProfile) {
      setPixelPalMessage({ text: "Huh, that quest seems to have vanished. Or maybe it's just shy?", type: 'info', timestamp: Date.now() });
      return;
    }

    setLastCompletedTaskElement(document.getElementById(`task-${taskId}`));

    const taskTitleForMessage = originalTask.title;
    const completedTaskXp = originalTask.xp ?? XP_PER_TASK;

    // Clear client-side timer if one exists for this task
    if (originalTask.timerId && isCompletedParam) {
      clearTimeout(originalTask.timerId);
    }
    
    const taskUpdateData: Partial<Task> = {
      isCompleted: isCompletedParam,
      isStarted: isCompletedParam ? false : originalTask.isStarted, // If completing, it's no longer started
      startTime: isCompletedParam ? undefined : originalTask.startTime, // Clear startTime if completing
      // timerId is client-side, not stored in DB in this manner
    };

    let profileUpdateData: Partial<UserProfile> | null = null;
    let leveledUp = false;
    let newLevelForMessage = userProfile.level;

    if (isCompletedParam) {
      const newXP = userProfile.xp + completedTaskXp;
      let newLevel = userProfile.level;
      const unlockedCosmetics = [...userProfile.unlockedCosmetics];

      while (newLevel < MAX_LEVEL && newXP >= LEVEL_THRESHOLDS[newLevel]) {
        newLevel++;
        leveledUp = true;
        const nextHat = HATS.find(h => !unlockedCosmetics.includes(h.id));
        if(nextHat) unlockedCosmetics.push(nextHat.id);
        const nextAccessory = ACCESSORIES.find(a => !unlockedCosmetics.includes(a.id));
        if(nextAccessory) unlockedCosmetics.push(nextAccessory.id);
        const nextColor = PAL_COLORS.find(c => !unlockedCosmetics.includes(c.id));
        if(nextColor) unlockedCosmetics.push(nextColor.id);
      }
      newLevelForMessage = newLevel;
      profileUpdateData = { xp: newXP, level: newLevel, unlockedCosmetics };
      setShowCompletionAnimation(true);
    }
    
    const dbSuccess = await updateTaskInDB(SIMULATED_USER_ID, taskId, taskUpdateData);

    if (dbSuccess) {
      if (isCompletedParam) {
        let messageText = `Woohoo! "${taskTitleForMessage}" conquered! +${completedTaskXp} XP! You're on a roll!`;
        let messageType: PixelPalMessage['type'] = 'encouragement';

        const wasActive = originalTask.isStarted === true;
        const wasSkippedManually = wasActive && originalTask.timerId !== undefined; // Timer was active and this action completes it.

        if (wasSkippedManually && originalTask.startTime && typeof originalTask.duration === 'number') {
          const elapsedTimeMs = Date.now() - originalTask.startTime;
          const totalDurationMs = originalTask.duration * 60 * 1000;
          if (elapsedTimeMs < totalDurationMs * 0.25) { // Skipped early
            messageText = `"${taskTitleForMessage}", huh? Finished *real* quick. Did you just... blink? 😉 (+${completedTaskXp} XP, I guess!)`;
            messageType = 'info';
          } else { // Skipped but not "too" early
            messageText = `Quest "${taskTitleForMessage}" timer skipped! Strategic. +${completedTaskXp} XP!`;
          }
        } else if (wasActive && !originalTask.timerId && typeof originalTask.duration === 'number') { 
          // This case indicates it was likely auto-completed by its timer (timerId would be cleared by page.tsx's setTimeout before calling this)
          messageText = `Beep boop! Timer for "${taskTitleForMessage}" is UP! Quest auto-completed! +${completedTaskXp} XP! Nice one!`;
        }
        setPixelPalMessage({ text: messageText, type: messageType, timestamp: Date.now() });
        
        if (profileUpdateData) {
          await updateUserProfileData(SIMULATED_USER_ID, profileUpdateData);
        }

        if (leveledUp) {
          toast({
            title: "LEVEL UP!",
            description: `Whoa! You blasted to Level ${newLevelForMessage}! New cosmetics might be shining for you!`,
            className: "font-pixel pixel-corners border-2 border-primary shadow-[2px_2px_0px_hsl(var(--primary))]",
          });
          setTimeout(() => { // Delayed Pal message for level up
             setPixelPalMessage({ text: `LEVEL ${newLevelForMessage}! You're basically a legend now. Check for new styles!`, type: 'encouragement', timestamp: Date.now() });
          }, 200);
        }
      } else {
         // Task marked as incomplete
         setPixelPalMessage({ text: `Quest "${taskTitleForMessage}" is back on the list. No worries!`, type: 'info', timestamp: Date.now() });
      }
    } else {
      setPixelPalMessage({ text: `Cloud sync for "${taskTitleForMessage}" went sideways. Changes might not stick.`, type: 'info', timestamp: Date.now() });
      toast({ title: "Sync Error", description: `Could not update "${taskTitleForMessage}" in Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
    }
  };

  const handleEditTask = (taskToEdit: Task) => {
    if (taskToEdit.isStarted) {
        toast({ title: "Active Quest", description: "Cannot edit a quest while its timer is running. Too intense!", className: "font-pixel pixel-corners"});
        setPixelPalMessage({ text: `Whoa there! Can't edit "${taskToEdit.title}" while it's an active quest. Finish or cancel it first!`, type: 'info', timestamp: Date.now() });
        return;
    }
    setEditingTask(taskToEdit);
  };

  const handleSaveTask = async (updatedTaskData: Task) => {
    setIsSavingTask(true);
    let finalTask = { ...updatedTaskData };
    const originalTask = tasks.find(t => t.id === updatedTaskData.id);

    if (originalTask && (originalTask.title !== updatedTaskData.title || originalTask.duration !== updatedTaskData.duration)) {
      try {
        setPixelPalMessage({ text: `Recalculating XP for "${updatedTaskData.title}"... one sec!`, type: 'info', timestamp: Date.now() });
        const xpInput: CalculateTaskXpInput = {
          taskTitle: updatedTaskData.title,
          taskDuration: updatedTaskData.duration,
        };
        const xpResult: CalculateTaskXpOutput = await calculateTaskXpFlow(xpInput);
        finalTask.xp = xpResult.xp;
        setPixelPalMessage({ text: `XP for "${updatedTaskData.title}" recalibrated to ${xpResult.xp} XP! All official.`, type: 'info', timestamp: Date.now() });
      } catch (error) {
        console.error("Error recalculating task XP:", error);
        finalTask.xp = originalTask.xp ?? XP_PER_TASK;
        toast({
          title: "XP Recalculation Error",
          description: `Could not update XP for "${updatedTaskData.title}". Keeping previous XP.`,
          variant: "destructive",
          className: "font-pixel pixel-corners",
        });
        setPixelPalMessage({ text: `My XP calculator is on the fritz for "${updatedTaskData.title}". Kept the old XP value!`, type: 'info', timestamp: Date.now() });
      }
    }

    try {
      // Don't save client-side timerId to DB
      const { timerId, ...taskToSave } = finalTask;
      const success = await updateTaskInDB(SIMULATED_USER_ID, taskToSave.id, taskToSave);
      if (success) {
        setPixelPalMessage({ text: `Quest "${finalTask.title}" updated in the cloud. Looking sharp!`, type: 'info', timestamp: Date.now() });
        setEditingTask(null);
      } else {
        throw new Error("DB Update Failed");
      }
    } catch (error) {
      console.error("Error saving task to DB:", error);
      toast({ title: "Save Error", description: `Could not save changes for "${finalTask.title}" to Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
      setPixelPalMessage({ text: `Cloud save for "${finalTask.title}" edits failed. Changes might be local only.`, type: 'info', timestamp: Date.now() });
    } finally {
      setIsSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      if (taskToDelete.timerId) {
        clearTimeout(taskToDelete.timerId);
      }
      try {
        await deleteTaskFromDB(SIMULATED_USER_ID, taskId);
        // UI updates via onSnapshot
        setPixelPalMessage({ text: `Quest "${taskToDelete.title}" zapped from the records! Poof!`, type: 'info', timestamp: Date.now() });
        toast({ title: "Quest Deleted", description: `"${taskToDelete.title}" has been removed.`, className: "font-pixel pixel-corners" });
      } catch (error) {
        console.error("Error deleting task from DB:", error);
        toast({ title: "Delete Error", description: `Could not delete "${taskToDelete.title}" from Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
        setPixelPalMessage({ text: `Couldn't make "${taskToDelete.title}" vanish from the cloud. It's gone locally, though.`, type: 'info', timestamp: Date.now() });
      }
    }
  };
  
  const handleUpdateCosmetics = async (newCosmetics: UserProfile['pixelSpriteCosmetics']) => {
    if (userProfile) {
      const success = await updateUserProfileData(SIMULATED_USER_ID, { pixelSpriteCosmetics: newCosmetics });
      if (success) {
        setPixelPalMessage({ text: `Ooh, look at you! That new style is 🔥! Pal is looking fresh.`, type: 'info', timestamp: Date.now() });
      } else {
        setPixelPalMessage({ text: "Tried to update your Pal's look in the cloud, but it didn't stick. Style is local for now!", type: 'info', timestamp: Date.now() });
        toast({ title: "Cosmetic Sync Error", description: "Could not save cosmetic changes to Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
      }
    }
  };

  const fetchAiSuggestions = async () => {
    setIsLoadingAiSuggestions(true);
    setPixelPalMessage({ text: "My circuits are whirring... Cooking up some quest ideas!", type: 'info', timestamp: Date.now() });
    try {
      const result: SuggestTasksOutput = await suggestTasksFlow({}); 
      setAiSuggestions(result.suggestedTasks);
      if (result.suggestedTasks.length > 0) {
        setShowAiSuggestionsModal(true);
        setPixelPalMessage({ text: "Eureka! Got some fresh quest suggestions for ya!", type: 'suggestion', timestamp: Date.now() });
      } else {
        setPixelPalMessage({ text: "My suggestion box is empty! You're either a mind reader or just super organized. Nice!", type: 'info', timestamp: Date.now() });
         toast({
            title: "No Suggestions",
            description: "Pixel Pal couldn't find any new task suggestions right now.",
            className: "font-pixel pixel-corners",
          });
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      setPixelPalMessage({ text: "My AI brain just blue-screened for a sec. Maybe try asking for suggestions again in a bit?", type: 'info', timestamp: Date.now() });
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
    await handleAddTask({ title, duration: 30 });
  };

  const handleStartQuest = async (taskId: string) => {
    const taskToStart = tasks.find(t => t.id === taskId);
    if (taskToStart && taskToStart.duration && !taskToStart.isCompleted && !taskToStart.isStarted) {
      const timerDurationMs = taskToStart.duration * 60 * 1000;
      
      const newTimerId = setTimeout(() => {
        // Remove client-side timerId from local state before calling toggleComplete
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? {...t, timerId: undefined} : t));
        handleToggleComplete(taskId, true); 
      }, timerDurationMs) as unknown as number;

      // Update local state first for immediate UI feedback of timerId
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, isStarted: true, startTime: Date.now(), timerId: newTimerId } 
          : t
      ));
      
      // Then update Firestore (without timerId)
      const success = await updateTaskInDB(SIMULATED_USER_ID, taskId, { isStarted: true, startTime: Date.now() });
      if (success) {
        setPixelPalMessage({ text: `Timer started for "${taskToStart.title}"! Go get 'em, tiger!`, type: 'info', timestamp: Date.now() });
      } else {
        // Revert local state if DB fails (or rely on onSnapshot)
         setTasks(prevTasks => prevTasks.map(t => 
            t.id === taskId 
            ? { ...t, isStarted: false, startTime: undefined, timerId: undefined } 
            : t
        ));
        if (newTimerId) clearTimeout(newTimerId);
        setPixelPalMessage({ text: `Failed to mark "${taskToStart.title}" as active in the cloud. Timer cancelled.`, type: 'info', timestamp: Date.now() });
        toast({ title: "Sync Error", description: `Could not start timer for "${taskToStart.title}" in Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
      }
    }
  };

  const handleCancelQuest = async (taskId: string) => {
    const taskToCancel = tasks.find(t => t.id === taskId);
    if (taskToCancel && taskToCancel.timerId) {
      clearTimeout(taskToCancel.timerId);
      // Update local state first
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, isStarted: false, timerId: undefined, startTime: undefined } 
          : t
      ));
      // Then update Firestore
      const success = await updateTaskInDB(SIMULATED_USER_ID, taskId, { isStarted: false, startTime: undefined });
      if (success) {
        setPixelPalMessage({ text: `Quest "${taskToCancel.title}" timer paused. Taking a strategic break, eh?`, type: 'info', timestamp: Date.now() });
      } else {
        // Revert local state or rely on onSnapshot
        setTasks(prevTasks => prevTasks.map(t => // This revert might conflict with onSnapshot if not careful
            t.id === taskId && taskToCancel.startTime // ensure original values are used for revert
            ? { ...t, isStarted: true, timerId: taskToCancel.timerId, startTime: taskToCancel.startTime } 
            : t
        ));
        setPixelPalMessage({ text: `Cloud didn't get the memo on cancelling "${taskToCancel.title}". Timer might still be "active" there.`, type: 'info', timestamp: Date.now() });
      }
    }
  };

  const handleSkipQuest = (taskId: string) => {
    // The main logic and sarcastic message for early skip is handled in handleToggleComplete
    handleToggleComplete(taskId, true);
  };

  const checkDueTasksAndRemind = useCallback(() => {
    if (isLoadingProfile || isLoadingTasks || !tasks.length) return;

    const today = new Date().toISOString().split('T')[0];
    const tasksDueToday = tasks.filter(task => !task.isCompleted && task.dueDate === today);

    if (tasksDueToday.length > 0) {
      setPixelPalMessage({ text: `Heads up, superstar! You've got ${tasksDueToday.length} quest${tasksDueToday.length > 1 ? 's' : ''} on the docket for today. Go shine!`, type: 'reminder', timestamp: Date.now() });
    } else if (tasks.length > 0 && tasks.every(t => t.isCompleted || t.dueDate !== today || !t.dueDate)) {
      setPixelPalMessage({ text: "Today's quest log: squeaky clean! Or... you haven't added any for today. Either way, you're the boss!", type: 'info', timestamp: Date.now() });
    }
  }, [tasks, isLoadingProfile, isLoadingTasks]);

  useEffect(() => {
    const reminderTimer = setTimeout(checkDueTasksAndRemind, 2000); // Check after initial load
    return () => clearTimeout(reminderTimer);
  }, [checkDueTasksAndRemind]);


  const activeQuests = tasks.filter(task => task.isStarted && !task.isCompleted);
  const availableTasksForList = tasks; 

  if (isLoadingProfile || isLoadingTasks) {
    return (
      <div className="container mx-auto p-4 space-y-6 md:space-y-8 max-w-5xl flex flex-col items-center justify-center min-h-screen">
        <CloudCog size={64} className="animate-bounce text-primary mb-4" />
        <p className="font-pixel text-xl text-foreground">Summoning Quests & Hero Stats...</p>
        <p className="font-pixel text-sm text-muted-foreground">Pixel Pal is connecting to the mothership...</p>
      </div>
    );
  }

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
              Here are some quests my AI brain cooked up for you:
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
                  await handleAddSuggestedTask(title);
                }
                setShowAiSuggestionsModal(false);
                toast({title: "Suggestions Added!", description: "Pixel Pal's suggested quests are now in your list. Go get 'em!", className: "font-pixel pixel-corners"});
                setPixelPalMessage({ text: "All suggested quests added to your list. You're unstoppable!", type: 'info', timestamp: Date.now() });
            }}
            className="w-full font-pixel btn-pixel mt-4"
            disabled={aiSuggestions.length === 0 || isAddingTask}
            >
            {isAddingTask && aiSuggestions.length > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding All...
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

