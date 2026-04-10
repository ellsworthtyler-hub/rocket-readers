// lib/data.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Singleton client
let supabaseInstance: ReturnType<typeof createClient> | null = null;
export const supabase = supabaseInstance || (supabaseInstance = createClient(supabaseUrl, supabaseAnonKey));

// lib/data.ts  ← replace your loadBooks with this exact version

let booksCache: Book[] = [];

export interface Book {
  id: string;
  title: string;
  author?: string;
  dolch: string;        // e.g. "57.0"
  fry: string;          // e.g. "71.2"
  dialogRatio: string;
  fleschGrade: string;
}

export async function loadBooks(): Promise<Book[]> {
  if (booksCache.length > 0) {
    console.log(`📦 Returning ${booksCache.length} books from cache`);
    return booksCache;
  }

  console.log("🔍 Loading library from Supabase archive table...");

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
    .limit(10000);

  if (error) {
    console.error("Supabase error:", error);
    return [];
  }

  booksCache = (data || []).map((row: any) => ({
    id: row.id?.toString() || "",
    title: row.title || "Untitled",
    author: row.author || "Unknown",

    dolch: parseFloat(row.dolch_density || "0").toFixed(1),
    fry: parseFloat(row.fry_density || "0").toFixed(1),

    dialogRatio: parseFloat(row.dialog_ratio || "0").toFixed(1),
    fleschGrade: parseFloat(row.flesch_grade || "0").toFixed(1),
  }));

  console.log(`✅ Loaded ${booksCache.length} books with REAL metrics. Sample:`, 
    booksCache[0] ? {
      title: booksCache[0].title.slice(0, 60) + "...",
      dolch: booksCache[0].dolch + "%",
      fry: booksCache[0].fry + "%",
    } : "No books"
  );

  return booksCache;
}

export async function getBookById(id: string): Promise<Book | null> {
  const books = await loadBooks();
  return books.find(book => book.id === id) || null;
}