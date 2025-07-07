'use server';

/**
 * @fileOverview Suggests interests based on user input.
 *
 * - suggestInterests - A function that suggests interests.
 * - SuggestInterestsInput - The input type for the suggestInterests function.
 * - SuggestInterestsOutput - The return type for the suggestInterests function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestInterestsInputSchema = z.object({
  query: z.string().describe('The user input to search for interests.'),
});
export type SuggestInterestsInput = z.infer<typeof SuggestInterestsInputSchema>;

const SuggestInterestsOutputSchema = z.object({
  interests: z
    .array(z.string())
    .describe('An array of suggested interests.'),
});
export type SuggestInterestsOutput = z.infer<
  typeof SuggestInterestsOutputSchema
>;

export async function suggestInterests(
  input: SuggestInterestsInput
): Promise<SuggestInterestsOutput> {
  return suggestInterestsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestInterestsPrompt',
  input: { schema: SuggestInterestsInputSchema },
  output: { schema: SuggestInterestsOutputSchema },
  prompt: `You are a helpful assistant. Based on the user's input, suggest a list of relevant interests or hobbies.
Provide a list of up to 7 suggestions.

User input: {{{query}}}`,
});

const suggestInterestsFlow = ai.defineFlow(
  {
    name: 'suggestInterestsFlow',
    inputSchema: SuggestInterestsInputSchema,
    outputSchema: SuggestInterestsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
