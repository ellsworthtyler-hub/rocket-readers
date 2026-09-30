import {
  isValidStudentCode,
  normalizeStudentCode,
  randomFallbackStudentCode,
  randomStudentCode,
} from './studentCode';
import { supabaseAdmin } from './supabaseAdmin';

async function codeTaken(code: string, exceptUserId?: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('student_code', code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return false;
  return data.id !== exceptUserId;
}

async function pickAvailableCode(): Promise<string> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = randomStudentCode();
    if (!(await codeTaken(code))) return code;
  }
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const code = randomFallbackStudentCode();
    if (!(await codeTaken(code))) return code;
  }
  throw new Error('Could not generate a class code');
}

export async function ensureStudentCode(userId: string, existing: string | null): Promise<string> {
  if (existing) return existing;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = await pickAvailableCode();
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ student_code: code, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .is('student_code', null);
    if (!error) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('student_code')
        .eq('id', userId)
        .maybeSingle();
      if (data?.student_code) return data.student_code;
    } else if (error.code !== '23505') {
      throw new Error(error.message);
    }
  }

  throw new Error('Could not save a class code');
}

async function writeCode(userId: string, code: string): Promise<'ok' | 'taken'> {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ student_code: code, updated_at: new Date().toISOString() })
    .eq('id', userId);
  if (!error) return 'ok';
  if (error.code === '23505') return 'taken';
  throw new Error(error.message);
}

export async function replaceStudentCode(
  userId: string,
  requested?: string
): Promise<{ code?: string; error?: 'invalid' | 'taken' }> {
  if (requested) {
    const code = normalizeStudentCode(requested);
    if (!isValidStudentCode(code)) return { error: 'invalid' };
    if (await codeTaken(code, userId)) return { error: 'taken' };
    const wrote = await writeCode(userId, code);
    return wrote === 'taken' ? { error: 'taken' } : { code };
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = await pickAvailableCode();
    const wrote = await writeCode(userId, code);
    if (wrote === 'ok') return { code };
  }
  throw new Error('Could not save a class code');
}
