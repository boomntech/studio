import { SuggestionCard } from '@/components/suggestion-card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { TrendingCard } from '@/components/trending-card';


const suggestions = [
  {
    id: '1',
    name: 'Tech Innovators',
    handle: '@techinnovators',
    avatarUrl: 'https://placehold.co/64x64.png',
    avatarHint: 'logo tech',
    bio: 'Your daily dose of the latest in technology and innovation. We cover everything from AI to space exploration.',
    type: 'business',
  },
  {
    id: '2',
    name: 'Alex Johnson',
    handle: '@alexj',
    avatarUrl: 'https://placehold.co/64x64.png',
    avatarHint: 'portrait photographer',
    bio: 'Photographer & Digital Nomad. Capturing the world one photo at a time. 📸✈️',
    type: 'personal',
  },
  {
    id: '3',
    name: 'Gourmet Guides',
    handle: '@gourmetguides',
    avatarUrl: 'https://placehold.co/64x64.png',
    avatarHint: 'logo food',
    bio: 'Discover the best food spots in your city. Reviews, recipes, and more for all the foodies out there!',
    type: 'business',
  },
    {
    id: '4',
    name: 'Maria Garcia',
    handle: '@mariag',
    avatarUrl: 'https://placehold.co/64x64.png',
    avatarHint: 'portrait fitness',
    bio: 'Fitness enthusiast and personal trainer. Helping you achieve your health goals. #fitness #health',
    type: 'personal',
  },
  {
    id: '5',
    name: 'Creative Coders',
    handle: '@creativecoders',
    avatarUrl: 'https://placehold.co/64x64.png',
    avatarHint: 'logo code',
    bio: 'A community for developers who love to build beautiful and creative things with code. Join us!',
    type: 'business',
  },
    {
    id: '6',
    name: 'Sam Chen',
    handle: '@samchen',
    avatarUrl: 'https://placehold.co/64x64.png',
    avatarHint: 'portrait gamer',
    bio: 'Indie game developer working on my next big project. I talk about game design and development.',
    type: 'personal',
  },
];

export default function ExplorePage() {
    const personalSuggestions = suggestions.filter(s => s.type === 'personal');
    const businessSuggestions = suggestions.filter(s => s.type === 'business');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
      <div className="lg:col-span-2 xl:col-span-3 space-y-6">
       <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for people and businesses..."
          className="pl-10 h-12 text-base"
        />
      </div>

       <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
             <h2 className="text-2xl font-bold">Suggested for you</h2>
            {suggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="people" className="mt-6">
           <div className="space-y-4">
             <h2 className="text-2xl font-bold">Suggested People</h2>
            {personalSuggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="businesses" className="mt-6">
           <div className="space-y-4">
             <h2 className="text-2xl font-bold">Suggested Businesses</h2>
            {businessSuggestions.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
      </div>

      <div className="hidden lg:block space-y-6">
        <TrendingCard />
      </div>
    </div>
  );
}
