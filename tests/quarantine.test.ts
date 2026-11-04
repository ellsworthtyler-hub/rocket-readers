import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
const expect = (v: unknown) => ({ toBe: (e: unknown) => assert.equal(v, e), not: { toBe: (e: unknown) => assert.notEqual(v, e) } });
import { isQuarantinedSourceId, quarantineKey } from '@/lib/contentQuarantine';

describe('static quarantine is Gutenberg-only', () => {
  it('blocks known Gutenberg ids', () => {
    expect(isQuarantinedSourceId('9001')).toBe(true);
    expect(isQuarantinedSourceId(12701, 'gutenberg')).toBe(true);
  });
  it('does not apply Gutenberg lists to other sources sharing the id', () => {
    expect(isQuarantinedSourceId('9001', 'wikisource')).toBe(false);
    expect(isQuarantinedSourceId('12701', 'wikibooks')).toBe(false);
  });
  it('keys keep source and leading zeros', () => {
    expect(quarantineKey('gutenberg_au', '010001')).toBe('gutenberg_au:010001');
    expect(quarantineKey('gutenberg', 42)).not.toBe(quarantineKey('wikisource', 42));
  });
});
