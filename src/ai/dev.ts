import { config } from 'dotenv';
config();

import '@/ai/flows/generate-post-ideas.ts';
import '@/ai/flows/suggest-occupations.ts';
import '@/ai/flows/suggest-interests.ts';
import '@/ai/flows/get-recommended-posts.ts';
import '@/ai/flows/import-events-flow.ts';
