//  FILE: lib/data.ts
//  ===========================
//  Updated to use the new rr_ schema (rr_book_metadata + rr_book)
//  Only returns books that have been processed through the new pipeline.
import { supabase } from './supabaseClient'; 

export async function loadBooks(limit: number = 100) {
  console.log("\ud83d\udce1 Fetching processed books from rr_book_metadata...");

  // We only need the direct columns on rr_book (title/author/theme are reliably populated
  // by the rr_ processing pipeline). We deliberately avoid any embedded join to gutenberg_catalog
  // because no foreign key relationship exists between rr_book and that legacy table.
  const { data, error } = await supabase
    .from('rr_book_metadata')
    .select(`
      book_id,
      total_words,
      unique_words,
      flesch_reading_ease,
      dialog_percentage,
      dolch_percentage,  
      fry_percentage,    
      rr_book!inner (
        id,
        source_id,
        title,
        author,
        theme
      )
    `)
    // Only show books that have actually been processed through the new pipeline
    .not('last_processed', 'is', null)
    .order('book_id', { ascending: true })
    .limit(limit); 

  if (error) {
    console.error("\u274c Supabase error in loadBooks():", error);
    return [];
  }

  console.log(`\u2705 Successfully loaded ${data?.length || 0} processed books from rr_book_metadata!`);

  return (data || []).map((book: any) => {
    const rrBook = Array.isArray(book.rr_book) ? book.rr_book[0] : book.rr_book;

    const publicBookId = rrBook?.source_id || book.book_id?.toString();

    return {
      id: publicBookId,
      title: rrBook?.title || "Unknown Title",
      author: rrBook?.author || "Unknown Author",
      theme: rrBook?.theme || "Uncategorized",
      
      dialogRatio: book.dialog_percentage?.toString() || "0",
      fleschGrade: book.flesch_reading_ease?.toString() || "0",
      
      dolch: book.dolch_percentage?.toString() || "0",
      fry: book.fry_percentage?.toString() || "0"
    };
  });
}

/**
 * Returns ALL processed books from the new pipeline (rr_book_metadata + rr_book).
 * Use this for Search, Leaderboard, and any page that needs the full filterable list.
 * We deliberately fetch a high limit because the number of fully processed books
 * will grow over time but is still modest today.
 */
export async function getAllProcessedBooks() {
  console.log("\ud83d\udce1 Fetching ALL processed books from rr_book_metadata...");

  const { data, error } = await supabase
    .from('rr_book_metadata')
    .select(`
      book_id,
      total_words,
      unique_words,
      flesch_reading_ease,
      dialog_percentage,
      dolch_percentage,  
      fry_percentage,    
      rr_book!inner (
        id,
        source_id,
        title,
        author,
        theme
      )
    `)
    .not('last_processed', 'is', null)
    .order('book_id', { ascending: true })
    .limit(5000);   // generous ceiling while we are in the early processing phase

  if (error) {
    console.error("\u274c Supabase error in getAllProcessedBooks():", error);
    return [];
  }

  console.log(`\u2705 Successfully loaded ${data?.length || 0} processed books (full list)`);

  return (data || []).map((book: any) => {
    const rrBook = Array.isArray(book.rr_book) ? book.rr_book[0] : book.rr_book;

    const publicBookId = rrBook?.source_id || book.book_id?.toString();

    return {
      id: publicBookId,
      title: rrBook?.title || "Unknown Title",
      author: rrBook?.author || "Unknown Author",
      theme: rrBook?.theme || "Uncategorized",
      
      dialogRatio: book.dialog_percentage?.toString() || "0",
      fleschGrade: book.flesch_reading_ease?.toString() || "0",
      
      dolch: book.dolch_percentage?.toString() || "0",
      fry: book.fry_percentage?.toString() || "0"
    };
  });
}

export async function getGlobalStats() {
  const { data, count, error } = await supabase
    .from('rr_book_metadata')
    .select('dolch_percentage, fry_percentage', { count: 'exact' })
    .not('last_processed', 'is', null);   // only processed books

  if (error) {
    console.error("\u274c Supabase error in getGlobalStats():", error);
    return { totalBooks: 0, avgDolch: 0, avgFry: 0 };
  }

  if (!data || data.length === 0) {
    console.log("\u2139\ufe0f getGlobalStats(): No processed rows found with last_processed IS NOT NULL");
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