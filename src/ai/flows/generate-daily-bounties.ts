
'use server';
/**
 * @fileOverview AI flow that generates daily bounty tasks.
 *
 * - generateDailyBounties - A function that returns 5 diverse bounty tasks.
 * - GenerateDailyBountiesInput - The input type for the function (currently empty).
 * - GenerateDailyBountiesOutput - The return type, an array of bounty definitions.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { NUM_DAILY_BOUNTIES } from '@/lib/constants';

// Input schema (can be expanded later, e.g., with user's recent task categories or completed bounties to avoid repetition)
const GenerateDailyBountiesInputSchema = z.object({
  // userId: z.string().optional().describe("The user ID for personalization, if available."),
  // count: z.number().int().min(1).max(10).default(NUM_DAILY_BOUNTIES).describe("Number of bounties to generate.")
});
export type GenerateDailyBountiesInput = z.infer<typeof GenerateDailyBountiesInputSchema>;

const BountyDefinitionSchema = z.object({
  title: z.string().describe('The concise and engaging title of the bounty task.'),
  duration: z.number().int().min(15).max(30).describe('The duration of the bounty in minutes (must be between 15 and 30).'),
});

const GenerateDailyBountiesOutputSchema = z.object({
  bounties: z.array(BountyDefinitionSchema).length(NUM_DAILY_BOUNTIES).describe(`An array of exactly ${NUM_DAILY_BOUNTIES} bounty definitions.`),
});
export type GenerateDailyBountiesOutput = z.infer<typeof GenerateDailyBountiesOutputSchema>;

export async function generateDailyBounties(input?: GenerateDailyBountiesInput): Promise<GenerateDailyBountiesOutput> {
  return generateDailyBountiesFlow(input || {});
}

const prompt = ai.definePrompt({
  name: 'generateDailyBountiesPrompt',
  input: {schema: GenerateDailyBountiesInputSchema},
  output: {schema: GenerateDailyBountiesOutputSchema},
  prompt: `You are an AI that generates ${NUM_DAILY_BOUNTIES} daily bounty tasks for a gamified to-do app called "Pixel Due".
Your goal is to provide a diverse and engaging set of short tasks that users can complete for fixed rewards.

Bounty Guidelines:
1.  Quantity: Generate exactly ${NUM_DAILY_BOUNTIES} unique bounties.
2.  Duration: Each bounty MUST have a duration strictly between 15 and 30 minutes.
3.  Variety: Create a mix of bounty types:
    *   Productivity/Skill-based: (e.g., "Quick LeetCode warm-up (Easy)", "Draft an outline for a blog post", "Learn 1 new keyboard shortcut", "Sketch a simple UI icon")
    *   Physical Well-being: (e.g., "15-minute stretching session", "20-minute brisk walk", "Do 20 push-ups and 20 squats", "Hold a plank for 60 seconds")
    *   Mindfulness/Organization: (e.g., "10-minute guided meditation", "Tidy your workspace for 15 mins", "Plan your top 3 priorities for tomorrow", "Journal for 10 minutes")
    *   Creative/Fun: (e.g., "Doodle for 15 minutes", "Listen to a new song and note your thoughts", "Write a short 3-line poem")
4.  Clarity: Bounty titles should be clear, concise, and actionable.
5.  Tone: Keep the bounties generally positive and encouraging.
6.  Avoid Repetition: Try to make the ${NUM_DAILY_BOUNTIES} bounties for the day different from each other.

Output Format:
Return ONLY a JSON object with a single key "bounties".
The "bounties" key should have an array of ${NUM_DAILY_BOUNTIES} objects.
Each object in the array must have two keys:
    - "title": A string for the bounty title.
    - "duration": A number (integer) for the bounty duration in minutes (between 15 and 30).

Example of desired output structure:
{
  "bounties": [
    { "title": "Organize your desktop files", "duration": 15 },
    { "title": "Practice deep breathing for 10 mins", "duration": 10 }, // Note: Example error, duration should be 15-30. AI must follow.
    // Corrected example for AI to follow for duration:
    // { "title": "Practice deep breathing for 15 mins", "duration": 15 },
    { "title": "Watch a 20-min educational video", "duration": 20 },
    { "title": "Quick 30-minute sketching exercise", "duration": 30 },
    { "title": "Solve one easy online puzzle", "duration": 25 }
  ]
}
Ensure all durations are between 15 and 30 minutes.
`,
});

const generateDailyBountiesFlow = ai.defineFlow(
  {
    name: 'generateDailyBountiesFlow',
    inputSchema: GenerateDailyBountiesInputSchema,
    outputSchema: GenerateDailyBountiesOutputSchema,
  },
  async (input: GenerateDailyBountiesInput) => {
    const {output} = await prompt(input);
    if (!output || !output.bounties || output.bounties.length !== NUM_DAILY_BOUNTIES) {
      // Fallback if AI fails or returns incorrect number of bounties
      console.error("AI failed to generate valid bounties, using fallback.");
      return {
        bounties: [
          { title: "Fallback: 15 min Reading", duration: 15 },
          { title: "Fallback: Quick Workspace Tidy", duration: 20 },
          { title: "Fallback: Plan Tomorrow's Goals", duration: 15 },
          { title: "Fallback: Short Walk Outside", duration: 25 },
          { title: "Fallback: Brainstorm Ideas", duration: 30 },
        ].slice(0, NUM_DAILY_BOUNTIES) // Ensure correct number even in fallback
      };
    }
    // Validate durations
    const validatedBounties = output.bounties.map(b => ({
        ...b,
        duration: Math.max(15, Math.min(30, b.duration)) // Ensure duration is within 15-30
    }));
    return { bounties: validatedBounties };
  }
);
