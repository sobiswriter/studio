
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
import { PixelPalLog } from '@/components/core/PixelPalLog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { suggestTasks as suggestTasksFlow, type SuggestTasksOutput } from '@/ai/flows/suggest-tasks';
import { calculateTaskXp as calculateTaskXpFlow, type CalculateTaskXpInput, type CalculateTaskXpOutput } from '@/ai/flows/calculate-task-xp';
import { XP_PER_TASK, LEVEL_THRESHOLDS, MAX_LEVEL, INITIAL_UNLOCKED_COSMETICS, HATS, ACCESSORIES, PAL_COLORS, INITIAL_PAL_CREDITS, CREDITS_PER_LEVEL_UP, ASK_PAL_COST } from '@/lib/constants';
import { Award, Lightbulb, Zap, Loader2, CloudCog, MessageCircleQuestion, Sparkles } from 'lucide-react';
import {
  onUserProfileSnapshot,
  createUserProfileInDB,
  updateUserProfileData,
  onTasksSnapshot,
  addTaskToDB,
  updateTaskInDB,
  deleteTaskFromDB,
} from '../services/firestoreService'; // Using relative path
import type { Unsubscribe } from 'firebase/firestore';

const SIMULATED_USER_ID = 'simulated-user-123';
const MAX_LOG_ENTRIES = 20;

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [lastCompletedTaskElement, setLastCompletedTaskElement] = useState<HTMLElement | null>(null);
  
  const [currentPixelPalMessage, setCurrentPixelPalMessage] = useState<PixelPalMessage | null>(null);
  const [pixelPalMessageLog, setPixelPalMessageLog] = useState<PixelPalMessage[]>([]);

  const [isLoadingAskPal, setIsLoadingAskPal] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAiSuggestionsModal, setShowAiSuggestionsModal] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  const { toast } = useToast();

  const showPixelPalMessage = useCallback((text: string, type: PixelPalMessage['type']) => {
    const newMessage: PixelPalMessage = { text, type, timestamp: Date.now() };
    setCurrentPixelPalMessage(newMessage);
    setPixelPalMessageLog(prevLog => [newMessage, ...prevLog].slice(0, MAX_LOG_ENTRIES));
  }, []);


  // --- Firestore Listeners & Initialization ---
  useEffect(() => {
    showPixelPalMessage("Yo! Ready to crush some quests today? Let's do this!", 'greeting');

    const unsubProfile = onUserProfileSnapshot(SIMULATED_USER_ID, (profileData) => {
      if (profileData) {
        setUserProfile(profileData);
      } else {
        // Create initial profile if it doesn't exist
        const initialProfile: UserProfile = {
          uid: SIMULATED_USER_ID,
          xp: 0,
          level: 1,
          palCredits: INITIAL_PAL_CREDITS, // Initialize Pal Credits
          pixelSpriteCosmetics: {
            hat: HATS.find(h => h.id === 'none')?.id || 'none',
            accessory: ACCESSORIES.find(a => a.id === 'none')?.id || 'none',
            color: PAL_COLORS.find(c => c.id === 'default')?.id || 'default',
          },
          unlockedCosmetics: INITIAL_UNLOCKED_COSMETICS,
        };
        createUserProfileInDB(SIMULATED_USER_ID, initialProfile).then(() => {
          setUserProfile(initialProfile);
          showPixelPalMessage(`New hero profile set up in the cloud! Welcome aboard! You start with ${INITIAL_PAL_CREDITS} Pal Credits!`, 'info');
        }).catch(err => {
          console.error("Failed to create profile in DB:", err);
          showPixelPalMessage("Hmm, couldn't save your new profile to the cloud. We'll try again later.", 'info');
        });
      }
      setIsLoadingProfile(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      toast({ title: "Profile Error", description: "Could not load user profile from Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
      setIsLoadingProfile(false);
      showPixelPalMessage("Yikes! Trouble loading your hero stats from the cloud.", 'info');
    });

    const unsubTasks = onTasksSnapshot(SIMULATED_USER_ID, (fetchedTasks) => {
      const loadedTasks = fetchedTasks.map(task => ({
        ...task,
        isStarted: task.isStarted ?? false,
        startTime: task.startTime,
        timerId: undefined, 
        xp: task.xp ?? XP_PER_TASK,
      }));
      setTasks(loadedTasks);
      setIsLoadingTasks(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Tasks Error", description: "Could not load tasks from Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
      setIsLoadingTasks(false);
      showPixelPalMessage("Error summoning your quests from the Firebase ether!", 'info');
    });

    return () => {
      unsubProfile();
      unsubTasks();
      tasks.forEach(task => {
        if (task.timerId) clearTimeout(task.timerId);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPixelPalMessage]); 

  // --- Task Management ---
  const handleAddTask = async (newTaskData: Omit<Task, 'id' | 'isCompleted' | 'createdAt' | 'xp' | 'isStarted'>) => {
    setIsAddingTask(true);
    try {
      showPixelPalMessage(`XP crunchin' for "${newTaskData.title}"... Hold tight!`, 'info');
      const xpInput: CalculateTaskXpInput = {
        taskTitle: newTaskData.title,
        taskDuration: newTaskData.duration,
      };
      const xpResult: CalculateTaskXpOutput = await calculateTaskXpFlow(xpInput);
      const taskXp = xpResult.xp;
      showPixelPalMessage(`XP calculation complete! "${newTaskData.title}" is worth ${taskXp} XP. Sweet!`, 'info');
      
      const newTask: Omit<Task, 'id'> = { 
        ...newTaskData,
        isCompleted: false,
        createdAt: Date.now(),
        isStarted: false,
        xp: taskXp,
      };

      const addedTask = await addTaskToDB(SIMULATED_USER_ID, newTask);
      if (addedTask) {
        showPixelPalMessage(`Alright, quest "${newTask.title}" locked and loaded in the cloud! Go get 'em!`, 'info');
      } else {
        throw new Error("Task not added to DB");
      }
    } catch (error) {
      console.error("Error during task addition or XP calculation:", error);
      toast({ title: "Add Task Error", description: `Could not process "${newTaskData.title}".`, variant: "destructive", className: "font-pixel pixel-corners" });
      showPixelPalMessage(`Hmm, cloud save for "${newTaskData.title}" hiccuped. Try again?`, 'info');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleComplete = async (taskId: string, isCompletedParam: boolean) => {
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask || !userProfile) {
      showPixelPalMessage("Huh, that quest seems to have vanished. Or maybe it's just shy?", 'info');
      return;
    }

    setLastCompletedTaskElement(document.getElementById(`task-${taskId}`));

    const taskTitleForMessage = originalTask.title;
    const completedTaskXp = originalTask.xp ?? XP_PER_TASK;

    if (originalTask.timerId && isCompletedParam) {
      clearTimeout(originalTask.timerId);
    }
    
    const taskUpdateData: Partial<Task> = {
      isCompleted: isCompletedParam,
      isStarted: isCompletedParam ? false : originalTask.isStarted, 
      startTime: isCompletedParam ? undefined : originalTask.startTime, 
    };

    let profileUpdateData: Partial<UserProfile> | null = null;
    let leveledUp = false;
    let newLevelForMessage = userProfile.level;
    let creditsGainedOnLevelUp = 0;

    if (isCompletedParam) {
      const newXP = userProfile.xp + completedTaskXp;
      let newLevel = userProfile.level;
      
      // Ensure palCredits is a number before arithmetic
      let currentPalCredits = typeof userProfile.palCredits === 'number' ? userProfile.palCredits : INITIAL_PAL_CREDITS;
      let newPalCredits = currentPalCredits;
      
      const unlockedCosmetics = [...userProfile.unlockedCosmetics];

      while (newLevel < MAX_LEVEL && newXP >= LEVEL_THRESHOLDS[newLevel]) {
        newLevel++;
        leveledUp = true;
        newPalCredits += CREDITS_PER_LEVEL_UP;
        creditsGainedOnLevelUp += CREDITS_PER_LEVEL_UP;
        const nextHat = HATS.find(h => !unlockedCosmetics.includes(h.id));
        if(nextHat) unlockedCosmetics.push(nextHat.id);
        const nextAccessory = ACCESSORIES.find(a => !unlockedCosmetics.includes(a.id));
        if(nextAccessory) unlockedCosmetics.push(nextAccessory.id);
        const nextColor = PAL_COLORS.find(c => !unlockedCosmetics.includes(c.id));
        if(nextColor) unlockedCosmetics.push(nextColor.id);
      }
      newLevelForMessage = newLevel;
      profileUpdateData = { xp: newXP, level: newLevel, palCredits: newPalCredits, unlockedCosmetics };
      setShowCompletionAnimation(true);
    }
    
    const dbSuccess = await updateTaskInDB(SIMULATED_USER_ID, taskId, taskUpdateData);

    if (dbSuccess) {
      if (isCompletedParam) {
        let messageText = `Woohoo! "${taskTitleForMessage}" conquered! +${completedTaskXp} XP! You're on a roll!`;
        let messageType: PixelPalMessage['type'] = 'encouragement';

        const wasActive = originalTask.isStarted === true;

        if (wasActive && originalTask.startTime && typeof originalTask.duration === 'number') {
          const elapsedTimeMs = Date.now() - originalTask.startTime;
          const totalDurationMs = originalTask.duration * 60 * 1000;
          if (elapsedTimeMs < totalDurationMs * 0.25 && originalTask.timerId !== undefined) { 
            messageText = `"${taskTitleForMessage}", huh? Finished *real* quick. Did you just... blink? 😉 (+${completedTaskXp} XP, I guess!)`;
            messageType = 'info';
          } else if (originalTask.timerId !== undefined) { 
            messageText = `Quest "${taskTitleForMessage}" timer skipped! Strategic. +${completedTaskXp} XP!`;
          } else if (originalTask.timerId === undefined) { 
            messageText = `Beep boop! Timer for "${taskTitleForMessage}" is UP! Quest auto-completed! +${completedTaskXp} XP! Nice one!`;
          }
        }
        showPixelPalMessage(messageText, messageType);
        
        if (profileUpdateData) {
          await updateUserProfileData(SIMULATED_USER_ID, profileUpdateData);
        }

        if (leveledUp) {
          toast({
            title: "LEVEL UP!",
            description: `Whoa! You blasted to Level ${newLevelForMessage}! Gained ${creditsGainedOnLevelUp} Pal Credit(s)! New cosmetics might be shining for you!`,
            className: "font-pixel pixel-corners border-2 border-primary shadow-[2px_2px_0px_hsl(var(--primary))]",
          });
          setTimeout(() => { 
             showPixelPalMessage(`LEVEL ${newLevelForMessage}! You're basically a legend now. +${creditsGainedOnLevelUp} Pal Credit(s)! Check for new styles!`, 'encouragement');
          }, 200);
        }
      } else {
         showPixelPalMessage(`Quest "${taskTitleForMessage}" is back on the list. No worries!`, 'info');
      }
    } else {
      showPixelPalMessage(`Cloud sync for "${taskTitleForMessage}" went sideways. Changes might not stick.`, 'info');
      toast({ title: "Sync Error", description: `Could not update "${taskTitleForMessage}" in Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
    }
  };

  const handleEditTask = (taskToEdit: Task) => {
    if (taskToEdit.isStarted) {
        toast({ title: "Active Quest", description: "Cannot edit a quest while its timer is running. Too intense!", className: "font-pixel pixel-corners"});
        showPixelPalMessage(`Whoa there! Can't edit "${taskToEdit.title}" while it's an active quest. Finish or cancel it first!`, 'info');
        return;
    }
    setEditingTask(taskToEdit);
  };

  const handleSaveTask = async (updatedTaskData: Task) => {
    setIsSavingTask(true);
    try {
        let finalTask = { ...updatedTaskData };
        const originalTask = tasks.find(t => t.id === updatedTaskData.id);

        if (originalTask && (originalTask.title !== updatedTaskData.title || originalTask.duration !== updatedTaskData.duration)) {
            showPixelPalMessage(`Recalculating XP for "${updatedTaskData.title}"... one sec!`, 'info');
            const xpInput: CalculateTaskXpInput = {
            taskTitle: updatedTaskData.title,
            taskDuration: updatedTaskData.duration,
            };
            const xpResult: CalculateTaskXpOutput = await calculateTaskXpFlow(xpInput);
            finalTask.xp = xpResult.xp;
            showPixelPalMessage(`XP for "${updatedTaskData.title}" recalibrated to ${xpResult.xp} XP! All official.`, 'info');
        }

        const { timerId, ...taskToSave } = finalTask; // Ensure timerId is not directly saved
        const success = await updateTaskInDB(SIMULATED_USER_ID, taskToSave.id, taskToSave);
        if (success) {
            showPixelPalMessage(`Quest "${finalTask.title}" updated in the cloud. Looking sharp!`, 'info');
            setEditingTask(null); 
        } else {
            throw new Error("DB Update Failed");
        }
    } catch (error) {
        console.error("Error saving task or recalculating XP:", error);
        const originalTask = tasks.find(t => t.id === updatedTaskData.id);
        // Revert to original XP if AI calculation was part of the failure, or keep current if DB update failed
        updatedTaskData.xp = originalTask?.xp ?? XP_PER_TASK; 
        toast({
            title: "Save Error",
            description: `Could not save changes for "${updatedTaskData.title}".`,
            variant: "destructive",
            className: "font-pixel pixel-corners",
        });
        showPixelPalMessage(`Cloud save for "${updatedTaskData.title}" edits failed. Changes might be local only.`, 'info');
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
        showPixelPalMessage(`Quest "${taskToDelete.title}" zapped from the records! Poof!`, 'info');
        toast({ title: "Quest Deleted", description: `"${taskToDelete.title}" has been removed.`, className: "font-pixel pixel-corners" });
      } catch (error) {
        console.error("Error deleting task from DB:", error);
        toast({ title: "Delete Error", description: `Could not delete "${taskToDelete.title}" from Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
        showPixelPalMessage(`Couldn't make "${taskToDelete.title}" vanish from the cloud. It's gone locally, though.`, 'info');
      }
    }
  };
  
  const handleUpdateCosmetics = async (newCosmetics: UserProfile['pixelSpriteCosmetics']) => {
    if (userProfile) {
      const success = await updateUserProfileData(SIMULATED_USER_ID, { pixelSpriteCosmetics: newCosmetics });
      if (success) {
        showPixelPalMessage(`Ooh, look at you! That new style is 🔥! Pal is looking fresh.`, 'info');
      } else {
        showPixelPalMessage("Tried to update your Pal's look in the cloud, but it didn't stick. Style is local for now!", 'info');
        toast({ title: "Cosmetic Sync Error", description: "Could not save cosmetic changes to Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
      }
    }
  };

  const askPalAction = async () => { 
    if (!userProfile) {
      showPixelPalMessage("My circuits are offline! Can't access your profile to use credits.", 'info');
      return;
    }
    
    // Ensure palCredits is a number before comparison and arithmetic
    const currentPalCredits = typeof userProfile.palCredits === 'number' ? userProfile.palCredits : 0;

    if (currentPalCredits < ASK_PAL_COST) {
      showPixelPalMessage(`Whoops! You need ${ASK_PAL_COST} Pal Credit(s) to ask me something. Level up or complete tough quests!`, 'info');
      toast({ title: "Not Enough Pal Credits!", description: "Complete more quests or level up to earn credits.", className: "font-pixel pixel-corners" });
      return;
    }

    setIsLoadingAskPal(true);
    showPixelPalMessage("Alright, spending 1 Pal Credit... Let's see what wisdom I can share!", 'info');

    // Deduct credit first
    const newCredits = currentPalCredits - ASK_PAL_COST;
    const creditUpdateSuccess = await updateUserProfileData(SIMULATED_USER_ID, { palCredits: newCredits });

    if (!creditUpdateSuccess) {
      showPixelPalMessage("Hmm, my circuits hiccuped trying to use your credit. Try again in a bit?", 'info');
      toast({ title: "Credit Error", description: "Could not use Pal Credit. Please try again.", variant: "destructive", className: "font-pixel pixel-corners" });
      setIsLoadingAskPal(false);
      return;
    }
    // UserProfile state will update via onSnapshot, reflecting the deducted credit.

    try {
      // For now, still suggests tasks. This will be replaced by a new, more general AI flow later.
      const result: SuggestTasksOutput = await suggestTasksFlow({}); 
      setAiSuggestions(result.suggestedTasks);
      if (result.suggestedTasks.length > 0) {
        setShowAiSuggestionsModal(true);
        showPixelPalMessage("Aha! My AI brainwaves conjured up these quest ideas for you!", 'suggestion');
      } else {
        showPixelPalMessage("My suggestion circuits are a bit quiet today. You've got everything covered, or I'm just drawing a blank!", 'info');
         toast({
            title: "No Suggestions",
            description: "Pixel Pal couldn't find any new task suggestions right now.",
            className: "font-pixel pixel-corners",
          });
      }
    } catch (error) {
      console.error("Error asking Pal (fetching suggestions):", error);
      showPixelPalMessage("My AI brain just short-circuited! Maybe ask again when I've had my oil changed?", 'info');
      toast({
        title: "AI Error",
        description: "Could not fetch insights from Pixel Pal.",
        variant: "destructive",
        className: "font-pixel pixel-corners",
      });
      // Note: No automatic credit refund on AI error for simplicity in this step.
      // This could be added later if desired, but would require careful state management.
    } finally {
      setIsLoadingAskPal(false);
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
        // No need to setTasks here, handleToggleComplete will trigger snapshot update
        handleToggleComplete(taskId, true); 
      }, timerDurationMs) as unknown as number;

      // Optimistically update local state for immediate UI feedback
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, isStarted: true, startTime: Date.now(), timerId: newTimerId } 
          : t
      ));
      
      const success = await updateTaskInDB(SIMULATED_USER_ID, taskId, { isStarted: true, startTime: Date.now() });
      if (success) {
        showPixelPalMessage(`Timer started for "${taskToStart.title}"! Go get 'em, tiger!`, 'info');
      } else {
         setTasks(prevTasks => prevTasks.map(t => 
            t.id === taskId 
            ? { ...t, isStarted: false, startTime: undefined, timerId: undefined } 
            : t
        ));
        if (newTimerId) clearTimeout(newTimerId);
        showPixelPalMessage(`Failed to mark "${taskToStart.title}" as active in the cloud. Timer cancelled.`, 'info');
        toast({ title: "Sync Error", description: `Could not start timer for "${taskToStart.title}" in Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
      }
    }
  };

  const handleCancelQuest = async (taskId: string) => {
    const taskToCancel = tasks.find(t => t.id === taskId);
    if (taskToCancel && taskToCancel.timerId) {
      clearTimeout(taskToCancel.timerId);
      // Optimistically update local state
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId 
          ? { ...t, isStarted: false, timerId: undefined, startTime: undefined } 
          : t
      ));
      const success = await updateTaskInDB(SIMULATED_USER_ID, taskId, { isStarted: false, startTime: undefined });
      if (success) {
        showPixelPalMessage(`Quest "${taskToCancel.title}" timer paused. Taking a strategic break, eh?`, 'info');
      } else {
        // Revert local state if DB update fails - though onSnapshot might also correct this
        setTasks(prevTasks => prevTasks.map(t => 
            t.id === taskId && taskToCancel.startTime // Ensure original startTime existed
            ? { ...t, isStarted: true, timerId: taskToCancel.timerId, startTime: taskToCancel.startTime } 
            : t
        ));
        showPixelPalMessage(`Cloud didn't get the memo on cancelling "${taskToCancel.title}". Timer might still be "active" there.`, 'info');
      }
    }
  };

  const handleSkipQuest = (taskId: string) => {
    handleToggleComplete(taskId, true);
  };

  const checkDueTasksAndRemind = useCallback(() => {
    if (isLoadingProfile || isLoadingTasks || !tasks.length) return;

    const today = new Date().toISOString().split('T')[0];
    const tasksDueToday = tasks.filter(task => !task.isCompleted && task.dueDate === today);

    if (tasksDueToday.length > 0) {
      showPixelPalMessage(`Heads up, superstar! You've got ${tasksDueToday.length} quest${tasksDueToday.length > 1 ? 's' : ''} on the docket for today. Go shine!`, 'reminder');
    } else if (tasks.length > 0 && tasks.every(t => t.isCompleted || t.dueDate !== today || !t.dueDate)) {
      showPixelPalMessage("Today's quest log: squeaky clean! Or... you haven't added any for today. Either way, you're the boss!", 'info');
    }
  }, [tasks, isLoadingProfile, isLoadingTasks, showPixelPalMessage]);

  useEffect(() => {
    const reminderTimer = setTimeout(checkDueTasksAndRemind, 2000); 
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
          <PixelSprite userProfile={userProfile} message={currentPixelPalMessage} />
          <PixelPalLog messages={pixelPalMessageLog} />
          {userProfile && <CosmeticCustomizationPanel userProfile={userProfile} onUpdateCosmetics={handleUpdateCosmetics} />}
           <Button 
            onClick={askPalAction} 
            disabled={isLoadingAskPal || !userProfile || (typeof userProfile.palCredits === 'number' ? userProfile.palCredits : 0) < ASK_PAL_COST}
            className="w-full font-pixel btn-pixel flex items-center justify-center gap-2"
          >
            {isLoadingAskPal ? <Loader2 size={18} className="animate-spin" /> : <MessageCircleQuestion size={18} />}
            {isLoadingAskPal ? "Pal is thinking..." : `Ask your Pal (${(userProfile && typeof userProfile.palCredits === 'number') ? userProfile.palCredits : 0} Credits)`}
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
              Here are some quests my AI brain cooked up for you (cost 1 Pal Credit):
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
                showPixelPalMessage("All suggested quests added to your list. You're unstoppable!", 'info');
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

