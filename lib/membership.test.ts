import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planFromPrice, profileIsPaid } from './plans.ts';
import { isValidStudentCode, normalizeStudentCode } from './studentCode.ts';
import { readStudentCookie, signStudentCookie } from './studentCookie.ts';

describe('class codes', () => {
  it('accepts a fruit-number code and ignores case and spaces', () => {
    assert.equal(normalizeStudentCode('  Apple-12 '), 'apple-12');
    assert.equal(normalizeStudentCode('Apple 12'), 'apple-12');
    assert.equal(isValidStudentCode('apple-12'), true);
    assert.equal(isValidStudentCode('fruit-number'), true);
  });

  it('rejects codes that are hard to say or easy to confuse with a normal password', () => {
    assert.equal(isValidStudentCode('password'), false);
    assert.equal(isValidStudentCode('a-1'), false);
    assert.equal(isValidStudentCode('-apple-12'), false);
    assert.equal(isValidStudentCode('apple--12'), false);
  });
});

describe('paid access', () => {
  it('treats active premium and teacher as paid, and past_due as not paid', () => {
    assert.equal(profileIsPaid({ plan: 'premium', subscription_status: 'active' }), true);
    assert.equal(profileIsPaid({ plan: 'teacher', subscription_status: 'trialing' }), true);
    assert.equal(profileIsPaid({ plan: 'teacher', subscription_status: 'past_due' }), false);
    assert.equal(profileIsPaid({ plan: 'free', subscription_status: 'active' }), false);
    assert.equal(profileIsPaid(null), false);
  });

  it('maps the teacher price, the premium price, and the retired test prices', () => {
    process.env.STRIPE_PRICE_ID_TEACHER_MONTHLY = 'price_teacher';
    process.env.STRIPE_PRICE_ID_PREMIUM_MONTHLY = 'price_premium';
    assert.equal(planFromPrice('price_teacher'), 'teacher');
    assert.equal(planFromPrice('price_premium'), 'premium');
    assert.equal(planFromPrice('price_unknown', 'teacher'), 'teacher');
    assert.equal(planFromPrice('price_1TM1gWRoSh753D3K2hcIDzSP'), 'premium');
    assert.equal(planFromPrice('price_other'), null);
  });
});

describe('student cookie', () => {
  it('round-trips a profile id and rejects a bad signature or an expired cookie', () => {
    process.env.STUDENT_COOKIE_SECRET = 'test-secret';
    const now = Date.parse('2026-09-21T00:00:00Z');
    const token = signStudentCookie('profile-1', now);
    assert.equal(readStudentCookie(token, now + 1000), 'profile-1');
    assert.equal(readStudentCookie(`${token}x`, now + 1000), null);
    assert.equal(readStudentCookie(token, now + 31 * 24 * 60 * 60 * 1000), null);
  });
});
