'use client';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generatePostIdeas, type GeneratePostIdeasOutput } from '@/ai/flows/generate-post-ideas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters long.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function AssistantPage() {
  const [ideas, setIdeas] = useState<GeneratePostIdeasOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setIdeas(null);
    try {
      const result = await generatePostIdeas({ trendingTopic: data.topic, numberOfIdeas: 5 });
      setIdeas(result);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error generating ideas',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            AI Content Assistant
          </CardTitle>
          <CardDescription>
            Enter a trending topic and our AI will generate engaging post ideas for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trending Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'latest space discovery'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Generate Ideas
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
         <Card>
            <CardContent className="p-6 text-center space-y-4">
                 <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                 <p className="text-muted-foreground">Generating amazing ideas...</p>
            </CardContent>
        </Card>
      )}

      {ideas && ideas.postIdeas.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Generated Ideas</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {ideas.postIdeas.map((idea, index) => (
                        <li key={index} className="flex items-start gap-4 p-4 bg-secondary rounded-lg">
                            <Sparkles className="w-5 h-5 mt-1 text-primary shrink-0" />
                            <p>{idea}</p>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
