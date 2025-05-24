
'use server';
/**
 * @fileOverview AI flow that calculates XP for a given task.
 *
 * - calculateTaskXp - A function that determines XP based on task title and duration.
 * - CalculateTaskXpInput - The input type for the calculateTaskXp function.
 * - CalculateTaskXpOutput - The return type for the calculateTaskXp function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateTaskXpInputSchema = z.object({
  taskTitle: z.string().describe('The title or description of the task.'),
  taskDuration: z.number().optional().describe('The duration of the task in minutes (if provided).'),
});
export type CalculateTaskXpInput = z.infer<typeof CalculateTaskXpInputSchema>;

const CalculateTaskXpOutputSchema = z.object({
  xp: z.number().int().min(1).max(100).describe('The calculated experience points for the task.'),
});
export type CalculateTaskXpOutput = z.infer<typeof CalculateTaskXpOutputSchema>;

export async function calculateTaskXp(input: CalculateTaskXpInput): Promise<CalculateTaskXpOutput> {
  return calculateTaskXpFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateTaskXpPrompt',
  input: {schema: CalculateTaskXpInputSchema},
  output: {schema: CalculateTaskXpOutputSchema},
  prompt: `You are an XP calculation expert for a gamified to-do app called "Pixel Due".
Your goal is to assign an appropriate XP (Experience Points) value to a task based on its title and duration.

Guidelines for XP assignment:
1.  Base XP: Start with a base of 5 XP for any task. Minimum XP should be 5.
2.  Productivity/Skill Factor:
    *   Highly productive, creative, or skill-based tasks (e.g., "Learn Next.js", "Solve Leetcode problem", "Write blog post", "Practice instrument", "Deep work session", "Develop new feature", "Design UI mockups") should receive a significant XP boost (add +10 to +25 XP to the base).
    *   Moderately productive tasks or important errands (e.g., "Plan weekly meals", "Organize project files", "Reply to important work emails", "Research topic", "Gym workout") should receive a smaller XP boost (add +5 to +15 XP to the base).
    *   Mundane or routine tasks (e.g., "Pay bills", "Do laundry", "Grocery shopping", "Clean room", "Walk the dog") should receive little to no extra XP beyond the base or a very small boost (add +0 to +5 XP to the base).
3.  Duration Factor (only if duration is provided and greater than 0):
    *   For tasks with a duration, add XP based on the time commitment. Approximately 1 XP for every 15 minutes of duration.
    *   Example: A 60-minute task gets +4 XP from duration. A 30-minute task gets +2 XP. A task less than 15 minutes gets +0 or +1 from duration.
4.  Combination: Combine the base XP, productivity/skill factor, and duration factor.
5.  Cap: Ensure the total XP for a single task does not exceed 50 XP.
6.  Output: Return ONLY a JSON object with a single key "xp" and its integer value. Example: {"xp": 25}

Task Details:
Title: {{{taskTitle}}}
{{#if taskDuration}} {{! This block will render if taskDuration is provided and is a positive number }}
Duration: {{{taskDuration}}} minutes
{{/if}}
`,
});

const calculateTaskXpFlow = ai.defineFlow(
  {
    name: 'calculateTaskXpFlow',
    inputSchema: CalculateTaskXpInputSchema,
    outputSchema: CalculateTaskXpOutputSchema,
  },
  async (input: CalculateTaskXpInput) => {
    const {output} = await prompt(input);
    if (!output) {
        // Fallback XP if AI fails to provide an output
        return { xp: 10 };
    }
    return output;
  }
);

