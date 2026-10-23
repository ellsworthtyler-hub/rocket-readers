import { ImageResponse } from 'next/og';
import { OG_SIZE, OgCard } from '@/lib/ogCard';

export const alt = 'Rocket Readers: sight-word books for young readers';
export const size = OG_SIZE;
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <OgCard
        eyebrow="rocketreaders.us"
        title="Sight-word books for young readers"
        subtitle="Dolch and Fry coverage, reading grade, and enhanced editions of public-domain classics."
        stats={[
          { label: 'Free library', value: 'Public domain' },
          { label: 'Built for', value: 'K-3 readers' },
        ]}
      />
    ),
    size
  );
}
