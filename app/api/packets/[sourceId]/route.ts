// FILE: app/api/packets/[sourceId]/route.ts
// Premium-gated classwork packet download (cosmic PDF on R2).

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getR2PresignedGetUrl, isValidSourceId, R2_PRODUCTS_BUCKET } from '@/lib/r2';
import { requirePremium } from '@/lib/serverAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId: rawId } = await params;
  const sourceId = (rawId || '').trim();
  const { searchParams } = new URL(req.url);
  const preferRedirect = searchParams.get('redirect') === '1';

  if (!sourceId || !isValidSourceId(sourceId)) {
    return NextResponse.json({ error: 'Invalid sourceId' }, { status: 400 });
  }

  const gate = await requirePremium(req);
  if (!gate.ok) {
    return NextResponse.json(
      { error: gate.error, code: gate.status === 401 ? 'AUTH_REQUIRED' : 'PREMIUM_REQUIRED' },
      { status: gate.status }
    );
  }

  try {
    const r2Key = `${sourceId}_cosmic_packet.pdf`;
    const signed = await getR2PresignedGetUrl(r2Key, 300, R2_PRODUCTS_BUCKET);
    if (signed) {
      if (preferRedirect) return NextResponse.redirect(signed, 302);
      return NextResponse.json({
        url: signed,
        source: 'r2',
        key: r2Key,
        expiresIn: 300,
      });
    }

    const storageClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    for (const key of [`${sourceId}_cosmic_packet.pdf`, `${sourceId}_classwork.pdf`]) {
      const { data, error } = await storageClient.storage
        .from('classwork')
        .createSignedUrl(key, 300);
      if (!error && data?.signedUrl) {
        if (preferRedirect) return NextResponse.redirect(data.signedUrl, 302);
        return NextResponse.json({
          url: data.signedUrl,
          source: 'supabase-storage',
          key,
          expiresIn: 300,
        });
      }
    }

    return NextResponse.json(
      { error: 'Classwork packet not yet available', sourceId },
      { status: 404 }
    );
  } catch (err) {
    console.error('[api/packets] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
