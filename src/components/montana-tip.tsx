
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
        <AvatarImage src="https://firebasestorage.googleapis.com/v0/b/boomn-kzlll.firebasestorage.app/o/1000006710.png?alt=media&token=3beb0bcc-6829-4b4a-95c5-842dc0fa16ce" />
        <AvatarFallback>M</AvatarFallback>
      </Avatar>
      <div className="flex-1 pt-1">
        <p className="text-sm text-secondary-foreground leading-relaxed">{tip}</p>
      </div>
    </div>
  );
}
