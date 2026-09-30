// Speakable class codes for early customers: a fruit plus a two-digit number, like apple-12.
const FRUITS = [
  'apple', 'apricot', 'banana', 'berry', 'cherry', 'coconut', 'fig', 'grape',
  'guava', 'kiwi', 'lemon', 'lime', 'mango', 'melon', 'orange', 'papaya',
  'peach', 'pear', 'plum', 'pumpkin', 'raisin',
];

export function normalizeStudentCode(input: string): string {
  return input.trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-');
}

export function isValidStudentCode(code: string): boolean {
  return /^[a-z0-9][a-z0-9-]{2,18}[a-z0-9]$/.test(code)
    && code.includes('-')
    && !code.includes('--');
}

export function randomStudentCode(): string {
  const word = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const number = 10 + Math.floor(Math.random() * 90);
  return `${word}-${number}`;
}

export function randomFallbackStudentCode(): string {
  const word = FRUITS[Math.floor(Math.random() * FRUITS.length)];
  const number = 100 + Math.floor(Math.random() * 900);
  return `${word}-${number}`;
}
