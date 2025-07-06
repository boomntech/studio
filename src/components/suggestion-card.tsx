import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

type Suggestion = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  avatarHint: string;
  bio: string;
  type: 'personal' | 'business';
};

interface SuggestionCardProps {
  suggestion: Suggestion;
}

export function SuggestionCard({ suggestion }: SuggestionCardProps) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={suggestion.avatarUrl} alt={suggestion.name} data-ai-hint={suggestion.avatarHint} />
          <AvatarFallback>{suggestion.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-bold">{suggestion.name}</p>
          <p className="text-sm text-muted-foreground">{suggestion.handle}</p>
          <p className="text-sm mt-1 line-clamp-2">{suggestion.bio}</p>
        </div>
        <Button>Follow</Button>
      </CardContent>
    </Card>
  );
}
