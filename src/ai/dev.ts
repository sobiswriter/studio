import { config } from 'dotenv';
config();

import '@/ai/flows/suggest-tasks.ts';
import '@/ai/flows/calculate-task-xp.ts'; // Added new flow
