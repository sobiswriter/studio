
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import type { UserProfile } from '../../types';
import { onUserProfileSnapshot, updateUserProfileData } from '../../services/firestoreService';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { Coins, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function AddCreditsPage() {
  const { user, authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<number | null>(null); // number is amount being purchased
  const { toast } = useToast();
  const router = useRouter();

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
    } else if (!authLoading && !user) { // Ensure if user is null after auth check, loading stops
        setIsLoadingProfile(false);
    }
  }, [user?.uid, authLoading, user, toast]);

  const handlePurchase = async (amount: number) => {
    if (!user?.uid || !userProfile) {
        toast({ title: "Error", description: "User profile not loaded.", variant: "destructive", className: "font-pixel pixel-corners" });
        return;
    }
    setIsPurchasing(amount);
    const currentCredits = userProfile.palCredits || 0;
    const newCredits = currentCredits + amount;
    try {
      const success = await updateUserProfileData(user.uid, { palCredits: newCredits });
      if (success) {
        toast({
          title: "Credits Added!",
          description: `You successfully added ${amount} Pal Credits. You now have ${newCredits}.`,
          className: "font-pixel pixel-corners"
        });
        // User profile will update via onSnapshot listener in this component
      } else {
        throw new Error("Failed to update credits in Firestore.");
      }
    } catch (error) {
      console.error("Error purchasing credits:", error);
      toast({ title: "Purchase Failed", description: "Could not add credits. Please try again.", variant: "destructive", className: "font-pixel pixel-corners" });
    } finally {
      setIsPurchasing(null);
    }
  };

  if (authLoading || (!user && !authLoading)) { // Show loading if auth state is processing or if redirecting
    return (
      <div className="flex items-center justify-center min-h-screen bg-background font-pixel p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-xl">{!user && !authLoading ? "Redirecting to login..." : "Loading Your Info..."}</p>
      </div>
    );
  }
  
  // This check is after authLoading is false. If user is still null, it means they should be redirected by the effect.
  // But if we reach here and user is null (e.g. effect hasn't run yet or failed silently), show a message.
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

  if (isLoadingProfile && user) { // Only show profile loading if user is confirmed
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
                onClick={() => handlePurchase(amount)} 
                className="w-full font-pixel btn-pixel"
                disabled={isPurchasing === amount || isLoadingProfile || !userProfile}
              >
                {isPurchasing === amount ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Coins className="mr-2 h-4 w-4" />}
                {isPurchasing === amount ? 'Processing...' : `Buy ${amount} Credits`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <CardFooter className="mt-8 flex justify-center">
        <Link href="/" legacyBehavior>
          <Button variant="outline" className="font-pixel btn-pixel">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quests
          </Button>
        </Link>
      </CardFooter>
    </div>
  );
}

