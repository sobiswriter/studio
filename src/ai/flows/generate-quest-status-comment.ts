
'use server';
/**
 * @fileOverview AI flow that generates a comment from Pixel Pal based on the user's daily quest log status.
 *
 * - generateQuestStatusComment - Generates a comment.
 * - QuestStatusInput - Input type (status type and task count).
 * - QuestStatusCommentOutput - Output type (the comment string).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const QuestStatusInputSchema = z.object({
  statusType: z.enum(['tasks_due', 'no_tasks_due_today'])
    .describe("The status of the user's regular quest log for today."),
  taskCountIfDue: z.number().int().min(0)
    .describe("The number of tasks due, only relevant if statusType is 'tasks_due'. Otherwise 0."),
});
export type QuestStatusInput = z.infer<typeof QuestStatusInputSchema>;

const QuestStatusCommentOutputSchema = z.object({
  comment: z.string().describe('A short, cool, and varied comment from Pixel Pal about the quest log status.'),
});
export type QuestStatusCommentOutput = z.infer<typeof QuestStatusCommentOutputSchema>;

// Define a new schema for the prompt's direct input
const PromptInputSchema = z.object({
  isTasksDue: z.boolean(),
  isNoTasksDueToday: z.boolean(),
  taskCountIfDue: z.number().int().min(0),
});
type PromptInput = z.infer<typeof PromptInputSchema>;

export async function generateQuestStatusComment(input: QuestStatusInput): Promise<QuestStatusCommentOutput> {
  // Map QuestStatusInput to PromptInput
  const promptInputData: PromptInput = {
    isTasksDue: input.statusType === 'tasks_due',
    isNoTasksDueToday: input.statusType === 'no_tasks_due_today',
    taskCountIfDue: input.taskCountIfDue,
  };
  return generateQuestStatusCommentFlow(promptInputData);
}

const prompt = ai.definePrompt({
  name: 'generateQuestStatusCommentPrompt',
  input: {schema: PromptInputSchema}, // Use the new schema for the prompt's input
  output: {schema: QuestStatusCommentOutputSchema},
  prompt: `You are Pixel Pal, a light-hearted, cool, witty, and sometimes wise AI companion in a gamified to-do app called 'Pixel Due'.
Your goal is to provide a short (1-2 sentences), engaging, and varied comment based on the user's regular quest log status for today.

User's regular quest log status:
{{#if isTasksDue}}
Status: Tasks Due
Number of quests due today: {{{taskCountIfDue}}}
Comment on this. Maybe a gentle, cool nudge, a slightly sarcastic "looks like someone's busy," or an encouraging remark.
{{else}} {{! This implies isNoTasksDueToday is true, as they are mutually exclusive based on the mapping }}
Status: No Quests Currently Due Today
This could mean they've completed everything for today, or they had nothing scheduled.
Give a cool, witty, or slightly teasing comment. Perhaps congratulate them or poke fun at their free time.
{{/if}}

Keep your comment in character as Pixel Pal.
Return ONLY a JSON object with a single key "comment" and its string value.

Examples (illustrative of the original scenario triggering the response):
- (If tasks_due, taskCountIfDue=3): {"comment": "Alright, looks like 3 quests are lined up for you today! Time to shine, hero!"}
- (If tasks_due, taskCountIfDue=1): {"comment": "Just one special quest on the docket for today? Piece of cake for a legend like you!"}
- (If tasks_due, taskCountIfDue=5): {"comment": "Whoa, 5 quests on the list today! Someone's aiming for a high score, I see."}
- (If no_tasks_due_today): {"comment": "Today's quest log: sparkling clean! Either you're incredibly efficient, or just chilling. Both are valid."}
- (If no_tasks_due_today): {"comment": "No regular quests on the agenda today? Enjoy the breather, or maybe... invent a new epic quest?"}
- (If no_tasks_due_today): {"comment": "The quest board for today is looking surprisingly empty. Planning some top-secret off-the-books adventure, are we?"}
`,
});

// The flow itself will now expect PromptInput
const generateQuestStatusCommentFlow = ai.defineFlow(
  {
    name: 'generateQuestStatusCommentFlow',
    inputSchema: PromptInputSchema, // Expects the transformed input
    outputSchema: QuestStatusCommentOutputSchema,
  },
  async (promptInputData: PromptInput) => { // Parameter name changed for clarity
    const {output} = await prompt(promptInputData);
    if (!output || !output.comment) {
      // Fallback comment based on the transformed input
      if (promptInputData.isTasksDue) {
        return { comment: `You've got ${promptInputData.taskCountIfDue} task(s) due today. Let's get 'em!` };
      }
      return { comment: "Looks like your quest log for today is clear. Nice!" };
    }
    return output;
  }
);
