'use server';

/**
 * @fileOverview Ranks posts for a personalized feed using an AI recommendation engine.
 *
 * - getRecommendedPosts - A function that returns a ranked list of posts for a user.
 * - GetRecommendedPostsInput - The input type for the getRecommendedPosts function.
 * - GetRecommendedPostsOutput - The return type for the getRecommendedPosts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const UserProfileSchema = z.object({
  interests: z.array(z.string()).describe("A list of the user's interests."),
  occupation: z.array(z.string()).optional().describe("The user's occupation(s)."),
  location: z.string().optional().describe("The user's city and state."),
  age: z.number().optional().describe("The user's age."),
  race: z.string().optional().describe("The user's race."),
  sexualOrientation: z.string().optional().describe("The user's sexual orientation."),
});

const PostAuthorSchema = z.object({
  name: z.string(),
  avatarUrl: z.string(),
  handle: z.string(),
});

const PostSchema = z.object({
  id: z.string(),
  author: PostAuthorSchema,
  content: z.string(),
  imageUrl: z.string().optional(),
  dataAiHint: z.string().optional(),
  likes: z.number(),
  comments: z.number(),
  shares: z.number(),
  timestamp: z.string(),
  type: z.enum(['personal', 'business']),
  trending: z.boolean().optional(),
  websiteUrl: z.string().optional(),
  appointmentUrl: z.string().optional(),
  productUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type Post = z.infer<typeof PostSchema>;

const GetRecommendedPostsInputSchema = z.object({
  userProfile: UserProfileSchema,
  posts: z.array(PostSchema),
});
export type GetRecommendedPostsInput = z.infer<typeof GetRecommendedPostsInputSchema>;

const RecommendedPostSchema = PostSchema.extend({
  recommendationReason: z
    .string()
    .describe(
      'A brief, friendly explanation for why this post was recommended to the user.'
    ),
});
export type RecommendedPost = z.infer<typeof RecommendedPostSchema>;

const GetRecommendedPostsOutputSchema = z.object({
  recommendedPosts: z.array(RecommendedPostSchema),
});
export type GetRecommendedPostsOutput = z.infer<
  typeof GetRecommendedPostsOutputSchema
>;

export async function getRecommendedPosts(
  input: GetRecommendedPostsInput
): Promise<GetRecommendedPostsOutput> {
  return getRecommendedPostsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getRecommendedPostsPrompt',
  input: { schema: GetRecommendedPostsInputSchema },
  output: { schema: GetRecommendedPostsOutputSchema },
  prompt: `You are an advanced social media recommendation engine. Your task is to re-order a list of posts to create a personalized 'For You' feed for a specific user.

Analyze the user's profile provided in the input: their interests, occupation, location, and other demographic data.
Then, for the given list of posts, determine a relevance score for each one. The most relevant posts should come first.

Factors to consider for relevance:
- Direct match with user's interests (from 'tags').
- Posts that are trending.
- Content related to the user's occupation.
- Posts that might be popular with users of a similar demographic profile.

For each post in the returned list, you MUST include a 'recommendationReason' field explaining in a short, friendly sentence why this post was recommended to the user (e.g., "Because you're interested in tech," or "Trending in your area!").

Return the full list of posts, sorted from most to least relevant, with the added 'recommendationReason' for each.`,
});

const getRecommendedPostsFlow = ai.defineFlow(
  {
    name: 'getRecommendedPostsFlow',
    inputSchema: GetRecommendedPostsInputSchema,
    outputSchema: GetRecommendedPostsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
