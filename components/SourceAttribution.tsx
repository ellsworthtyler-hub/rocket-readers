// FILE: components/SourceAttribution.tsx
// Source + license block on the book stats page. For CC BY-SA sources (Wikisource, Wikibooks)
// this is the required attribution: source link, contributors credit, license name + link,
// and a note that the text was modified.
import { SourceBadge } from '@/components/ui/SourceIcon';
import { sourceInfo, wikiHistoryUrl } from '@/lib/bookSources';

const link = 'text-emerald-300 font-semibold hover:underline';

export default function SourceAttribution({
  source,
  title,
  sourceId,
  originalUrl,
}: {
  source: string;
  title: string;
  sourceId: string;
  originalUrl: string | null;
}) {
  const info = sourceInfo(source);

  if (info.source === 'gutenberg') {
    return (
      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-slate-300">
        <SourceBadge source="gutenberg" />
        <span>
          Public-domain text from{' '}
          <a className={link} href={`https://www.gutenberg.org/ebooks/${sourceId}`} target="_blank" rel="noopener noreferrer">
            Project Gutenberg #{sourceId}
          </a>
          .
        </span>
      </div>
    );
  }

  const history = wikiHistoryUrl(originalUrl);
  const site = info.label;
  return (
    <section
      aria-label="Source and license"
      className="mb-8 rounded-2xl border border-slate-600/80 bg-slate-800/90 p-4 text-sm text-slate-300 space-y-2"
    >
      <SourceBadge source={info.source} />
      <p>
        <span className="font-semibold text-slate-100">“{title}”</span> is from{' '}
        {originalUrl ? (
          <a className={link} href={originalUrl} target="_blank" rel="noopener noreferrer">
            {site}
          </a>
        ) : (
          site
        )}
        {history ? (
          <>
            , by the{' '}
            <a className={link} href={history} target="_blank" rel="noopener noreferrer">
              {site} contributors
            </a>
          </>
        ) : (
          <>, by the {site} contributors</>
        )}
        .
        {info.licenseName && info.licenseUrl ? (
          <>
            {' '}The text is licensed under{' '}
            <a className={link} href={info.licenseUrl} target="_blank" rel="license noopener noreferrer">
              {info.licenseName}
            </a>
            .
          </>
        ) : null}
      </p>
      <p className="text-slate-400">
        Changes: Rocket Readers cleaned and reformatted this text and computed the reading statistics shown on
        this page. Read the original on{' '}
        {originalUrl ? (
          <a className={link} href={originalUrl} target="_blank" rel="noopener noreferrer">
            {site}
          </a>
        ) : (
          site
        )}
        .
      </p>
    </section>
  );
}
