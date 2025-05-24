
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Info, Zap, Palette, Bot } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="container mx-auto p-4 py-8 space-y-6 md:space-y-8 max-w-2xl font-pixel">
      <header className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-pixel text-primary drop-shadow-[3px_3px_0px_hsl(var(--foreground))]">
          About Pixel Due
        </h1>
        <p className="text-muted-foreground mt-2">Your Gamified Task Companion!</p>
      </header>

      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Info size={24} /> What is Pixel Due?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>
            Pixel Due is a gamified to-do list application designed to make managing your daily tasks more fun and engaging. 
            Turn your chores and goals into quests, earn experience points (XP), level up, and interact with your quirky AI companion, Pixel Pal!
          </p>
          <p>
            Whether it's conquering your work projects, learning new skills, or just remembering to water the plants, Pixel Due aims to add a touch of adventure to your productivity.
          </p>
        </CardContent>
      </Card>

      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Zap size={24} /> Key Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Create and manage tasks with due dates and durations.</li>
            <li>Earn XP for completing tasks, dynamically calculated by AI.</li>
            <li>Level up your hero profile and unlock Pal Credits.</li>
            <li>Engage with Pixel Pal, your customizable AI companion with a unique personality.</li>
            <li>Tackle Daily Bounties for extra XP and Pal Credits.</li>
            <li>"Purchase" Pal Credits to interact more with your Pal.</li>
            <li>User authentication to save your progress.</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette size={24} /> Tech Stack</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <p>Pixel Due is proudly built with a modern tech stack:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Next.js (App Router) & React</li>
                <li>TypeScript</li>
                <li>Tailwind CSS & ShadCN UI</li>
                <li>Firebase (Firestore for database, Authentication)</li>
                <li>Genkit & Google AI (for Pixel Pal's intelligence)</li>
            </ul>
        </CardContent>
      </Card>

      <Card className="pixel-corners border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot size={24} /> About the Creator</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Pixel Due was lovingly crafted by Sobi. You can connect with me on:
          </p>
          <div className="flex flex-wrap gap-4 items-center mt-3">
              <a href="https://www.instagram.com/sobi_is_a_writer" target="_blank" rel="noopener noreferrer" className="font-pixel text-primary hover:underline flex items-center gap-1">
                Instagram
              </a>
              <a href="https://www.linkedin.com/in/sobiswriter" target="_blank" rel="noopener noreferrer" className="font-pixel text-primary hover:underline flex items-center gap-1">
                LinkedIn
              </a>
              <a href="https://github.com/sobiswriter" target="_blank" rel="noopener noreferrer" className="font-pixel text-primary hover:underline flex items-center gap-1">
                GitHub
              </a>
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
    </div>
  );
}
