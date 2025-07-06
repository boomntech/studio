import { CreatePost } from '@/components/create-post';
import { PostCard } from '@/components/post-card';

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
  },
  {
    id: '3',
    author: {
      name: 'Alice Johnson',
      avatarUrl: 'https://placehold.co/40x40.png',
      handle: '@alicej',
    },
    content: 'Loving the new Boomn features! The event listings are a game-changer.',
    likes: 88,
    comments: 8,
    shares: 2,
    timestamp: '1d ago',
  },
];

export default function Home() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <CreatePost />
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
