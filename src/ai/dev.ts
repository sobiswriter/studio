
import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-tasks.ts';
import '@/ai/flows/calculate-task-xp.ts';
import '@/ai/flows/pal-sarcastic-comment-flow.ts';
import '@/ai/flows/generate-daily-bounties.ts'; // Added new flow

