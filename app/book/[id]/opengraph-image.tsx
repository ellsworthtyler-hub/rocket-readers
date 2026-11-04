import { ImageResponse } from 'next/og';
import { isQuarantinedSourceId } from '@/lib/contentQuarantine';
import { getBookMetadataForSourceId } from '@/lib/data';
import { parseBookRef } from '@/lib/bookSources';
import { OG_SIZE, OgCard } from '@/lib/ogCard';
import { grade, pct } from '@/lib/seo';

export const alt = 'Rocket Readers book stats';
export const size = OG_SIZE;
export const contentType = 'image/png';
export const revalidate = 86400;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ref = parseBookRef(id);
  const meta =
    ref && !isQuarantinedSourceId(ref.sourceId, ref.source)
      ? await getBookMetadataForSourceId(ref.sourceId, ref.source)
      : null;

  if (!meta) {
    return new ImageResponse(<OgCard eyebrow="Book" title="Sight-word books for young readers" />, size);
  }

  const stats: { label: string; value: string }[] = [];
  const d = pct(meta.dolch_percentage);
  const g = grade(meta.flesch_grade);
  const f = pct(meta.fry_percentage);
  if (d) stats.push({ label: 'Dolch sight words', value: d });
  if (f) stats.push({ label: 'Fry sight words', value: f });
  if (g) stats.push({ label: 'Reading grade', value: g });

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Book stats"
        title={meta.title}
        subtitle={meta.author && meta.author !== 'Unknown Author' ? `by ${meta.author}` : undefined}
        stats={stats}
      />
    ),
    size
  );
}
