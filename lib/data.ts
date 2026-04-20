//  FILE: lib/data.ts
//  ===========================
import { supabase } from './supabaseClient'; 

export async function loadBooks() {
  console.log("📡 Fetching fully processed books from Supabase...");

  const { data, error } = await supabase
    .from('book_metadata')
    .select(`
      book_id,
      total_words,
      unique_words,
      flesch_reading_ease,
      dialog_percentage,
      dolch_percentage,  
      fry_percentage,    
      gutenberg_catalog (
        title,
        author,
        subjects
      )
    `)
    .order('book_id', { ascending: true })
    .limit(100); 

  if (error) {
    console.error("❌ Supabase error:", error);
    return [];
  }

  console.log(`✅ Successfully loaded ${data.length} processed books!`);

  return data.map((book: any) => ({
    id: book.book_id.toString(), 
    title: book.gutenberg_catalog?.title || "Unknown Title",
    author: book.gutenberg_catalog?.author || "Unknown Author",
    
    dialogRatio: book.dialog_percentage?.toString() || "0",
    fleschGrade: book.flesch_reading_ease?.toString() || "0",
    
    // Grabbing the newly calculated metrics!
    dolch: book.dolch_percentage?.toString() || "0",
    fry: book.fry_percentage?.toString() || "0"
  }));
}

export async function getGlobalStats() {
  const { data, count, error } = await supabase
    .from('book_metadata')
    .select('dolch_percentage, fry_percentage', { count: 'exact' });

  if (error || !data || data.length === 0) {
    return { totalBooks: 0, avgDolch: 0, avgFry: 0 };
  }

  const totalDolch = data.reduce((sum, book) => sum + (book.dolch_percentage || 0), 0);
  const totalFry = data.reduce((sum, book) => sum + (book.fry_percentage || 0), 0);

  return {
    totalBooks: count || data.length,
    avgDolch: (totalDolch / data.length).toFixed(1),
    avgFry: (totalFry / data.length).toFixed(1)
  };
}