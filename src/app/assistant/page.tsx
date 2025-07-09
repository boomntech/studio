
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function AssistantPage() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto bg-primary text-primary-foreground rounded-full h-16 w-16 flex items-center justify-center mb-4">
            <Sparkles className="h-8 w-8" />
          </div>
          <CardTitle>AI Assistant is Coming Soon!</CardTitle>
          <CardDescription>
            We're putting the finishing touches on our powerful AI content assistant. Get ready to supercharge your creativity and workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Stay tuned for updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
