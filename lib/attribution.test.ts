import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  attributionFromCookieHeader,
  attributionMetadata,
  buildAttribution,
  serializeAttribution,
} from './attribution';

const now = new Date('2026-10-23T14:00:00Z');

test('captures UTM params, external referrer and landing path', () => {
  const a = buildAttribution(
    new URL('https://www.rocketreaders.us/book/21399?utm_source=x&utm_medium=social&utm_campaign=fall&foo=1'),
    'https://t.co/abc?q=1',
    now
  );
  assert.deepEqual(a, {
    utm_source: 'x',
    utm_medium: 'social',
    utm_campaign: 'fall',
    referrer: 'https://t.co/abc',
    landing_path: '/book/21399',
    first_seen: '2026-10-23T14:00:00.000Z',
  });
});

test('ignores internal referrer', () => {
  const a = buildAttribution(new URL('https://www.rocketreaders.us/'), 'https://www.rocketreaders.us/search', now);
  assert.equal(a.referrer, undefined);
});

test('round-trips through the cookie header into prefixed Stripe metadata', () => {
  const a = buildAttribution(new URL('https://www.rocketreaders.us/?utm_source=news%20letter'), '', now);
  const header = `sb=1; rr_attr=${serializeAttribution(a)}; other=2`;
  assert.deepEqual(attributionMetadata(attributionFromCookieHeader(header)), {
    attr_utm_source: 'news letter',
    attr_landing_path: '/',
    attr_first_seen: '2026-10-23T14:00:00.000Z',
  });
});

test('bad or missing cookie yields no metadata', () => {
  assert.deepEqual(attributionMetadata(attributionFromCookieHeader('rr_attr=%7Bnope')), {});
  assert.deepEqual(attributionMetadata(attributionFromCookieHeader(null)), {});
});
