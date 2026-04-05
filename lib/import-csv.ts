// lib/import-csv.ts
import fs from 'fs/promises';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://mckxrkpmlgbgyaujhbuu.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ja3hya3BtbGdiZ3lhdWpoYnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyODMzNjUsImV4cCI6MjA5MDg1OTM2NX0.ebEMrdZgKzLLzvnrihtKE0Oui807nqyLcWp6iMIlkVw";

const supabase = createClient(supabaseUrl, supabaseKey);

async function importCSV() {
  const csvText = await fs.readFile('./public/gutenberg_metadata.csv', 'utf-8');
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });

  console.log(`📊 Parsed ${result.data.length} rows from CSV`);

  const books = result.data
    .filter((row: any) => row["Etext Number"] && row["Title"])
    .map((row: any) => ({
      id: String(row["Etext Number"]),
      title: row["Title"],
      author: row["Authors"] || "Unknown",
      dolch_breadth: row["dolch_prek_breadth"] || null,
      fry_sight: row["Fry Sight Word Breadth"] || null,
      flesch_grade: row["Flesch_Kincaid Grade Score"] || null,
      dialog_ratio: row["Dialog Ratio"] || null,
    }));

  console.log(`📤 Upserting ${books.length} books to Supabase...`);

  const { error } = await supabase
    .from('books')
    .upsert(books, { onConflict: 'id' });

  if (error) {
    console.error("❌ Supabase error:", error.message);
  } else {
    console.log(`✅ SUCCESS! Imported ${books.length} books to Supabase!`);
  }
}

importCSV().catch(console.error);
