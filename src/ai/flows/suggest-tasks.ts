'use server';
/**
 * @fileOverview AI flow that suggests tasks based on user history.
 *
 * - suggestTasks - A function that suggests tasks the user commonly does but hasn't scheduled for the day.
 * - SuggestTasksInput - The input type for the suggestTasks function (empty).
 * - SuggestTasksOutput - The return type for the suggestTasks function (list of task names).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTasksInputSchema = z.object({});
export type SuggestTasksInput = z.infer<typeof SuggestTasksInputSchema>;

const SuggestTasksOutputSchema = z.object({
  suggestedTasks: z.array(z.string()).describe('List of suggested task names.'),
});
export type SuggestTasksOutput = z.infer<typeof SuggestTasksOutputSchema>;

export async function suggestTasks(input: SuggestTasksInput): Promise<SuggestTasksOutput> {
  return suggestTasksFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTasksPrompt',
  input: {schema: SuggestTasksInputSchema},
  output: {schema: SuggestTasksOutputSchema},
  prompt: `Based on your knowledge of the user's past tasks, suggest tasks that the user commonly does but hasn't scheduled for the day. Return a list of task names in the suggestedTasks array.`,
});

const suggestTasksFlow = ai.defineFlow(
  {
    name: 'suggestTasksFlow',
    inputSchema: SuggestTasksInputSchema,
    outputSchema: SuggestTasksOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
