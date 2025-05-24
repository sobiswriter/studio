
"use client";

import type { Task } from '@/types';
import { TaskItem } from './TaskItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { ScrollArea } from '@/components/ui/scroll-area'; // Removed ScrollArea
import { Sun, CheckCircle2 } from 'lucide-react'; // Icons for bounties

interface DailyBountyListProps {
  activeBounties: Task[];
  completedBounties: Task[];
  onStartQuest: (taskId: string) => void; // Re-use for starting bounty
  onToggleComplete: (taskId: string, isCompleted: boolean) => void; // For marking bounty as complete
  isLoading?: boolean;
}

export function DailyBountyList({
  activeBounties,
  completedBounties,
  onStartQuest,
  onToggleComplete,
  isLoading
}: DailyBountyListProps) {

  if (isLoading) {
     return (
      <Card className="pixel-corners border-2 border-amber-500 shadow-[4px_4px_0px_hsl(var(--amber-500))] bg-amber-50">
        <CardHeader>
          <CardTitle className="font-pixel flex items-center gap-2 text-amber-700"><Sun size={20} /> Daily Bounties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-amber-600 font-pixel p-4">Pal is conjuring today's bounties...</p>
        </CardContent>
      </Card>
    );
  }

  const allBountiesForDay = [...activeBounties, ...completedBounties];

  if (allBountiesForDay.length === 0) {
    return (
      <Card className="pixel-corners border-2 border-amber-500 shadow-[4px_4px_0px_hsl(var(--amber-500))] bg-amber-50">
        <CardHeader>
          <CardTitle className="font-pixel flex items-center gap-2 text-amber-700"><Sun size={20} /> Daily Bounties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-amber-600 font-pixel p-4">No bounties available for today, or Pal is still thinking. Check back soon!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pixel-corners border-2 border-amber-500 shadow-[4px_4px_0px_hsl(var(--amber-500))] bg-amber-50">
      <CardHeader>
        <CardTitle className="font-pixel flex items-center gap-2 text-amber-700"><Sun size={24} /> Daily Bounties</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2"> {/* Removed ScrollArea, added space-y-2 for TaskItems */}
        {activeBounties.length > 0 && (
          <>
            {activeBounties.map((bounty) => (
              <TaskItem
                key={bounty.id}
                task={bounty}
                onToggleComplete={onToggleComplete}
                onEditTask={() => {}} // Bounties are not editable
                onDeleteTask={() => {}} // Bounties are not deletable
                onStartQuest={onStartQuest}
              />
            ))}
          </>
        )}
        {completedBounties.length > 0 && (
          <>
          {activeBounties.length > 0 && <hr className="my-3 border-amber-400"/>}
           <h3 className="font-pixel text-sm text-amber-600 my-2 ml-1 flex items-center gap-1"><CheckCircle2 size={16}/>Completed Today</h3>
            {completedBounties.map((bounty) => (
              <TaskItem
                key={bounty.id}
                task={bounty}
                onToggleComplete={onToggleComplete}
                onEditTask={() => {}}
                onDeleteTask={() => {}}
                onStartQuest={onStartQuest} // Should be disabled if completed
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
