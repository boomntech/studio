'use server';

/**
 * @fileOverview Suggests occupations based on user input.
 *
 * - suggestOccupations - A function that suggests occupations.
 * - SuggestOccupationsInput - The input type for the suggestOccupations function.
 * - SuggestOccupationsOutput - The return type for the suggestOccupations function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestOccupationsInputSchema = z.object({
  query: z.string().describe('The user input to search for occupations.'),
});
export type SuggestOccupationsInput = z.infer<typeof SuggestOccupationsInputSchema>;

const SuggestOccupationsOutputSchema = z.object({
  occupations: z
    .array(z.string())
    .describe('An array of suggested occupations.'),
});
export type SuggestOccupationsOutput = z.infer<
  typeof SuggestOccupationsOutputSchema
>;

export async function suggestOccupations(
  input: SuggestOccupationsInput
): Promise<SuggestOccupationsOutput> {
  return suggestOccupationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOccupationsPrompt',
  input: { schema: SuggestOccupationsInputSchema },
  output: { schema: SuggestOccupationsOutputSchema },
  prompt: `You are a helpful career assistant. Based on the user's input, suggest a list of relevant occupations.
Provide a list of up to 7 suggestions. Do not suggest occupations that are too similar to each other.

User input: {{{query}}}`,
});

const suggestOccupationsFlow = ai.defineFlow(
  {
    name: 'suggestOccupationsFlow',
    inputSchema: SuggestOccupationsInputSchema,
    outputSchema: SuggestOccupationsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
