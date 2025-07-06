'use server';

/**
 * @fileOverview Generates post ideas based on trending topics using AI.
 *
 * - generatePostIdeas - A function that generates post ideas.
 * - GeneratePostIdeasInput - The input type for the generatePostIdeas function.
 * - GeneratePostIdeasOutput - The return type for the generatePostIdeas function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePostIdeasInputSchema = z.object({
  trendingTopic: z.string().describe('The trending topic to generate post ideas for.'),
  numberOfIdeas: z.number().default(3).describe('The number of post ideas to generate.'),
});
export type GeneratePostIdeasInput = z.infer<typeof GeneratePostIdeasInputSchema>;

const GeneratePostIdeasOutputSchema = z.object({
  postIdeas: z.array(z.string()).describe('An array of generated post ideas.'),
});
export type GeneratePostIdeasOutput = z.infer<typeof GeneratePostIdeasOutputSchema>;

export async function generatePostIdeas(input: GeneratePostIdeasInput): Promise<GeneratePostIdeasOutput> {
  return generatePostIdeasFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePostIdeasPrompt',
  input: {schema: GeneratePostIdeasInputSchema},
  output: {schema: GeneratePostIdeasOutputSchema},
  prompt: `You are a social media expert. Generate {{numberOfIdeas}} post ideas based on the following trending topic:

Trending Topic: {{{trendingTopic}}}

Post Ideas:`,
});

const generatePostIdeasFlow = ai.defineFlow(
  {
    name: 'generatePostIdeasFlow',
    inputSchema: GeneratePostIdeasInputSchema,
    outputSchema: GeneratePostIdeasOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
