'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud } from 'lucide-react';
import { importEvents } from '@/ai/flows/import-events-flow';

const formSchema = z.object({
  query: z.string().min(3, 'Please enter a more specific query.'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ImportEventsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      query: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      const result = await importEvents({ query: data.query });
      toast({
        title: 'Import Complete',
        description: result.message,
      });
      form.reset();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error Importing Events',
        description: error.message || 'An unexpected error occurred. Please check the logs.',
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
            <UploadCloud className="w-6 h-6 text-primary" />
            Import Events from Ticketmaster
          </CardTitle>
          <CardDescription>
            Use AI to find and import events. Simply describe what you're looking for, and the system will fetch them and add them to the Events page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Event Query</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 'pop concerts in new york'" {...field} />
                    </FormControl>
                    <FormDescription>
                      Be descriptive for the best results. You can specify genre, artist, city, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UploadCloud className="mr-2 h-4 w-4" />
                )}
                Find & Import Events
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
