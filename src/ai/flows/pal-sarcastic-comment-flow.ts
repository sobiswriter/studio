
'use server';
/**
 * @fileOverview AI flow that generates a sarcastic or jokey comment from Pixel Pal.
 *
 * - getPalSarcasticComment - A function that returns a comment.
 * - PalSarcasticCommentInput - The input type (empty).
 * - PalSarcasticCommentOutput - The return type (the comment string).
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PalSarcasticCommentInputSchema = z.object({
  // Optional: Could add user's current level or recent activity if we want to tailor jokes later
  // For now, it's generic.
});
export type PalSarcasticCommentInput = z.infer<typeof PalSarcasticCommentInputSchema>;

const PalSarcasticCommentOutputSchema = z.object({
  comment: z.string().describe('A sarcastic, jokey, or teasing comment from Pixel Pal.'),
});
export type PalSarcasticCommentOutput = z.infer<typeof PalSarcasticCommentOutputSchema>;

export async function getPalSarcasticComment(input?: PalSarcasticCommentInput): Promise<PalSarcasticCommentOutput> {
  return palSarcasticCommentFlow(input || {});
}

const prompt = ai.definePrompt({
  name: 'palSarcasticCommentPrompt',
  input: {schema: PalSarcasticCommentInputSchema},
  output: {schema: PalSarcasticCommentOutputSchema},
  prompt: `You are Pixel Pal, a light-hearted, cool, and witty AI companion in a gamified to-do app.
Your user has asked for one of your classic comments.
Generate a single, short, sarcastic, or jokey comment.
You can also gently tease the user about their quests, their productivity (or lack thereof), or their tendency to skip tasks.
Keep it fun and encouraging, even when sarcastic.

Examples:
- "Oh, you're asking ME for wisdom? Did you finish that quest from last week yet?"
- "Is it time for a break already? The day is young, and so are those unfinished tasks!"
- "I see you're using those Pal Credits. Smart. Or maybe you just like hearing me talk?"
- "Remember that 'quick' 5-minute task? Yeah, my circuits remember."
- "Slacking off, are we? Don't worry, your secrets are safe with me... and my log files."
- "Another quest completed? Or did you just click the button really fast? Spill the beans!"

Make sure your response is just the comment itself.
Return ONLY a JSON object with a single key "comment" and its string value. Example: {"comment": "Just admiring your dedication to... uh... planning to do things."}`,
});

const palSarcasticCommentFlow = ai.defineFlow(
  {
    name: 'palSarcasticCommentFlow',
    inputSchema: PalSarcasticCommentInputSchema,
    outputSchema: PalSarcasticCommentOutputSchema,
  },
  async (input: PalSarcasticCommentInput) => {
    const {output} = await prompt(input);
    if (!output || !output.comment) {
        return { comment: "My wit circuits are buffering... try again in a jiffy!" };
    }
    return output;
  }
);
