// lib/r2.ts — Cloudflare R2 (S3-compatible) helpers for digital products
import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const R2_PRODUCTS_BUCKET = 'rr-digital-products';

let _client: S3Client | null = null;

function getR2Client(): S3Client | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn('[r2] Missing CLOUDFLARE_ACCOUNT_ID / R2 credentials — R2 disabled');
    return null;
  }

  if (!_client) {
    _client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return _client;
}

async function streamToString(body: unknown): Promise<string> {
  if (!body) return '';
  // Node.js Readable / web stream from AWS SDK
  if (typeof (body as { transformToString?: () => Promise<string> }).transformToString === 'function') {
    return (body as { transformToString: () => Promise<string> }).transformToString();
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) return Buffer.alloc(0);
  if (typeof (body as { transformToByteArray?: () => Promise<Uint8Array> }).transformToByteArray === 'function') {
    const arr = await (body as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
    return Buffer.from(arr);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/** Fetch object body as UTF-8 text. Returns null if missing or R2 unavailable. */
export async function getR2Text(key: string, bucket = R2_PRODUCTS_BUCKET): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    if (!res.Body) return null;
    return await streamToString(res.Body);
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    if (name === 'NoSuchKey' || name === 'NotFound') return null;
    console.warn(`[r2] getR2Text failed for ${key}:`, err);
    return null;
  }
}

/** Fetch object as Buffer. Returns null if missing. */
export async function getR2Buffer(key: string, bucket = R2_PRODUCTS_BUCKET): Promise<Buffer | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );
    if (!res.Body) return null;
    return await streamToBuffer(res.Body);
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;
    if (name === 'NoSuchKey' || name === 'NotFound') return null;
    console.warn(`[r2] getR2Buffer failed for ${key}:`, err);
    return null;
  }
}

/** True if object exists. */
export async function r2ObjectExists(key: string, bucket = R2_PRODUCTS_BUCKET): Promise<boolean> {
  const client = getR2Client();
  if (!client) return false;
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** Short-lived presigned GET URL for private R2 objects. */
export async function getR2PresignedGetUrl(
  key: string,
  expiresInSeconds = 300,
  bucket = R2_PRODUCTS_BUCKET
): Promise<string | null> {
  const client = getR2Client();
  if (!client) return null;

  try {
    const exists = await r2ObjectExists(key, bucket);
    if (!exists) return null;

    return await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: expiresInSeconds }
    );
  } catch (err) {
    console.warn(`[r2] presign failed for ${key}:`, err);
    return null;
  }
}

export function isValidSourceId(sourceId: string): boolean {
  return /^\d{1,10}$/.test(sourceId);
}
