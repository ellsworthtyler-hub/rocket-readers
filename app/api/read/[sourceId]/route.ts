// FILE: app/api/read/[sourceId]/route.ts
// =========================================
// Server-only content delivery for the interactive reader.
// 
// Primary source: Cloudflare R2 bucket "rr-digital-products"
//   - Keys: {sourceId}_full.html   and   {sourceId}_sample.html
//   (published automatically by rr_publisher.py via rr_master)
//
// Fallback: Supabase Storage "enhanced-readers" (legacy keys with _rr_ prefix)
//
// Requires @aws-sdk/client-s3 (install with: npm install @aws-sdk/client-s3)
//
// Full HTML is served only to a paid adult session or a valid class-code cookie.
// Everyone else receives the sample, even if they ask for variant=full.

import { NextRequest, NextResponse } from 'next/server';
import { resolvePaidAccess } from '@/lib/access';
import { createClient } from '@supabase/supabase-js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Service role key is safer for storage downloads if the bucket is private.
// Fall back to anon if you have made "enhanced-readers" public.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

const storageClient = createClient(supabaseUrl, supabaseServiceKey);

// R2 client (server-side only). Uses the same credentials as the Python backend.
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sourceId: string }> }
) {
  const { sourceId } = await params;
  const { searchParams } = new URL(req.url);
  const requested = searchParams.get('variant') === 'full' ? 'full' : 'sample';
  const access = requested === 'full' ? await resolvePaidAccess(req) : null;
  const variant = requested === 'full' && access?.paid ? 'full' : 'sample';

  if (!sourceId) {
    return NextResponse.json({ error: 'Missing sourceId' }, { status: 400 });
  }

  // R2 keys (new primary, published by rr_publisher.py)
  const r2Key =
    variant === 'full'
      ? `${sourceId}_full.html`
      : `${sourceId}_sample.html`;

  // Legacy Supabase keys (fallback)
  const legacyFileName =
    variant === 'full'
      ? `${sourceId}_rr_ebook.html`
      : `${sourceId}_rr_sample.html`;

  try {
    // 1. PREFER R2 (rr-digital-products)
    try {
      const command = new GetObjectCommand({
        Bucket: 'rr-digital-products',
        Key: r2Key,
      });
      const r2Response = await r2Client.send(command);

      if (r2Response.Body) {
        // @ts-ignore - transformToString is available in the SDK
        const html = await r2Response.Body.transformToString();

        return new NextResponse(html, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'private, no-store',
            'X-Content-Source': 'r2',
            'X-Variant': variant,
          },
        });
      }
    } catch (r2Err: any) {
      // R2 miss or error — fall through to Supabase fallback
      console.log(`[api/read] R2 miss for ${r2Key}, falling back to Supabase`);
    }

    // 2. FALLBACK: Supabase Storage (legacy location)
    const { data: fileData, error: storageError } = await storageClient
      .storage
      .from('enhanced-readers')
      .download(legacyFileName);

    if (!storageError && fileData) {
      const html = await fileData.text();

      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'private, no-store',
          'X-Content-Source': 'supabase-storage',
          'X-Variant': variant,
        },
      });
    }

    console.warn(`[api/read] Published HTML not found for ${sourceId} (${variant}) in R2 or Supabase`);
    return NextResponse.json(
      { error: 'Published edition not yet available', sourceId, variant },
      { status: 404 }
    );
  } catch (err: any) {
    console.error('[api/read] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
