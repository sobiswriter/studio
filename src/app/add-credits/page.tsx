
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';
import { onUserProfileSnapshot, updateUserProfileData } from '../../services/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { Coins, ArrowLeft, Loader2, Gift, Instagram, Linkedin, Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { QuestionnaireModal, type ButtonConfigType } from '@/components/core/QuestionnaireModal'; // New Import

export default function AddCreditsPage() {
  const { user, authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isAddingCredits, setIsAddingCredits] = useState(false); // For the actual credit addition
  const { toast } = useToast();
  const router = useRouter();

  // Questionnaire State
  const [isQuestionnaireModalOpen, setIsQuestionnaireModalOpen] = useState(false);
  const [currentQuestionStep, setCurrentQuestionStep] = useState(1);
  const [questionnaireMessage, setQuestionnaireMessage] = useState('');
  const [creditsToAward, setCreditsToAward] = useState(0);
  const [questionnaireButtonConfig, setQuestionnaireButtonConfig] = useState<ButtonConfigType>('none');
  const [tookStingyPath, setTookStingyPath] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.uid) {
      setIsLoadingProfile(true);
      const unsub = onUserProfileSnapshot(user.uid, (profile) => {
        setUserProfile(profile);
        setIsLoadingProfile(false);
      }, (error) => {
        console.error("Error fetching profile:", error);
        toast({ title: "Error", description: "Could not load your profile.", variant: "destructive", className: "font-pixel pixel-corners" });
        setIsLoadingProfile(false);
      });
      return () => unsub();
    } else if (!authLoading && !user) {
        setIsLoadingProfile(false);
    }
  }, [user?.uid, authLoading, user, toast]);

  const actuallyAddCredits = async (amount: number) => {
    if (!user?.uid || !userProfile) {
      toast({ title: "Error", description: "User profile not loaded for credit addition.", variant: "destructive", className: "font-pixel pixel-corners" });
      return;
    }
    setIsAddingCredits(true);
    const currentCredits = userProfile.palCredits || 0;
    const newCredits = currentCredits + amount;
    try {
      const success = await updateUserProfileData(user.uid, { palCredits: newCredits });
      if (success) {
        // User profile will update via onSnapshot listener
      } else {
        throw new Error("Failed to update credits in Firestore.");
      }
    } catch (error) {
      console.error("Error adding credits:", error);
      toast({ title: "Credit Add Failed", description: "Could not add credits. Please try again.", variant: "destructive", className: "font-pixel pixel-corners" });
    } finally {
      setIsAddingCredits(false);
    }
  };

  const startQuestionnaire = (amount: number) => {
    setCreditsToAward(amount);
    setCurrentQuestionStep(1);
    setQuestionnaireMessage("Hmm, so you ran out of Credits huh.... O_O");
    setQuestionnaireButtonConfig('yesNo');
    setTookStingyPath(false);
    setIsQuestionnaireModalOpen(true);
  };

  const handleQuestionnaireAction = (action: 'yes' | 'no' | 'continue' | 'okay') => {
    switch (currentQuestionStep) {
      case 1: // "Hmm, so you ran out of Credits huh.... O_O"
        if (action === 'yes') {
          setCurrentQuestionStep(2);
          setQuestionnaireMessage("And I Presume you don't want to work to get credits?");
          setQuestionnaireButtonConfig('yesNo');
        } else { // No
          setIsQuestionnaireModalOpen(false);
          toast({ title: "Fair Enough!", description: "Pixel Pal says: Alright, suit yourself! More quests, more glory!", className: "font-pixel pixel-corners" });
        }
        break;
      case 2: // "And I Presume you don't want to work to get credits?"
        if (action === 'yes') {
          setCurrentQuestionStep(3);
          setQuestionnaireMessage("I see... I see... Well what if I say you'd have to Pay $1 for every credit ^_^");
          setQuestionnaireButtonConfig('yesNo');
        } else { // No
          setIsQuestionnaireModalOpen(false);
          toast({ title: "Great Spirit!", description: "Pixel Pal says: Attaboy/Attagirl! That's the spirit! Go earn those credits the hard way!", className: "font-pixel pixel-corners" });
        }
        break;
      case 3: // "Well what if I say you'd have to Pay $1 for every credit ^_^"
        if (action === 'yes') { // Modest Path
          setQuestionnaireMessage("You're quite modest sir ^^, don't worry I won't charge you for this...");
          setQuestionnaireButtonConfig('okay');
          setCurrentQuestionStep(6); // Special step for modest path completion
        } else { // No - Stingy Path
          setTookStingyPath(true);
          setCurrentQuestionStep(4);
          setQuestionnaireMessage("Quite Stingy are you? No regards for the Developer at all huh, Isn't Sobi your friend?");
          setQuestionnaireButtonConfig('continue');
        }
        break;
      case 4: // Stingy Path - Statement 1
        if (action === 'continue') {
          setCurrentQuestionStep(5);
          setQuestionnaireMessage("Don't worry even if you would have chosen to pay I still wouldn't have accepted it, since at least I consider us friends... ^_^");
          setQuestionnaireButtonConfig('okay');
        }
        break;
      case 5: // Stingy Path - Statement 2 (Final step for stingy path)
        if (action === 'okay') {
          actuallyAddCredits(creditsToAward);
          setIsQuestionnaireModalOpen(false);
          toast({ title: "Credits Granted!", description: `Pixel Pal says: Here enjoy your ${creditsToAward} Credits! Still, if you like it, you can always buy Sobi a coffee >_<`, duration: 7000, className: "font-pixel pixel-corners" });
        }
        break;
      case 6: // Modest Path - Final step
         if (action === 'okay') {
          actuallyAddCredits(creditsToAward);
          setIsQuestionnaireModalOpen(false);
          toast({ title: "Credits Granted!", description: `Pixel Pal says: Here enjoy your ${creditsToAward} Credits! You earned 'em with your... modesty!`, duration: 7000, className: "font-pixel pixel-corners" });
        }
        break;
    }
  };


  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background font-pixel p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">{!user && !authLoading ? "Redirecting to login..." : "Loading Your Info..."}</p>
      </div>
    );
  }
  
  if (!user) {
     return (
      <div className="flex items-center justify-center min-h-screen bg-background font-pixel p-4">
        <p className="text-xl">Please log in to add credits.</p>
         <Link href="/login" legacyBehavior>
            <Button variant="link" className="font-pixel text-primary text-lg">Go to Login</Button>
         </Link>
      </div>
    );
  }

  if (isLoadingProfile && user) { 
     return (
      <div className="flex items-center justify-center min-h-screen bg-background font-pixel p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">Loading Your Profile...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 py-8 space-y-6 md:space-y-8 max-w-2xl font-pixel">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-pixel text-primary drop-shadow-[3px_3px_0px_hsl(var(--foreground))]">
          Add Pal Credits
        </h1>
        <p className="text-muted-foreground mt-2">Boost your Pal's power and unlock cool stuff!</p>
      </header>

      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Coins size={24} /> Your Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl text-primary">{userProfile?.palCredits ?? 'Loading...'} <span className="text-lg">Credits</span></p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[5, 10, 15].map((amount) => (
          <Card key={amount} className="pixel-corners border-2 border-foreground shadow-[3px_3px_0px_hsl(var(--foreground))] hover:shadow-[1px_1px_0px_hsl(var(--foreground))] transition-shadow duration-150 ease-in-out">
            <CardHeader>
              <CardTitle className="text-center text-2xl text-accent">{amount} Credits</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-4 h-20">Get {amount} shiny Pal Credits to interact with your Pal and unlock features!</p>
              <Button 
                onClick={() => startQuestionnaire(amount)} 
                className="w-full font-pixel btn-pixel"
                disabled={isLoadingProfile || !userProfile || isAddingCredits}
              >
                {isAddingCredits ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
                {isAddingCredits ? 'Processing...' : `Buy ${amount} Credits`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="font-pixel flex items-center gap-2"><Gift size={24} /> Buy Sobi a Coffee?</CardTitle>
          <CardDescription className="font-pixel text-muted-foreground">If you enjoy Pixel Due, consider supporting its development!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-pixel text-foreground">
            Your support helps Sobi keep improving Pixel Due and adding new features. Thank you for being awesome!
          </p>
          <div className="space-y-2">
            <p className="font-pixel text-sm text-muted-foreground">Connect with Sobi:</p>
            <div className="flex flex-wrap gap-4 items-center">
              <a href="https://www.instagram.com/sobi_is_a_writer" target="_blank" rel="noopener noreferrer" className="font-pixel text-primary hover:underline flex items-center gap-1">
                <Instagram size={16} /> @sobi_is_a_writer
              </a>
              <a href="https://www.linkedin.com/in/sobiswriter" target="_blank" rel="noopener noreferrer" className="font-pixel text-primary hover:underline flex items-center gap-1">
                <Linkedin size={16} /> sobiswriter
              </a>
              <a href="https://github.com/sobiswriter" target="_blank" rel="noopener noreferrer" className="font-pixel text-primary hover:underline flex items-center gap-1">
                <Github size={16} /> @sobiswriter
              </a>
            </div>
          </div>
          <div className="flex flex-col items-center space-y-2">
            <p className="font-pixel text-sm text-muted-foreground">Scan to support:</p>
            <Image 
              src="https://drive.google.com/uc?export=view&id=163Q78W8yXkctKrOggJQ5E5a5SWZ0o6Kc" 
              alt="Payment QR Code" 
              width={200} 
              height={200}
              className="pixel-corners border-2 border-muted"
              data-ai-hint="qr code"
            />
          </div>
        </CardContent>
      </Card>

      <CardFooter className="mt-8 flex justify-center">
        <Link href="/" legacyBehavior>
          <Button variant="outline" className="font-pixel btn-pixel">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quests
          </Button>
        </Link>
      </CardFooter>

      <QuestionnaireModal
        isOpen={isQuestionnaireModalOpen}
        onClose={() => {
            if (!isAddingCredits) setIsQuestionnaireModalOpen(false);
        }}
        message={questionnaireMessage}
        buttonConfig={questionnaireButtonConfig}
        onYes={() => handleQuestionnaireAction('yes')}
        onNo={() => handleQuestionnaireAction('no')}
        onContinue={() => handleQuestionnaireAction('continue')}
        onOkay={() => handleQuestionnaireAction('okay')}
        isProcessing={isAddingCredits}
      />
    </div>
  );
}
