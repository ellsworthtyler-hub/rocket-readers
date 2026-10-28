import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { hasClassworkPacket } from '@/lib/packets';

export type PacketStatus = 'available' | 'in_development' | 'not_eligible';

// Server-side read of QA packet status (public.rr_book_packet_status view over rr_book_qa).
// Memoised per source_id for 10 minutes.
const TTL_MS = 10 * 60 * 1000;
const cache = new Map<string, { value: PacketStatus | null; at: number }>();

export async function getQaPacketStatus(sourceId: string | number): Promise<PacketStatus | null> {
  const sid = String(sourceId);
  const hit = cache.get(sid);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.value;
  let value: PacketStatus | null = null;
  try {
    const { data, error } = await supabaseAdmin
      .from('rr_book_packet_status')
      .select('packet_status')
      .eq('source_id', sid)
      .limit(1)
      .maybeSingle();
    if (!error && data?.packet_status) value = data.packet_status as PacketStatus;
  } catch {
    value = null;
  }
  cache.set(sid, { value, at: Date.now() });
  return value;
}

/** Pure decision helper (unit-testable): QA says available, or a packet file already exists. */
export function isPacketAvailable(status: PacketStatus | null, fileExists: boolean): boolean {
  return status === 'available' || fileExists;
}

export async function packetAvailableFor(sourceId: string | number): Promise<boolean> {
  const [status, fileExists] = await Promise.all([
    getQaPacketStatus(sourceId),
    hasClassworkPacket(sourceId),
  ]);
  return isPacketAvailable(status, fileExists);
}
