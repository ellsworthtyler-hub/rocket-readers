import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { bookHref, parseBookRef, wikiHistoryUrl, enabledExtraSources, isSourceEnabled } from '@/lib/bookSources';
import { qaRowServable } from '@/lib/bookEligibility';

describe('book refs', () => {
  it('keeps Gutenberg URLs unchanged', () => {
    assert.deepEqual(parseBookRef('1342'), { source: 'gutenberg', sourceId: '1342' });
    assert.equal(bookHref('gutenberg', '1342'), '/book/1342');
    assert.equal(bookHref(undefined, 11), '/book/11');
  });
  it('parses and builds prefixed refs, keeping leading zeros', () => {
    assert.deepEqual(parseBookRef('wikisource-998065'), { source: 'wikisource', sourceId: '998065' });
    assert.deepEqual(parseBookRef('wikibooks-100121'), { source: 'wikibooks', sourceId: '100121' });
    assert.deepEqual(parseBookRef('pgau-010001'), { source: 'gutenberg_au', sourceId: '010001' });
    assert.equal(bookHref('wikisource', '100'), '/book/wikisource-100');
    assert.equal(bookHref('gutenberg_au', '010001'), '/book/pgau-010001');
  });
  it('rejects unknown refs', () => {
    for (const bad of ['', 'abc', 'gutenberg-1', 'wikisource-', 'wikisource-1a', '12345678901', '../1', 'WIKISOURCE-1']) {
      assert.equal(parseBookRef(bad), null, bad);
    }
  });
  it('round-trips', () => {
    for (const [s, id] of [['gutenberg', '9'], ['wikisource', '5'], ['wikibooks', '77'], ['gutenberg_au', '0700001']] as const) {
      assert.deepEqual(parseBookRef(bookHref(s, id).slice('/book/'.length)), { source: s, sourceId: id });
    }
  });
  it('builds contributor history links', () => {
    assert.equal(
      wikiHistoryUrl('https://en.wikisource.org/wiki/John_Silence%2C_Physician_Extraordinary'),
      'https://en.wikisource.org/w/index.php?title=John_Silence%2C_Physician_Extraordinary&action=history'
    );
    assert.equal(wikiHistoryUrl(null), null);
  });
});

describe('feature flags + eligibility', () => {
  const pass = { s4b_status: 'pass', s4c_status: 'pass', s4d_status: 'pass', rights_status: 'pending', quarantined: false };
  it('defaults to Wikisource only; PGA gate off', () => {
    delete process.env.NEXT_PUBLIC_EXTRA_SOURCES;
    delete process.env.NEXT_PUBLIC_PGAU_US_PD_GATE;
    assert.deepEqual(enabledExtraSources(), ['wikisource']);
    assert.equal(isSourceEnabled('wikibooks'), false);
    assert.equal(qaRowServable('wikisource', pass), true);
    assert.equal(qaRowServable('wikibooks', pass), false);
  });
  it('requires QA 4b-4d pass and not quarantined', () => {
    process.env.NEXT_PUBLIC_EXTRA_SOURCES = 'wikisource,wikibooks';
    assert.equal(qaRowServable('wikibooks', pass), true);
    assert.equal(qaRowServable('wikibooks', { ...pass, s4d_status: 'needs_human' }), false);
    assert.equal(qaRowServable('wikisource', { ...pass, quarantined: true }), false);
    assert.equal(qaRowServable('wikisource', null), false);
  });
  it('never serves PGA unless the US-PD gate is on and rights pass', () => {
    process.env.NEXT_PUBLIC_EXTRA_SOURCES = 'wikisource,wikibooks,gutenberg_au';
    assert.equal(isSourceEnabled('gutenberg_au'), false);
    assert.equal(qaRowServable('gutenberg_au', { ...pass, rights_status: 'pass' }), false);
    process.env.NEXT_PUBLIC_PGAU_US_PD_GATE = 'on';
    assert.equal(qaRowServable('gutenberg_au', pass), false);
    assert.equal(qaRowServable('gutenberg_au', { ...pass, rights_status: 'pass' }), true);
    delete process.env.NEXT_PUBLIC_PGAU_US_PD_GATE;
    delete process.env.NEXT_PUBLIC_EXTRA_SOURCES;
  });
});
