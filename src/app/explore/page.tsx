import Image from 'next/image';

const images = [
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 1', hint: 'travel city' },
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 2', hint: 'food photography' },
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 3', hint: 'nature landscape' },
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 4', hint: 'fashion style' },
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 5', hint: 'abstract art' },
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 6', hint: 'pet animal' },
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 7', hint: 'sports action' },
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 8', hint: 'technology gadget' },
  { src: 'https://placehold.co/600x600.png', alt: 'Placeholder 9', hint: 'architecture building' },
];

export default function ExplorePage() {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
        {images.map((image, index) => (
          <div key={index} className="aspect-square relative group">
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
              data-ai-hint={image.hint}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
