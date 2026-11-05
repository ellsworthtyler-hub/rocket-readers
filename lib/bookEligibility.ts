// FILE: lib/bookEligibility.ts  (server-only: uses the service role)
// Which non-Gutenberg books may be served: passed QA stages 4b-4d and not quarantined.
// gutenberg_au additionally requires the US public-domain gate (off by default).
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { isSourceEnabled, pgauGateOn, type BookSource } from '@/lib/bookSources';

export type QaRow = {
  s4b_status: string | null;
  s4c_status: string | null;
  s4d_status: string | null;
  rights_status: string | null;
  quarantined: boolean | null;
};

export function qaRowServable(source: BookSource, qa: QaRow | null | undefined): boolean {
  if (source === 'gutenberg') return true;
  if (!isSourceEnabled(source) || !qa) return false;
  if (qa.quarantined) return false;
  if (qa.s4b_status !== 'pass' || qa.s4c_status !== 'pass' || qa.s4d_status !== 'pass') return false;
  if (source === 'gutenberg_au') return pgauGateOn() && qa.rights_status === 'pass';
  return true;
}

export async function isServableBook(source: BookSource, internalBookId: number): Promise<boolean> {
  if (source === 'gutenberg') return true;
  if (!isSourceEnabled(source)) return false;
  const { data, error } = await supabaseAdmin
    .from('rr_book_qa')
    .select('s4b_status, s4c_status, s4d_status, rights_status, quarantined')
    .eq('book_id', internalBookId)
    .maybeSingle();
  if (error) {
    console.error('isServableBook:', error);
    return false;
  }
  return qaRowServable(source, data as QaRow | null);
}
