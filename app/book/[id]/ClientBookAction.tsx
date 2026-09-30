// Deprecated: use components/ui/BookActions.tsx (wired on the book page).
// Kept as a thin re-export so any leftover imports do not break.

'use client';

import BookActions from '@/components/ui/BookActions';

interface ClientBookActionProps {
  bookId: number | string;
}

/** @deprecated Prefer BookActions directly */
export default function ClientBookAction({ bookId }: ClientBookActionProps) {
  return <BookActions bookId={bookId} gutenbergId={bookId} />;
}
