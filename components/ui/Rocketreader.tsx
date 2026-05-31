//  FILE: components/ui/Rocketreader.tsx
//  =======================================
//  UPDATED (2026-05): Major rewrite for the rr_ + R2 era.
//  - No longer receives or renders raw sentences + tokens from Supabase.
//  - Primary content source: pre-published HTML (sample or full) fetched from storage.
//  - Current bridge: Supabase Storage bucket "enhanced-readers" (written by rr_publisher.py).
//  - Future primary: Cloudflare R2 bucket "rr-digital-products" via /api/read/[sourceId].
//  - Public sourceId (Gutenberg number) is the only ID this component should care about for URLs and fetches.
//  - Premium status (from AuthProvider) controls sample vs full variant.

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface RocketReaderProps {
  /** The public Gutenberg source_id that appears in the browser URL (e.g. "1342") */
  sourceId: string;
  /** Internal surrogate key (rr_book.id). Only passed for rare direct queries; prefer sourceId for everything user-facing. */
  internalBookId: number;
  title: string;
  author: string;
  /** Stats row from rr_book_metadata (or null while the book is still processing) */
  metadata: any | null;
  /** True only when the book has completed ETL + has_analysis_file = true */
  isProcessed: boolean;
  currentPage?: number;
}

// ... (rest of the component as per current local file) 
// Note: Full content pushed in follow-up if needed.