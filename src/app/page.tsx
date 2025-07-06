import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';
import { StoriesBar } from '@/components/stories-bar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const posts = [
  {
    id: '1',
    author: {
      name: 'Jane Doe',
      avatarUrl: 'https://placehold.co/40x40.png',
      handle: '@janedoe',
    },
    content: 'Just had the most amazing coffee! ☕️ #coffeelover #cafe',
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'coffee lifestyle',
    likes: 120,
    comments: 12,
    shares: 5,
    timestamp: '2h ago',
    type: 'personal',
  },
  {
    id: '2',
    author: {
      name: 'John Smith',
      avatarUrl: 'https://placehold.co/40x40.png',
      handle: '@johnsmith',
    },
    content: 'Exploring the city vibes today! What are your favorite spots?',
    likes: 350,
    comments: 45,
    shares: 20,
    timestamp: '5h ago',
    type: 'personal',
  },
  {
    id: '3',
    author: {
      name: 'Boomn Corp',
      avatarUrl: 'https://placehold.co/40x40.png',
      handle: '@boomncorp',
    },
    content: 'Loving the new Boomn features! The event listings are a game-changer.',
    likes: 88,
    comments: 8,
    shares: 2,
    timestamp: '1d ago',
    type: 'business',
  },
];

export default function Home() {
  const personalPosts = posts.filter((post) => post.type === 'personal');
  const businessPosts = posts.filter((post) => post.type === 'business');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <StoriesBar />
      <CreatePost />
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="business">Businesses</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="personal" className="mt-6">
          <div className="space-y-4">
            {personalPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="business" className="mt-6">
          <div className="space-y-4">
            {businessPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
