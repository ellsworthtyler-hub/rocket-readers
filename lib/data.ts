// lib/data.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let supabaseInstance: ReturnType<typeof createClient> | null = null;
export const supabase = supabaseInstance || (supabaseInstance = createClient(supabaseUrl, supabaseAnonKey));

export interface Book {
  id: string;
  title: string;
  author?: string;
  dolch: string;
  fry: string;
  dialogRatio: string;
  fleschGrade: string;
}

export async function loadBooks(): Promise<Book[]> {
  console.log("🔍 Loading FULL library from Supabase archive table...");

  const { data, error } = await supabase
    .from("archive")
    .select(`
      id,
      title,
      author,
      dolch_density,
      fry_density,
      dialog_ratio,
      flesch_grade
    `)
    .not("dolch_density", "is", null)
    .order("dolch_density", { ascending: false })
    .limit(70000);   // ← THIS IS THE FIX — forces full 61k+

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  const books = (data || []).map((row: any) => ({
    id: row.id?.toString() || "",
    title: row.title || "Untitled",
    author: row.author || "Unknown",
    dolch: parseFloat(row.dolch_density || "0").toFixed(1),
    fry: parseFloat(row.fry_density || "0").toFixed(1),
    dialogRatio: parseFloat(row.dialog_ratio || "0").toFixed(1),
    fleschGrade: parseFloat(row.flesch_grade || "0").toFixed(1),
  }));

  console.log(`✅ LOADED FULL ARCHIVE: ${books.length.toLocaleString()} books with REAL metrics`);
  return books;
}

export async function getBookById(id: string): Promise<Book | null> {
  const books = await loadBooks();
  return books.find(book => book.id === id) || null;
}