// Streams a classwork packet PDF from Cloudflare R2.
// Keys are {sourceId}_cosmic_packet.pdf in the rr-digital-products bucket.

import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { resolvePaidAccess } from '@/lib/access';

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
  if (!/^\d+$/.test(sourceId || '')) {
    return NextResponse.json({ error: 'Missing book id' }, { status: 400 });
  }

  const access = await resolvePaidAccess(req);
  if (!access.paid) {
    return NextResponse.json(
      { error: 'Classwork packets are part of Premium and Teacher.' },
      { status: 401 }
    );
  }

  const key = `${sourceId}_cosmic_packet.pdf`;
  try {
    const response = await r2Client.send(new GetObjectCommand({
      Bucket: 'rr-digital-products',
      Key: key,
    }));
    if (!response.Body) {
      return NextResponse.json({ error: 'Packet file was empty', sourceId }, { status: 404 });
    }

    const bytes = await response.Body.transformToByteArray();
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${sourceId}_cosmic_packet.pdf"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Source': 'r2',
      },
    });
  } catch (err: unknown) {
    const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : '';
    if (name === 'NoSuchKey' || name === 'NotFound') {
      return NextResponse.json(
        { error: 'This classwork packet has not been published yet.', sourceId },
        { status: 404 }
      );
    }
    console.error(`[api/packets] R2 error for ${key}`);
    return NextResponse.json({ error: 'Could not open the packet from Cloudflare.' }, { status: 502 });
  }
}
