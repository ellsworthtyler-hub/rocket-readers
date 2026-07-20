// FILE: app/api/read/[sourceId]/route.ts
// =========================================
// Server-only content delivery for the interactive reader.
//
// Primary:  Cloudflare R2 bucket "rr-digital-products"
//           Keys: {sourceId}_full.html | {sourceId}_sample.html
// Fallback: Supabase Storage "enhanced-readers"
//           Keys: {sourceId}_rr_ebook.html | {sourceId}_rr_sample.html
//
// Security:
//   - sample: public
//   - full: requires authenticated premium user (profiles.is_premium)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getR2Text, isValidSourceId } from '@/lib/r2';
import { requirePremium } from '@/lib/serverAuth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const storageClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId: rawId } = await params;
  const sourceId = (rawId || '').trim();
  const { searchParams } = new URL(req.url);
  const variant = (searchParams.get('variant') || 'sample') as 'sample' | 'full';
  const format = searchParams.get('format') || 'json'; // json (default) | raw

  if (!sourceId || !isValidSourceId(sourceId)) {
    return NextResponse.json({ error: 'Invalid sourceId' }, { status: 400 });
  }

  if (variant !== 'sample' && variant !== 'full') {
    return NextResponse.json({ error: 'Invalid variant' }, { status: 400 });
  }

  // Paywall: full edition requires premium
  if (variant === 'full') {
    const gate = await requirePremium(req);
    if (!gate.ok) {
      return NextResponse.json(
        { error: gate.error, code: gate.status === 401 ? 'AUTH_REQUIRED' : 'PREMIUM_REQUIRED' },
        { status: gate.status }
      );
    }
  }

  const r2Key = variant === 'full' ? `${sourceId}_full.html` : `${sourceId}_sample.html`;
  const supabaseKey =
    variant === 'full' ? `${sourceId}_rr_ebook.html` : `${sourceId}_rr_sample.html`;

  try {
    // 1) R2 primary
    let html = await getR2Text(r2Key);
    let contentSource: 'r2' | 'supabase-storage' | null = html ? 'r2' : null;

    // 2) Supabase Storage fallback (legacy publisher path)
    if (!html) {
      const { data: fileData, error: storageError } = await storageClient.storage
        .from('enhanced-readers')
        .download(supabaseKey);

      if (!storageError && fileData) {
        html = await fileData.text();
        contentSource = 'supabase-storage';
      }
    }

    if (!html) {
      return NextResponse.json(
        { error: 'Published edition not yet available', sourceId, variant },
        { status: 404 }
      );
    }

    const cacheControl =
      variant === 'full'
        ? 'private, no-store'
        : 'public, max-age=3600, stale-while-revalidate=86400';

    if (format === 'raw') {
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': cacheControl,
          'X-Content-Source': contentSource || 'unknown',
          'X-Variant': variant,
        },
      });
    }

    // Default: JSON for RocketReader client
    return NextResponse.json(
      {
        html,
        variant,
        sourceId,
        source: contentSource,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': cacheControl,
          'X-Content-Source': contentSource || 'unknown',
          'X-Variant': variant,
        },
      }
    );
  } catch (err: unknown) {
    console.error('[api/read] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
