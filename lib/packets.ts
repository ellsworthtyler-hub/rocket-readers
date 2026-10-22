import { r2ObjectExists, isValidSourceId } from '@/lib/r2';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Cheap, cached "does this book have a classwork packet?" check.
// Mirrors the packets API lookup order: R2 first, then the Supabase "classwork" bucket.
// Uses HEAD-style existence checks per key (no bucket listing), memoised per id for 1 hour.
const TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { value: boolean; at: number }>();

async function storageHas(key: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin.storage.from('classwork').exists(key);
    return !error && !!data;
  } catch {
    return false;
  }
}

export async function hasClassworkPacket(sourceId: string | number): Promise<boolean> {
  const sid = String(sourceId);
  if (!isValidSourceId(sid)) return false;
  const hit = cache.get(sid);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

  let value = false;
  try {
    value =
      (await r2ObjectExists(`${sid}_cosmic_packet.pdf`)) ||
      (await storageHas(`${sid}_cosmic_packet.pdf`)) ||
      (await storageHas(`${sid}_classwork.pdf`));
  } catch {
    value = false;
  }
  cache.set(sid, { value, at: Date.now() });
  return value;
}
