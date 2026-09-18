// Book enrichment hero — Open Library / Google Books fields only (rr_enricher.py)
// Sparse: omit any block whose data is missing. No Goodreads / Amazon image cache.

type ExternalIds = {
  openlibrary?: string;
  google_books?: string;
  [key: string]: string | undefined;
};

export type BookEnrichment = {
  cover_url?: string | null;
  short_description?: string | null;
  isbn?: string | null;
  external_ids?: ExternalIds | null;
  average_rating?: number | null;
  ratings_count?: number | null;
  popularity_score?: number | null;
};

function openLibraryUrl(key?: string) {
  if (!key) return null;
  const path = key.startsWith('/') ? key : `/${key}`;
  return `https://openlibrary.org${path}`;
}

function googleBooksUrl(id?: string) {
  if (!id) return null;
  return `https://books.google.com/books?id=${encodeURIComponent(id)}`;
}

function starLabel(rating: number) {
  const full = Math.round(rating);
  return '★'.repeat(Math.min(5, Math.max(0, full))) + '☆'.repeat(Math.max(0, 5 - Math.min(5, Math.max(0, full))));
}

export default function BookEnrichmentHero({
  title,
  author,
  gutenbergId,
  enrichment,
}: {
  title: string;
  author: string;
  gutenbergId: string;
  enrichment: BookEnrichment;
}) {
  const cover = enrichment.cover_url?.trim() || null;
  const summary = enrichment.short_description?.trim() || null;
  const isbn = enrichment.isbn?.trim() || null;
  const ids = enrichment.external_ids || {};
  const ol = openLibraryUrl(ids.openlibrary);
  const gb = googleBooksUrl(ids.google_books);
  const rating =
    enrichment.average_rating != null && !Number.isNaN(Number(enrichment.average_rating))
      ? Number(enrichment.average_rating)
      : null;
  const ratingsCount =
    enrichment.ratings_count != null ? Number(enrichment.ratings_count) : null;
  const popularity =
    enrichment.popularity_score != null ? Number(enrichment.popularity_score) : null;
  const showRatingRow = rating != null || ratingsCount != null || popularity != null;

  const chip =
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-600 bg-slate-950/70 text-slate-200 text-xs font-semibold hover:border-emerald-400 hover:text-emerald-300 transition';

  return (
    <div
      className={`mb-8 grid gap-7 items-start ${cover ? 'md:grid-cols-[140px_1fr]' : 'grid-cols-1'}`}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover}
          alt={`Cover for ${title}`}
          className="w-[140px] aspect-[2/3] object-cover rounded-xl border border-slate-600 shadow-lg shadow-black/30 bg-slate-800"
        />
      ) : null}

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          About this edition
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">
          {title}
        </h1>
        <p className="text-lg text-slate-300 mb-4 font-semibold">{author}</p>

        {showRatingRow ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-200 mb-4">
            {rating != null ? (
              <>
                <span className="text-amber-400 tracking-wide" aria-hidden>
                  {starLabel(rating)}
                </span>
                <strong>{rating.toFixed(1)}</strong>
              </>
            ) : null}
            {ratingsCount != null ? (
              <>
                {rating != null ? <span className="text-slate-600">·</span> : null}
                <span>{ratingsCount.toLocaleString()} ratings</span>
              </>
            ) : null}
            {popularity != null ? (
              <>
                <span className="text-slate-600">·</span>
                <span>Popularity {Math.round(popularity)}</span>
              </>
            ) : null}
          </div>
        ) : null}

        {summary ? (
          <p className="text-[15px] leading-relaxed text-slate-300 mb-4 max-w-3xl line-clamp-3">
            {summary}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {isbn ? (
            <span className={`${chip} text-slate-400 font-medium tabular-nums`}>ISBN {isbn}</span>
          ) : null}
          {ol ? (
            <a className={chip} href={ol} target="_blank" rel="noopener noreferrer">
              Open Library
            </a>
          ) : null}
          {gb ? (
            <a className={chip} href={gb} target="_blank" rel="noopener noreferrer">
              Google Books
            </a>
          ) : null}
          <a
            className={chip}
            href={`https://www.gutenberg.org/ebooks/${gutenbergId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Gutenberg #{gutenbergId}
          </a>
        </div>
      </div>
    </div>
  );
}
