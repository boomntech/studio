
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MontanaTipProps {
  tip: React.ReactNode;
  className?: string;
}

export function MontanaTip({ tip, className }: MontanaTipProps) {
  return (
    <div className={cn("flex items-start gap-3 p-3 bg-secondary rounded-lg mb-6", className)}>
      <Avatar className="h-10 w-10 border-2 border-primary">
        {/* You can replace this placeholder with the actual URL to Montana's avatar */}
        <AvatarImage src="https://placehold.co/128x128.png" data-ai-hint="man headphones cartoon" />
        <AvatarFallback>M</AvatarFallback>
      </Avatar>
      <div className="flex-1 pt-1">
        <p className="text-sm text-secondary-foreground leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
