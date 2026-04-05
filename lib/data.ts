// lib/data.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Book {
  id: string;
  title: string;
  author: string;
  dolchBreadth: string;
  dolchSight?: string;      // optional
  frySight: string;
  fleschGrade: string;
  fleschEase: string;       // now optional in mapping
  dialogRatio: string;
  html?: string;
}

let booksCache: Book[] = [];

export async function loadBooks(): Promise<Book[]> {
  if (booksCache.length > 0) return booksCache;

  const { data, error } = await supabase
    .from('books')
    .select('id, title, author, dolch_breadth, dolch_sight, fry_sight, flesch_grade, flesch_ease, dialog_ratio')
    .limit(10000);

  if (error) {
    console.error("Supabase error:", error.message);
    return [];
  }

  booksCache = data.map((row: any) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    dolchBreadth: row.dolch_breadth || "N/A",
    dolchSight: row.dolch_sight || "N/A",
    frySight: row.fry_sight || "N/A",
    fleschGrade: row.flesch_grade || "N/A",
    fleschEase: row.flesch_ease || "N/A",
    dialogRatio: row.dialog_ratio || "N/A",
  }));

  console.log(`✅ Loaded ${booksCache.length} books from Supabase`);
  return booksCache;
}

export async function getBookById(id: string) {
  const all = await loadBooks();
  return all.find(b => b.id === id);
}
