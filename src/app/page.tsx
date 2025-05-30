
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Task, UserProfile, PixelPalMessage } from '@/types';
import { AddTaskForm, type AddTaskFormValues } from '@/components/core/AddTaskForm';
import { TaskList } from '@/components/core/TaskList';
import { ActiveQuestItem } from '@/components/core/ActiveQuestItem';
import { PixelSprite } from '@/components/core/PixelSprite';
import { UserProfileCard } from '@/components/core/UserProfileCard';
import { EditTaskModal } from '@/components/core/EditTaskModal';
import { AskPalModal } from '@/components/core/AskPalModal';
import { DailyBountyList } from '@/components/core/DailyBountyList';
import { PalSettingsPanel } from '@/components/core/PalSettingsPanel';
import { AnimatedCompletion } from '@/components/core/AnimatedCompletion';
import { PixelPalLog } from '@/components/core/PixelPalLog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/hooks/use-toast";
import { calculateTaskXp as calculateTaskXpFlow, type CalculateTaskXpInput, type CalculateTaskXpOutput } from '@/ai/flows/calculate-task-xp';
import { getPalSarcasticComment as getPalSarcasticCommentFlow, type PalSarcasticCommentInput, type PalSarcasticCommentOutput } from '@/ai/flows/pal-sarcastic-comment-flow';
import { generateDailyBounties as generateDailyBountiesFlow, type GenerateDailyBountiesOutput } from '@/ai/flows/generate-daily-bounties';
import { generateQuestStatusComment as generateQuestStatusCommentFlow, type QuestStatusInput } from '@/ai/flows/generate-quest-status-comment';
import {
  LEVEL_THRESHOLDS, MAX_LEVEL,
  INITIAL_PAL_CREDITS, CREDITS_PER_LEVEL_UP, BONUS_CREDITS_PER_5_LEVELS,
  ASK_PAL_COST, BOUNTY_XP_REWARD, BOUNTY_CREDITS_REWARD, NUM_DAILY_BOUNTIES,
  DEFAULT_PERSONA_SETTINGS,
  TYPING_SPEED_MS, POST_TYPING_PAUSE_MS, INITIAL_AI_WELCOME_DELAY_MS
} from '@/lib/constants';
import { Award, Lightbulb, Zap, Loader2, CloudCog, MessageCircleQuestion, Sun, LogOut, PlusCircle, Info } from 'lucide-react';
import Link from 'next/link';

import {
  onUserProfileSnapshot,
  createUserProfileInDB,
  updateUserProfileData,
  onTasksSnapshot,
  addTaskToDB,
  updateTaskInDB,
  deleteTaskFromDB,
} from '../services/firestoreService'; // Changed to relative path
import type { Unsubscribe } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext'; // Changed to relative path
import { useRouter } from 'next/navigation';

const MAX_LOG_ENTRIES = 20;
const FIVE_MINUTES_MS = 5 * 60 * 1000;

export default function HomePage() {
  const { user, authLoading, logout } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [lastCompletedTaskElement, setLastCompletedTaskElement] = useState<HTMLElement | null>(null);

  const [currentPixelPalMessage, setCurrentPixelPalMessage] = useState<PixelPalMessage | null>(null);
  const [pixelPalMessageLog, setPixelPalMessageLog] = useState<PixelPalMessage[]>([]);
  
  const [messageQueue, setMessageQueue] = useState<PixelPalMessage[]>([]);
  const [isPalDisplaySlotActive, setIsPalDisplaySlotActive] = useState(false);
  const displayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [isAskPalModalOpen, setIsAskPalModalOpen] = useState(false);
  const [isLoadingAskPal, setIsLoadingAskPal] = useState(false);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isGeneratingBounties, setIsGeneratingBounties] = useState(false);
  const [isGeneratingStatusComment, setIsGeneratingStatusComment] = useState(false);
  const [initialAiWelcomeFired, setInitialAiWelcomeFired] = useState(false);


  const { toast } = useToast();

  const showPixelPalMessage = useCallback((text: string, type: PixelPalMessage['type']) => {
    const newMessage: PixelPalMessage = { text: text || "...", type, timestamp: Date.now() }; // Ensure text is non-empty

    setPixelPalMessageLog(prevLog => {
      const updatedLog = [newMessage, ...prevLog];
      return updatedLog.length > MAX_LOG_ENTRIES ? updatedLog.slice(0, MAX_LOG_ENTRIES) : updatedLog;
    });
    setMessageQueue(prevQueue => [...prevQueue, newMessage]);
  }, []);


  useEffect(() => {
    if (!isPalDisplaySlotActive && messageQueue.length > 0) {
      const nextMessageToShow = messageQueue[0];
      setCurrentPixelPalMessage(nextMessageToShow);
      setIsPalDisplaySlotActive(true);

      const currentTypingSpeed = Number(TYPING_SPEED_MS);
      const currentPostPause = Number(POST_TYPING_PAUSE_MS);

      let displayDuration;
      if (nextMessageToShow.text && typeof nextMessageToShow.text === 'string' && currentTypingSpeed > 0 && currentPostPause >= 0) {
          displayDuration = (nextMessageToShow.text.length * currentTypingSpeed) + currentPostPause;
      } else {
          displayDuration = currentPostPause > 0 ? currentPostPause : 2000;
          console.warn("PixelPal: Using fallback display duration for message:", nextMessageToShow);
      }

      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
      }

      displayTimeoutRef.current = setTimeout(() => {
        setMessageQueue(prevQueue => prevQueue.slice(1));
        setIsPalDisplaySlotActive(false);
      }, displayDuration);
    }

    return () => {
      if (displayTimeoutRef.current) {
        clearTimeout(displayTimeoutRef.current);
      }
    };
  }, [messageQueue, isPalDisplaySlotActive]);


  const getTodayString = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);


  const handleGenerateDailyBounties = useCallback(async () => {
    if (!user?.uid || !userProfile || isGeneratingBounties) return;

    const todayStr = getTodayString();
    if (userProfile.lastBountiesGeneratedDate === todayStr) {
      showPixelPalMessage("Today's bounties are already set, hero!", 'info');
      return;
    }

    setIsGeneratingBounties(true);
    showPixelPalMessage("Pixel Pal is brewing up some fresh daily bounties... Hang tight!", 'info');
    try {
      const aiResult: GenerateDailyBountiesOutput = await generateDailyBountiesFlow({});

      if (!aiResult || !aiResult.bounties || aiResult.bounties.length === 0) {
        showPixelPalMessage("Pal's bounty generator seems to be on a coffee break. Try again in a bit!", 'info');
        setIsGeneratingBounties(false);
        return;
      }

      const bountyPromises = aiResult.bounties.slice(0, NUM_DAILY_BOUNTIES).map(bountyDef => {
        const newBounty: Omit<Task, 'id'> = {
          title: bountyDef.title,
          duration: bountyDef.duration,
          isCompleted: false,
          createdAt: Date.now(),
          isBounty: true,
          xp: BOUNTY_XP_REWARD,
          bountyPalCredits: BOUNTY_CREDITS_REWARD,
          bountyGenerationDate: todayStr,
          isStarted: false,
        };
        return addTaskToDB(user.uid, newBounty);
      });

      await Promise.all(bountyPromises);

      await updateUserProfileData(user.uid, { lastBountiesGeneratedDate: todayStr });
      showPixelPalMessage(`Alright! ${NUM_DAILY_BOUNTIES} new Daily Bounties are up on the board. Go get 'em for sweet XP and Pal Credits!`, 'suggestion');

    } catch (error) {
      console.error("Error generating daily bounties:", error);
      toast({ title: "Bounty Error", description: "Could not generate daily bounties.", variant: "destructive", className: "font-pixel pixel-corners" });
      showPixelPalMessage("Yikes! The bounty board fell over. Couldn't summon new bounties.", 'info');
    } finally {
      setIsGeneratingBounties(false);
    }
  }, [user?.uid, userProfile, isGeneratingBounties, showPixelPalMessage, toast]);


  useEffect(() => {
    if (!user?.uid) {
        setIsLoadingProfile(false);
        setIsLoadingTasks(false);
        return;
    }

    setIsLoadingProfile(true);
    setIsLoadingTasks(true);

    const unsubProfile = onUserProfileSnapshot(user.uid, (profileData) => {
      if (profileData) {
        setUserProfile(profileData);
      } else if(user) { 
        const initialCredits = Number(INITIAL_PAL_CREDITS) || 0;
                                
        const initialProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Pixel Hero',
          email: user.email || undefined,
          xp: 0,
          level: 1,
          palCredits: initialCredits,
          palColorId: PAL_COLORS.find(c => c.id === 'default')?.id || PAL_COLORS[0]?.id || 'default',
          palPersona: DEFAULT_PERSONA_SETTINGS,
          unlockedCosmetics: INITIAL_UNLOCKED_COSMETICS,
          lastBountiesGeneratedDate: '',
        };
        createUserProfileInDB(user.uid, initialProfile).then(() => {
          setUserProfile(initialProfile);
        }).catch(err => {
          console.error("Failed to create profile in DB:", err);
          showPixelPalMessage("Hmm, couldn't save your new profile to the cloud. We'll try again later. Don't worry, your legend begins now!", 'info');
        });
      }
      setIsLoadingProfile(false);
    }, (error) => {
      console.error("Error fetching user profile:", error);
      toast({ title: "Profile Error", description: "Could not load user profile from Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
      setIsLoadingProfile(false);
      showPixelPalMessage("Yikes! Trouble loading your hero stats from the cloud. Check your connection?", 'info');
    });

    const unsubTasks = onTasksSnapshot(user.uid, (fetchedTasks) => {
      const loadedTasks = fetchedTasks.map(task => ({
        ...task,
        isStarted: task.isStarted ?? false,
        startTime: task.startTime,
        timerId: undefined, 
        xp: task.isBounty ? BOUNTY_XP_REWARD : (task.xp ?? 10), // Default XP if not set
        bountyPalCredits: task.isBounty ? BOUNTY_CREDITS_REWARD : undefined,
      }));
      setTasks(loadedTasks);
      setIsLoadingTasks(false);
    }, (error) => {
      console.error("Error fetching tasks:", error);
      toast({ title: "Tasks Error", description: "Could not load tasks from Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
      setIsLoadingTasks(false);
      showPixelPalMessage("Error summoning your quests from the Firebase ether! Maybe they're on a side-quest?", 'info');
    });

    return () => {
      unsubProfile();
      unsubTasks();
      tasks.forEach(task => { 
        if (task.timerId) clearTimeout(task.timerId);
      });
       if (displayTimeoutRef.current) { // Clear display timeout on unmount
        clearTimeout(displayTimeoutRef.current);
      }
    };
  }, [user?.uid, toast, showPixelPalMessage]);

  useEffect(() => {
    if (user?.uid && userProfile && !isLoadingProfile && !isGeneratingBounties) {
      const todayStr = getTodayString();
      if (userProfile.lastBountiesGeneratedDate !== todayStr) {
        handleGenerateDailyBounties();
      }
    }
  }, [user?.uid, userProfile, isLoadingProfile, isGeneratingBounties, handleGenerateDailyBounties]);

  const handleAddTask = async (newTaskData: AddTaskFormValues) => {
    if (!user?.uid) return;

    if (!newTaskData.title || newTaskData.duration === undefined || newTaskData.duration <=0 || !newTaskData.dueDate) {
      toast({
        title: "Missing Info!",
        description: "Quest Title, a positive Duration, and Due Date are all required, champ!",
        variant: "destructive",
        className: "font-pixel pixel-corners",
      });
      showPixelPalMessage("Whoa there, make sure to fill in all the quest details before adding! Duration must be positive too.", 'info');
      return;
    }
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
        title: newTaskData.title,
        duration: newTaskData.duration,
        dueDate: newTaskData.dueDate,
        isCompleted: false,
        createdAt: Date.now(),
        isStarted: false,
        xp: taskXp,
        isBounty: false,
      };

      const addedTask = await addTaskToDB(user.uid, newTask);
      if (addedTask) {
        showPixelPalMessage(`Alright, quest "${newTask.title}" locked and loaded in the cloud! Go get 'em!`, 'info');
      } else {
        throw new Error("Task not added to DB or failed to retrieve after adding.");
      }
    } catch (error) {
      console.error("Error during task addition or XP calculation:", error);
      toast({ title: "Add Task Error", description: `Could not process "${newTaskData.title}". Try again.`, variant: "destructive", className: "font-pixel pixel-corners" });
      showPixelPalMessage(`Hmm, cloud save for "${newTaskData.title}" hiccuped. Try again?`, 'info');
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleToggleComplete = async (taskId: string, isCompletedParam: boolean) => {
    if (!user?.uid || !userProfile) {
      showPixelPalMessage("Can't update quests without knowing who the hero is! Profile missing.", 'info');
      return;
    }
    const originalTask = tasks.find(t => t.id === taskId);
    if (!originalTask) {
      showPixelPalMessage("Huh, that quest seems to have vanished. Or maybe it's just shy?", 'info');
      return;
    }

    setLastCompletedTaskElement(document.getElementById(`task-${taskId}`));

    const taskTitleForMessage = originalTask.title;
    const completedTaskXp = originalTask.xp ?? 10; // Default XP if not set
    const completedBountyCredits = originalTask.isBounty ? (originalTask.bountyPalCredits ?? BOUNTY_CREDITS_REWARD) : 0;


    if (originalTask.timerId && isCompletedParam) {
      clearTimeout(originalTask.timerId);
    }

    const taskUpdateData: Partial<Task> = {
      isCompleted: isCompletedParam,
      isStarted: isCompletedParam ? false : originalTask.isStarted, 
      startTime: isCompletedParam ? undefined : originalTask.startTime, 
      timerId: undefined, 
    };

    let profileUpdateData: Partial<UserProfile> | null = null;
    let leveledUp = false;
    let newLevelForMessage = userProfile.level;

    let currentPalCredits = Number(userProfile.palCredits) || Number(INITIAL_PAL_CREDITS) || 0;


    let creditsGainedOnLevelUp = 0;
    let bonusCreditsEarned = 0;

    if (isCompletedParam) {
      const currentSafeXP = userProfile.xp ?? 0;
      const newXP = currentSafeXP + completedTaskXp;
      let newLevel = userProfile.level;
      let newPalCredits = currentPalCredits + completedBountyCredits; 

      const unlockedCosmetics = [...(userProfile.unlockedCosmetics || INITIAL_UNLOCKED_COSMETICS)];

      while (newLevel < MAX_LEVEL && newXP >= LEVEL_THRESHOLDS[newLevel]) {
        newLevel++;
        leveledUp = true;
        const levelUpCreditGain = CREDITS_PER_LEVEL_UP;
        newPalCredits += levelUpCreditGain;
        creditsGainedOnLevelUp += levelUpCreditGain;

        if (newLevel % 5 === 0) {
          newPalCredits += BONUS_CREDITS_PER_5_LEVELS;
          bonusCreditsEarned += BONUS_CREDITS_PER_5_LEVELS;
        }
      }
      newLevelForMessage = newLevel;
      profileUpdateData = { xp: newXP, level: newLevel, palCredits: newPalCredits, unlockedCosmetics };
      setShowCompletionAnimation(true);
    }

    const dbSuccess = await updateTaskInDB(user.uid, taskId, taskUpdateData);

    if (dbSuccess) {
      if (isCompletedParam) {
        let messageText = originalTask.isBounty
          ? `Bounty "${taskTitleForMessage}" crushed! +${completedTaskXp} XP & +${completedBountyCredits} Pal Credits! Epic!`
          : `Woohoo! "${taskTitleForMessage}" conquered! +${completedTaskXp} XP! You're on a roll!`;
        let messageType: PixelPalMessage['type'] = 'encouragement';

        const wasActive = originalTask.isStarted === true;

        if (wasActive && originalTask.startTime && typeof originalTask.duration === 'number') {
          const elapsedTimeMs = Date.now() - originalTask.startTime;
          const totalDurationMs = originalTask.duration * 60 * 1000;
          if (elapsedTimeMs < totalDurationMs * 0.25 && originalTask.timerId !== undefined && !originalTask.isBounty) {
            messageText = `"${taskTitleForMessage}", huh? Finished *real* quick. Did you just... blink? 😉 (+${completedTaskXp} XP, I guess!)`;
            messageType = 'info';
          } else if (originalTask.timerId !== undefined && !originalTask.isBounty) { 
             messageText = `Quest "${taskTitleForMessage}" timer skipped! Strategic. +${completedTaskXp} XP!`;
          } else if (originalTask.timerId === undefined && !originalTask.isBounty) { 
             messageText = `Beep boop! Timer for "${taskTitleForMessage}" is UP! Quest auto-completed! +${completedTaskXp} XP! Nice one!`;
          }
        } else if (originalTask.isBounty && originalTask.timerId === undefined && wasActive) { 
             messageText = `Beep boop! Timer for Bounty "${taskTitleForMessage}" is UP! Bounty auto-completed! +${completedTaskXp} XP & +${completedBountyCredits} Pal Credits! Awesome!`;
        }
        showPixelPalMessage(messageText, messageType);

        if (profileUpdateData) {
          await updateUserProfileData(user.uid, profileUpdateData);
        }

        if (leveledUp) {
          let levelUpMessage = `Whoa! You blasted to Level ${newLevelForMessage}! Gained ${creditsGainedOnLevelUp} Pal Credit(s)!`;
          if (bonusCreditsEarned > 0) {
            levelUpMessage += ` Plus a BONUS of ${bonusCreditsEarned} credits for hitting a milestone! Total: ${creditsGainedOnLevelUp + bonusCreditsEarned} new credits!`;
          }
          toast({
            title: "LEVEL UP!",
            description: levelUpMessage,
            className: "font-pixel pixel-corners border-2 border-primary shadow-[2px_2px_0px_hsl(var(--primary))]",
          });
          setTimeout(() => {
            showPixelPalMessage(`LEVEL ${newLevelForMessage}! You're basically a legend now. Gained ${creditsGainedOnLevelUp + bonusCreditsEarned} Pal Credit(s)!`, 'encouragement');
          }, 200);
        }
      } else {
         showPixelPalMessage(`${originalTask.isBounty ? 'Bounty' : 'Quest'} "${taskTitleForMessage}" is back on the list. No worries!`, 'info');
      }
    } else {
      showPixelPalMessage(`Cloud sync for "${taskTitleForMessage}" went sideways. Changes might not stick.`, 'info');
      toast({ title: "Sync Error", description: `Could not update "${taskTitleForMessage}" in Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
    }
  };

  const handleEditTask = (taskToEdit: Task) => {
    if (taskToEdit.isBounty) {
        toast({ title: "Bounties Unchanged!", description: "Daily Bounties are sacred and cannot be edited, hero!", className: "font-pixel pixel-corners" });
        showPixelPalMessage("Hold up! Daily Bounties are fixed challenges from the Pal-verse. No edits allowed!", 'info');
        return;
    }
    if (taskToEdit.isStarted) {
      toast({ title: "Active Quest", description: "Cannot edit a quest while its timer is running. Too intense!", className: "font-pixel pixel-corners" });
      showPixelPalMessage(`Whoa there! Can't edit "${taskToEdit.title}" while it's an active quest. Finish or cancel it first!`, 'info');
      return;
    }
    setEditingTask(taskToEdit);
  };

  const handleSaveTask = async (updatedTaskData: Task) => {
    if (!user?.uid) return;

    if (!updatedTaskData.title || updatedTaskData.duration === undefined || updatedTaskData.duration <=0 || !updatedTaskData.dueDate) {
      toast({
        title: "Missing Info!",
        description: "Quest Title, a positive Duration, and Due Date are all required, champ!",
        variant: "destructive",
        className: "font-pixel pixel-corners",
      });
      showPixelPalMessage("Hold up! All quest details need to be filled in, even for edits, and duration must be positive.", 'info');
      return;
    }
    setIsSavingTask(true);
    try {
      let finalTask = { ...updatedTaskData };
      const originalTask = tasks.find(t => t.id === updatedTaskData.id);

      if (originalTask && (originalTask.title !== updatedTaskData.title || originalTask.duration !== updatedTaskData.duration) && !finalTask.isBounty) {
        showPixelPalMessage(`Recalculating XP for "${updatedTaskData.title}"... one sec!`, 'info');
        const xpInput: CalculateTaskXpInput = {
          taskTitle: updatedTaskData.title,
          taskDuration: updatedTaskData.duration,
        };
        const xpResult: CalculateTaskXpOutput = await calculateTaskXpFlow(xpInput);
        finalTask.xp = xpResult.xp;
        showPixelPalMessage(`XP for "${updatedTaskData.title}" recalibrated to ${xpResult.xp} XP! All official.`, 'info');
      }

      const { timerId, ...taskToSave } = finalTask; 
      const success = await updateTaskInDB(user.uid, taskToSave.id, taskToSave);
      if (success) {
        showPixelPalMessage(`Quest "${finalTask.title}" updated in the cloud. Looking sharp!`, 'info');
        setEditingTask(null);
      } else {
        throw new Error("DB Update Failed");
      }
    } catch (error) {
      console.error("Error saving task or recalculating XP:", error);
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
    if (!user?.uid) return;
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (taskToDelete) {
      if (taskToDelete.isBounty) {
        toast({ title: "No Deleting Bounties!", description: "Daily Bounties are fixed challenges, hero! They reset tomorrow.", className: "font-pixel pixel-corners" });
        showPixelPalMessage("Hey, those Daily Bounties are special! Can't delete 'em. They'll refresh tomorrow!", 'info');
        return;
      }
      if (taskToDelete.timerId) {
        clearTimeout(taskToDelete.timerId);
      }
      try {
        await deleteTaskFromDB(user.uid, taskId);
        showPixelPalMessage(`Quest "${taskToDelete.title}" zapped from the records! Poof!`, 'info');
        toast({ title: "Quest Deleted", description: `"${taskToDelete.title}" has been removed.`, className: "font-pixel pixel-corners" });
      } catch (error) {
        console.error("Error deleting task from DB:", error);
        toast({ title: "Delete Error", description: `Could not delete "${taskToDelete.title}" from Firebase.`, variant: "destructive", className: "font-pixel pixel-corners" });
        showPixelPalMessage(`Couldn't make "${taskToDelete.title}" vanish from the cloud. It's gone locally, though.`, 'info');
      }
    }
  };

  const handleUpdatePalSettings = async (
    newSettings: Partial<{ palColorId: string; palPersona: UserProfile['palPersona'] }>
  ) => {
    if (user?.uid && userProfile) {
      const currentSafeProfile = {
        ...userProfile,
        palColorId: userProfile.palColorId || PAL_COLORS.find(c => c.id === 'default')?.id || PAL_COLORS[0]?.id || 'default',
        palPersona: userProfile.palPersona || DEFAULT_PERSONA_SETTINGS,
      };

      const dataToUpdate: Partial<UserProfile> = {};
      let messageTypeSet = false;

      if (newSettings.palColorId && newSettings.palColorId !== currentSafeProfile.palColorId) {
        dataToUpdate.palColorId = newSettings.palColorId;
        const newColorName = PAL_COLORS.find(c => c.id === newSettings.palColorId)?.name || 'a new style';
        showPixelPalMessage(`Pal's rockin' ${newColorName}! Settings updated!`, 'info');
        messageTypeSet = true;
      }
      if (newSettings.palPersona) {
        dataToUpdate.palPersona = { ...(currentSafeProfile.palPersona || DEFAULT_PERSONA_SETTINGS), ...newSettings.palPersona };
         if (!messageTypeSet) { 
            showPixelPalMessage(`Pal's personality sliders tweaked! Let's see this new vibe...`, 'info');
         }
      }

      if (Object.keys(dataToUpdate).length > 0) {
        const success = await updateUserProfileData(user.uid, dataToUpdate);
        if (!success) {
          showPixelPalMessage("Tried to update your Pal's settings in the cloud, but it didn't stick. Changes might be local for now!", 'info');
          toast({ title: "Settings Sync Error", description: "Could not save Pal settings to Firebase.", variant: "destructive", className: "font-pixel pixel-corners" });
        }
      }
    }
  };

  const openAskPalModalHandler = () => {
    if (!user?.uid || !userProfile) {
      showPixelPalMessage("My circuits are offline! Can't access your profile to use credits.", 'info');
      return;
    }
    const currentPalCredits = (typeof userProfile.palCredits === 'number' && !isNaN(userProfile.palCredits)) ? userProfile.palCredits : 0;
    if (currentPalCredits < ASK_PAL_COST) {
      showPixelPalMessage(`Whoops! You need ${ASK_PAL_COST} Pal Credit(s) to ask me something. Level up or complete bounties!`, 'info');
      toast({ title: "Not Enough Pal Credits!", description: `Complete more quests or level up to earn credits. Cost: ${ASK_PAL_COST}`, className: "font-pixel pixel-corners" });
      return;
    }
    setIsAskPalModalOpen(true);
  };

  const handleAskPalQuery = async (userQuery: string) => {
    if (!user?.uid || !userProfile) {
      showPixelPalMessage("My circuits are offline! Can't access your profile to use credits.", 'info');
      setIsAskPalModalOpen(false);
      return;
    }
    let currentPalCredits = (typeof userProfile.palCredits === 'number' && !isNaN(userProfile.palCredits))
                            ? userProfile.palCredits
                            : 0; 
    if (currentPalCredits < ASK_PAL_COST) {
      showPixelPalMessage(`Not enough credits! You need ${ASK_PAL_COST}, but only have ${currentPalCredits}. Time to quest!`, 'info');
      toast({ title: "Not Enough Pal Credits!", description: `Cost: ${ASK_PAL_COST}, You have: ${currentPalCredits}`, className: "font-pixel pixel-corners" });
      setIsAskPalModalOpen(false);
      return;
    }

    setIsLoadingAskPal(true);
    showPixelPalMessage(`You asked: "${userQuery}"... Hmm, let me ponder that for a nanosecond!`, 'info');

    const newCredits = Math.max(0, currentPalCredits - ASK_PAL_COST);
    const creditUpdateSuccess = await updateUserProfileData(user.uid, { palCredits: newCredits });

    if (!creditUpdateSuccess) {
      showPixelPalMessage("Hmm, my circuits hiccuped trying to use your credit. Try again in a bit?", 'info');
      toast({ title: "Credit Error", description: "Could not use Pal Credit. Please try again.", variant: "destructive", className: "font-pixel pixel-corners" });
      setIsLoadingAskPal(false);
      return; 
    }

    try {
      const persona = userProfile.palPersona || DEFAULT_PERSONA_SETTINGS;
      const aiInput: PalSarcasticCommentInput = {
        userQuery,
        sarcasmLevel: persona.sarcasm,
        helpfulnessLevel: persona.helpfulness,
        chattinessLevel: persona.chattiness,
      };
      const result: PalSarcasticCommentOutput = await getPalSarcasticCommentFlow(aiInput);
      if (result.comment) {
        showPixelPalMessage(result.comment, 'askPalResponse');
      } else {
        showPixelPalMessage("My joke generator seems to be on vacation. Ask me later!", 'info');
      }
    } catch (error) {
      console.error("Error asking Pal (fetching sarcastic comment):", error);
      showPixelPalMessage("My AI brain just short-circuited! Maybe ask again when I've had my oil changed?", 'info');
      toast({
        title: "AI Error",
        description: "Could not get a comment from Pixel Pal.",
        variant: "destructive",
        className: "font-pixel pixel-corners",
      });
    } finally {
      setIsLoadingAskPal(false);
      setIsAskPalModalOpen(false); 
    }
  };


  const handleStartQuest = async (taskId: string) => {
    if (!user?.uid) return;
    const taskToStart = tasks.find(t => t.id === taskId);
    if (taskToStart && taskToStart.duration && !taskToStart.isCompleted && !taskToStart.isStarted) {
      const timerDurationMs = taskToStart.duration * 60 * 1000;

      const newTimerId = setTimeout(() => {
        handleToggleComplete(taskId, true); 
         setTasks(prevTasks => prevTasks.map(t =>
            t.id === taskId ? { ...t, timerId: undefined, isStarted: false, startTime: undefined, isCompleted: true } : t
        ));
      }, timerDurationMs) as unknown as number;

      setTasks(prevTasks => prevTasks.map(t =>
        t.id === taskId
          ? { ...t, isStarted: true, startTime: Date.now(), timerId: newTimerId }
          : t
      ));

      const success = await updateTaskInDB(user.uid, taskId, { isStarted: true, startTime: Date.now() });
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
    if (!user?.uid) return;
    const taskToCancel = tasks.find(t => t.id === taskId);
    if (taskToCancel && taskToCancel.timerId) {
      clearTimeout(taskToCancel.timerId);
      setTasks(prevTasks => prevTasks.map(t =>
        t.id === taskId
          ? { ...t, isStarted: false, timerId: undefined, startTime: undefined }
          : t
      ));
      const success = await updateTaskInDB(user.uid, taskId, { isStarted: false, startTime: undefined });
      if (success) {
        showPixelPalMessage(`Quest "${taskToCancel.title}" timer paused. Taking a strategic break, eh?`, 'info');
      } else {
        showPixelPalMessage(`Cloud didn't get the memo on cancelling "${taskToCancel.title}". Timer might still be "active" there.`, 'info');
      }
    }
  };

  const handleSkipQuest = (taskId: string) => {
    const taskToSkip = tasks.find(t => t.id === taskId);
     if (taskToSkip && taskToSkip.timerId) {
      clearTimeout(taskToSkip.timerId);
    }
    setTasks(prevTasks => prevTasks.map(t =>
        t.id === taskId ? { ...t, timerId: undefined, isStarted: false, startTime: undefined } : t
    ));
    handleToggleComplete(taskId, true); 
  };

 const checkDueTasksAndRemind = useCallback(async () => {
    if (!user?.uid || !userProfile || isLoadingProfile || isLoadingTasks || isGeneratingStatusComment) {
      return;
    }

    setIsGeneratingStatusComment(true);
    try {
      const today = getTodayString();
      const dueNonBountyTasks = tasks.filter(task => !task.isBounty && !task.isCompleted && task.dueDate === today);
      let statusInput: QuestStatusInput;

      if (dueNonBountyTasks.length > 0) {
        statusInput = {
          statusType: 'tasks_due',
          taskCountIfDue: dueNonBountyTasks.length,
        };
      } else {
        statusInput = {
          statusType: 'no_tasks_due_today',
          taskCountIfDue: 0,
        };
      }
      const aiResult = await generateQuestStatusCommentFlow(statusInput);
      showPixelPalMessage(aiResult.comment, statusInput.statusType === 'tasks_due' ? 'reminder' : 'info');
    } catch (error) {
      console.error("Error generating quest status comment:", error);
      const today = getTodayString();
      const dueNonBountyTasks = tasks.filter(task => !task.isBounty && !task.isCompleted && task.dueDate === today);
      if (dueNonBountyTasks.length > 0) {
        showPixelPalMessage(`Heads up, superstar! ${dueNonBountyTasks.length} regular quest(s) are lookin' for action today. You got this!`, 'reminder');
      } else {
        showPixelPalMessage("Today's regular quest log: squeaky clean! Either you're a legend or just enjoying the peace. Both valid!", 'info');
      }
    } finally {
      setIsGeneratingStatusComment(false);
    }
  }, [user?.uid, userProfile, tasks, isLoadingProfile, isLoadingTasks, isGeneratingStatusComment, showPixelPalMessage]);


  useEffect(() => {
    if (user?.uid && !isLoadingProfile && !isLoadingTasks && !initialAiWelcomeFired) {
      setInitialAiWelcomeFired(true); 
      const initialTimer = setTimeout(() => {
        if (!isGeneratingStatusComment) { 
            checkDueTasksAndRemind();
        }
      }, INITIAL_AI_WELCOME_DELAY_MS);

      return () => clearTimeout(initialTimer); 
    }
  }, [user?.uid, isLoadingProfile, isLoadingTasks, initialAiWelcomeFired, checkDueTasksAndRemind, isGeneratingStatusComment]);


  const savedCheckDueTasksAndRemindRef = useRef(checkDueTasksAndRemind);
  useEffect(() => {
    savedCheckDueTasksAndRemindRef.current = checkDueTasksAndRemind;
  }, [checkDueTasksAndRemind]);

  useEffect(() => {
    if (user?.uid && !isLoadingProfile && !isLoadingTasks) {
      const intervalId = setInterval(() => {
        savedCheckDueTasksAndRemindRef.current();
      }, FIVE_MINUTES_MS);
      return () => clearInterval(intervalId);
    }
  }, [user?.uid, isLoadingProfile, isLoadingTasks]);


  if (authLoading) {
    return (
      <div className="container mx-auto p-4 space-y-6 md:space-y-8 max-w-5xl flex flex-col items-center justify-center min-h-screen">
        <CloudCog size={64} className="animate-bounce text-primary mb-4" />
        <p className="font-pixel text-xl text-foreground">Authenticating...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 space-y-6 md:space-y-8 max-w-5xl flex flex-col items-center justify-center min-h-screen">
        <CloudCog size={64} className="text-primary mb-4" />
        <p className="font-pixel text-xl text-foreground">Redirecting to login...</p>
      </div>
    );
  }

  if (isLoadingProfile || isLoadingTasks) {
    return (
      <div className="container mx-auto p-4 space-y-6 md:space-y-8 max-w-5xl flex flex-col items-center justify-center min-h-screen">
        <CloudCog size={64} className="animate-bounce text-primary mb-4" />
        <p className="font-pixel text-xl text-foreground">Summoning Quests & Hero Stats...</p>
        <p className="font-pixel text-sm text-muted-foreground">Pixel Pal is connecting to the mothership...</p>
      </div>
    );
  }

  const todayString = getTodayString();
  const activeQuestsAndBounties = tasks.filter(task => task.isStarted && !task.isCompleted);
  const availableTasksForList = tasks.filter(task => !task.isBounty);

  const activeDailyBounties = tasks.filter(task => task.isBounty && task.bountyGenerationDate === todayString && !task.isCompleted && !task.isStarted);
  const completedDailyBounties = tasks.filter(task => task.isBounty && task.bountyGenerationDate === todayString && task.isCompleted);

  const handleLogout = async () => {
    showPixelPalMessage("Catch ya later, hero! Don't forget to come back and crush more quests!", 'info');
    setTimeout(async () => {
      await logout();
      router.push('/login'); 
    }, 500);
  };

  return (
    <div className="container mx-auto p-4 space-y-6 md:space-y-8 max-w-5xl">
      <header className="relative py-8 text-center">
        <div className="flex items-center justify-between px-4 md:hidden">
          {user ? (
            <Button
              onClick={handleLogout}
              variant="outline"
              size="icon"
              className="p-1.5 btn-pixel border-foreground"
              title="Logout"
            >
              <LogOut size={20} />
            </Button>
          ) : (
            <div className="w-8 h-8" /> 
          )}
          <h1 className="text-3xl font-pixel text-primary drop-shadow-[3px_3px_0px_hsl(var(--foreground))]">
            Pixel Due
          </h1>
          {user ? (
            <Link href="/add-credits" legacyBehavior>
              <Button
                variant="outline"
                size="icon"
                className="p-1.5 btn-pixel border-foreground"
                title="Add Pal Credits"
              >
                <PlusCircle size={20} />
              </Button>
            </Link>
          ) : (
            <div className="w-8 h-8" /> 
          )}
        </div>

        <h1 className="hidden md:block text-4xl lg:text-5xl font-pixel text-primary drop-shadow-[3px_3px_0px_hsl(var(--foreground))]">
          Pixel Due
        </h1>
        {user && (
          <>
            <div className="hidden md:block absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="font-pixel btn-pixel flex items-center gap-2"
                title="Logout"
              >
                <LogOut size={18} />
                Logout
              </Button>
            </div>
            <div className="hidden md:block absolute right-4 top-1/2 -translate-y-1/2 z-10">
              <Link href="/add-credits" legacyBehavior>
                <Button
                  variant="outline"
                  className="font-pixel btn-pixel flex items-center gap-2"
                  title="Add Pal Credits"
                >
                  <PlusCircle size={18} />
                  Add Credits
                </Button>
              </Link>
            </div>
          </>
        )}
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <section className="md:col-span-2 space-y-6">
          <AddTaskForm onAddTask={handleAddTask} isAdding={isAddingTask} />

          {activeQuestsAndBounties.length > 0 && (
            <Card className="pixel-corners border-2 border-primary shadow-[4px_4px_0px_hsl(var(--primary))]">
              <CardHeader>
                <CardTitle className="font-pixel flex items-center gap-2 text-primary"><Zap size={20} /> Active Challenges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activeQuestsAndBounties.map(task => (
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
          
          <DailyBountyList
            activeBounties={activeDailyBounties}
            completedBounties={completedDailyBounties}
            onStartQuest={handleStartQuest}
            onToggleComplete={handleToggleComplete}
            isLoading={isGeneratingBounties}
          />

          <div className="flex justify-center mt-6">
             <Link href="/about" legacyBehavior>
                <Button variant="outline" className="font-pixel btn-pixel flex items-center gap-2">
                  <Info size={18} /> Wanna know more about us
                </Button>
              </Link>
          </div>

        </section>

        <aside className="space-y-6">
          {userProfile && <UserProfileCard userProfile={userProfile} />}
          <PixelSprite 
            userProfile={userProfile} 
            message={currentPixelPalMessage}
            key={currentPixelPalMessage?.timestamp || 'pal-sprite'} 
          />
          <PixelPalLog messages={pixelPalMessageLog} />
          {userProfile && <PalSettingsPanel userProfile={userProfile} onUpdatePalSettings={handleUpdatePalSettings} />}
          <Button
            onClick={openAskPalModalHandler}
            disabled={!userProfile || (typeof userProfile.palCredits === 'number' ? userProfile.palCredits : 0) < ASK_PAL_COST || isLoadingAskPal}
            className="w-full font-pixel btn-pixel flex items-center justify-center gap-2"
          >
            <MessageCircleQuestion size={18} />
            Ask your Pal (Cost: {ASK_PAL_COST} - You have: {(userProfile && typeof userProfile.palCredits === 'number') ? userProfile.palCredits : 0})
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

      <AskPalModal
        isOpen={isAskPalModalOpen}
        onClose={() => setIsAskPalModalOpen(false)}
        onAskQuery={handleAskPalQuery}
        isAsking={isLoadingAskPal}
      />

      <AnimatedCompletion
        show={showCompletionAnimation}
        onAnimationEnd={() => setShowCompletionAnimation(false)}
        targetElement={lastCompletedTaskElement}
      />
    </div>
  );
}

    