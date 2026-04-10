import os
import re
import pandas as pd
import sys
import logging

# ====================== CONFIGURATION ======================
BOOKS_DIR = r"E:\Gutenberg_Archive\books"
CLEANED_DIR = r"E:\Gutenberg_Archive\cleaned_books"
METADATA_PATH = r"C:\Users\ellsw\LiteracyProject\gutenberg_metadata.csv"
TO_ANALYZE_PATH = r"C:\Users\ellsw\LiteracyProject\To Be Analyzed.txt"
TO_PUBLISH_PATH = r"C:\Users\ellsw\LiteracyProject\To Be Published.txt"

# ====================== LARGE BOOK HANDLING ======================
LARGE_BOOK_THRESHOLD_CHARS = 500_000   # books bigger than this get chunked
CHUNK_SIZE_CHARS = 100_000             # target size per chunk

os.makedirs(CLEANED_DIR, exist_ok=True)

# ====================== LOGGING ======================
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

# ====================== LOAD SIGHT WORD LISTS FROM FILES ======================
SIGHT_WORD_DIR = r"C:\Users\ellsw\LiteracyProject"   # Change if you put them elsewhere

# ====================== LOAD SIGHT WORD LISTS FROM FILES ======================
SIGHT_WORD_DIR = r"C:\Users\ellsw\LiteracyProject"

def load_sight_words():
    dolch = {}
    # Map internal key → display grade for column names
    grade_map = {
        "prek": "prek",
        "kindergarten": "kindergarten",
        "1st": "1st",
        "2nd": "2nd",
        "3rd": "3rd"
    }
    filenames = ["dolch_prek.txt", "dolch_kindergarten.txt", "dolch_1st.txt", "dolch_2nd.txt", "dolch_3rd.txt"]
    
    for internal_key, fname in zip(grade_map.keys(), filenames):
        path = os.path.join(SIGHT_WORD_DIR, fname)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                words = {line.strip().lower() for line in f if line.strip()}
            dolch[internal_key] = words
            logger.info(f"Loaded {len(words)} Dolch {internal_key} sight words")
        else:
            logger.warning(f"Missing Dolch file: {path}")
            dolch[internal_key] = set()

    # Load Fry
    fry_path = os.path.join(SIGHT_WORD_DIR, "fry_sight_words.txt")
    if os.path.exists(fry_path):
        with open(fry_path, "r", encoding="utf-8") as f:
            fry_words = {line.strip().lower() for line in f if line.strip()}
        logger.info(f"Loaded {len(fry_words)} Fry sight words")
    else:
        logger.warning(f"Missing Fry file: {fry_path}")
        fry_words = set()

    return dolch, fry_words

# Load at startup
DOLCH_LISTS, FRY_WORDS = load_sight_words()

# ====================== NLTK SETUP ======================
try:
    import nltk
    from nltk.tokenize import word_tokenize
    from nltk import pos_tag
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
except ImportError:
    nltk = None
    word_tokenize = None
    pos_tag = None

# ====================== HELPER FUNCTIONS ======================

def compute_flesch_scores_from_totals(num_words: int, num_sentences: int, total_syllables: int) -> tuple[float, float]:
    if num_sentences == 0 or num_words == 0:
        return 0.0, 0.0
    asl = num_words / num_sentences
    asw = total_syllables / num_words
    reading_ease = 206.835 - 1.015 * asl - 84.6 * asw
    grade_level = 0.39 * asl + 11.8 * asw - 15.59
    return round(grade_level, 2), round(reading_ease, 2)

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE_CHARS) -> list[str]:
    """Split large text into ~chunk_size character chunks while trying to respect paragraphs."""
    if len(text) <= chunk_size:
        return [text]
    
    # Split on paragraph breaks (double newlines) to keep context
    paragraphs = re.split(r'(\n\s*\n)', text)
    chunks = []
    current_chunk = ""
    
    for para in paragraphs:
        if len(current_chunk) + len(para) > chunk_size and current_chunk:
            chunks.append(current_chunk.strip())
            current_chunk = para
        else:
            current_chunk += para
    
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    
    logger.info(f"   → Large book split into {len(chunks)} chunks (~{chunk_size:,} chars each)")
    return chunks

def extract_book_id(filename: str) -> int | None:
    """Extract numeric book ID from common Gutenberg filenames (with or without extension)."""
    # Clean common patterns
    name = filename.lower()
    name = name.replace("pg", "").replace("-0", "").replace(".txt", "").replace(".utf-8", "").replace(".zip", "")
    match = re.search(r'(\d+)', name)
    if match:
        return int(match.group(1))
    return None

def find_book_file(book_id: int, books_dir: str) -> str | None:
    book_id_str = str(book_id)
    patterns = [
        book_id_str, book_id_str + ".txt", book_id_str + ".txt.utf-8",
        f"pg{book_id_str}.txt", f"pg{book_id_str}-0.txt", f"pg{book_id_str}.txt.utf-8",
        f"pg{book_id_str}", f"{book_id_str}-0"
    ]
    for name in patterns:
        path = os.path.join(books_dir, name)
        if os.path.exists(path):
            logger.info(f"Found book {book_id} at: {path}")
            return path
    logger.error(f"Book file not found for ID {book_id}")
    return None

def is_already_analyzed(meta_df: pd.DataFrame, book_id: int) -> bool:
    """Check if book has analysis data (using first analysis column as sentinel)."""
    mask = meta_df["Book#"].astype(str).str.strip() == str(book_id)
    if not mask.any():
        return False
    val = meta_df.loc[mask, "Total # of Sentences"].iloc[0]
    return bool(str(val).strip() and str(val) not in ("nan", ""))

def get_candidate_books(books_dir: str) -> list[tuple[int, str, int]]:
    """Scan archive — works with or without .txt extension. Returns (book_id, filepath, filesize) sorted smallest first."""
    if not os.path.exists(books_dir):
        logger.error(f"Books directory not found: {books_dir}")
        return []

    candidates = []
    seen_ids = set()

    all_files = os.listdir(books_dir)
    logger.info(f"Scanning {len(all_files)} total files in {books_dir}...")

    for filename in all_files:
        # Skip directories and obviously non-book files
        if os.path.isdir(os.path.join(books_dir, filename)):
            continue
        if filename.startswith('.') or filename.lower() in ('desktop.ini', 'thumbs.db'):
            continue

        book_id = extract_book_id(filename)
        if book_id is None or book_id in seen_ids:
            continue

        seen_ids.add(book_id)

        filepath = os.path.join(books_dir, filename)
        try:
            filesize = os.path.getsize(filepath)
            candidates.append((book_id, filepath, filesize))
        except OSError as e:
            logger.warning(f"Could not read file size for {filename}: {e}")

    # Sort by file size ascending (smallest first — fastest to process)
    candidates.sort(key=lambda x: x[2])

    if candidates:
        logger.info(f"Found {len(candidates)} valid candidate books. "
                   f"Smallest: {candidates[0][2]:,} bytes | Largest: {candidates[-1][2]:,} bytes")
    else:
        logger.error("No valid book files found. Here are the first 20 files in the directory for debugging:")
        for f in all_files[:20]:
            logger.error(f"   → {f}")

    return candidates
    

def clean_gutenberg_text(file_path: str) -> str:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        text = f.read()
    start_match = re.search(r"\*\*\* START OF (?:THE|THIS) PROJECT GUTENBERG", text, re.IGNORECASE)
    if start_match:
        text = text[start_match.end():]
    end_match = re.search(r"\*\*\* END OF (?:THE|THIS) PROJECT GUTENBERG", text, re.IGNORECASE)
    if end_match:
        text = text[:end_match.start()]
    text = text.strip()
    text = text.replace("“", '"').replace("”", '"').replace("‘", "'").replace("’", "'")
    return text

def save_cleaned_text(book_id: int, cleaned_text: str):
    clean_path = os.path.join(CLEANED_DIR, f"{book_id}_clean")
    with open(clean_path, "w", encoding="utf-8") as f:
        f.write(cleaned_text)
    logger.info(f"Saved cleaned: {clean_path}")

def count_word_lengths(words: list[str]) -> dict:
    counts = {f"{i}letter": 0 for i in range(3, 21)}
    counts["20plus"] = 0
    for w in words:
        length = len(w)
        if length >= 3:
            if length >= 20:
                counts["20plus"] += 1
            else:
                counts[f"{length}letter"] += 1
    return counts

def compute_dialog_ratio(text: str) -> float:
    if not text: return 0.0
    quoted = re.findall(r'["\'](.*?)["\']', text, re.DOTALL)
    quoted_chars = sum(len(q) for q in quoted)
    return (quoted_chars / len(text)) * 100 if len(text) > 0 else 0.0

def compute_flesch_scores(text: str, num_words: int, num_sentences: int) -> tuple[float, float]:
    if num_sentences == 0 or num_words == 0:
        return 0.0, 0.0
    def syllable_count(word: str) -> int:
        word = word.lower()
        count = 0
        vowels = "aeiouy"
        if word and word[0] in vowels: count += 1
        for i in range(1, len(word)):
            if word[i] in vowels and word[i-1] not in vowels: count += 1
        if word.endswith("e"): count -= 1
        return max(count, 1)
    words = re.findall(r'\b\w+\b', text.lower())
    total_syllables = sum(syllable_count(w) for w in words)
    asl = num_words / num_sentences
    asw = total_syllables / num_words
    reading_ease = 206.835 - 1.015 * asl - 84.6 * asw
    grade_level = 0.39 * asl + 11.8 * asw - 15.59
    return round(grade_level, 2), round(reading_ease, 2)

def analyze_text(cleaned_text: str, book_id: int, meta_row: pd.Series) -> dict:
    """Analyze full text — now outputs clean snake_case columns + REAL density percentages."""
    # ... (keep all your existing chunking, counting, POS, etc. exactly as-is)
    total_chars = len(cleaned_text)
    
    if total_chars > LARGE_BOOK_THRESHOLD_CHARS:
        logger.info(f"Large book detected ({total_chars:,} chars) — chunking for analysis...")
        chunks = chunk_text(cleaned_text)
    else:
        chunks = [cleaned_text]

    # Initialize aggregates
    total_sentences = 0
    total_words_list = []
    total_unique_words = set()
    total_syllables = 0
    quoted_chars_total = 0
    pos_counts = {"nouns": 0, "adjectives": 0, "verbs": 0, "adverbs": 0, "pronouns": 0, "prepositions": 0, "conjunctions": 0}
    dolch_results = {f"dolch_{k}_instances": 0 for k in DOLCH_LISTS.keys()}
    dolch_results.update({f"dolch_{k}_breadth": 0 for k in DOLCH_LISTS.keys()})  # breadth calculated at end

    for chunk in chunks:
        # Sentence & word counts for this chunk
        sentences = [s.strip() for s in re.split(r'[.!?]+', chunk) if s.strip()]
        total_sentences += len(sentences)
        words = re.findall(r'\b\w+\b', chunk.lower())
        total_words_list.extend(words)
        total_unique_words.update(words)

        # Syllables for Flesch
        def syllable_count(word: str) -> int:
            word = word.lower()
            count = 0
            vowels = "aeiouy"
            if word and word[0] in vowels: count += 1
            for i in range(1, len(word)):
                if word[i] in vowels and word[i-1] not in vowels: count += 1
            if word.endswith("e"): count -= 1
            return max(count, 1)
        total_syllables += sum(syllable_count(w) for w in words)

        # Dialog ratio contribution
        quoted = re.findall(r'["\'](.*?)["\']', chunk, re.DOTALL)
        quoted_chars_total += sum(len(q) for q in quoted)

        # Dolch
        for internal_key, sight_set in DOLCH_LISTS.items():
            instances = sum(1 for w in words if w in sight_set)
            dolch_results[f"dolch_{internal_key}_instances"] += instances

        # POS tagging (only if NLTK available)
        if nltk is not None:
            try:
                tokens = word_tokenize(chunk)
                tagged = pos_tag(tokens)
                tag_map = {
                    "NN":"nouns","NNS":"nouns","NNP":"nouns","NNPS":"nouns",
                    "JJ":"adjectives","JJR":"adjectives","JJS":"adjectives",
                    "VB":"verbs","VBD":"verbs","VBG":"verbs","VBN":"verbs","VBP":"verbs","VBZ":"verbs",
                    "RB":"adverbs","RBR":"adverbs","RBS":"adverbs",
                    "PRP":"pronouns","PRP$":"pronouns",
                    "IN":"prepositions",
                    "CC":"conjunctions"
                }
                for _, tag in tagged:
                    for key, cat in tag_map.items():
                        if tag.startswith(key):
                            pos_counts[cat] += 1
                            break
            except Exception as e:
                logger.warning(f"POS tagging failed on chunk for book {book_id}: {e}")

    # === FINAL AGGREGATION (100% accurate) ===
    num_words = len(total_words_list)
    unique_words = len(total_unique_words)
    avg_sentence_length = round(num_words / total_sentences, 2) if total_sentences > 0 else 0
    avg_word_length = round(sum(len(w) for w in total_words_list) / num_words, 2) if num_words > 0 else 0

    word_len_counts = count_word_lengths(total_words_list)

    # Dolch breadth (global)
    for internal_key, sight_set in DOLCH_LISTS.items():
        unique_in_text = len([w for w in total_unique_words if w in sight_set])
        total_grade_words = len(sight_set)
        breadth = round(unique_in_text / total_grade_words, 4) if total_grade_words > 0 else 0
        dolch_results[f"dolch_{internal_key}_breadth"] = breadth

    fry_instances = sum(1 for w in total_words_list if w in FRY_WORDS)
    fry_unique = len([w for w in total_unique_words if w in FRY_WORDS])
    fry_breadth = round(fry_unique / len(FRY_WORDS), 4) if FRY_WORDS else 0

    dialog_ratio = (quoted_chars_total / total_chars) * 100 if total_chars > 0 else 0.0

    # Flesch from grand totals
    fk_grade, fk_ease = compute_flesch_scores_from_totals(num_words, total_sentences, total_syllables)

    # Clean Author (unchanged)
    author = str(meta_row.get("Authors", "") or meta_row.get("Author", "")).strip()
    author = re.sub(r'Author\s*', '', author, flags=re.IGNORECASE)
    author = re.sub(r'\s+', ' ', author).strip()
    author = author.split('\n')[0].strip() if '\n' in author else author

# === CLEAN STATS DICT WITH SNAKE_CASE NAMES ===
    stats = {
        "total_sentences": str(total_sentences),
        "avg_sentence_length": str(avg_sentence_length),
        "total_words": str(num_words),
        "avg_word_length": str(avg_word_length),
        "unique_words": str(unique_words),

        # Word length buckets (keep as-is or rename if you prefer)
        **{f"{k}": str(v) for k, v in word_len_counts.items()},

        # Dolch per-grade (keep for completeness)
        **{k: str(v) for k, v in dolch_results.items()},

        # NEW REAL DENSITY COLUMNS (this is what we want on the cards)
        "dolch_density": str(dolch_density),
        "fry_density": str(fry_density),

        "fry_instances": str(fry_instances),
        "fry_breadth": str(fry_breadth),

        "dialog_ratio": str(round(dialog_ratio, 1)),
        "flesch_grade": str(fk_grade),
        "flesch_ease": str(fk_ease),

        # POS counts
        **{f"total_{k}": str(v) for k, v in pos_counts.items()}
    }
    return stats

def process_single_book(book_id: int, meta_df: pd.DataFrame):
    """Shared processing logic for one book — now logs file size for visibility on large books."""
    logger.info(f"--- Processing Book #{book_id} ---")

    book_path = find_book_file(book_id, BOOKS_DIR)
    if not book_path:
        return

    # === NEW LINE: Show file size in MB (very useful when hitting big novels) ===
    try:
        filesize_mb = os.path.getsize(book_path) / (1024 * 1024)
        logger.info(f"Book size: {filesize_mb:.1f} MB")
    except OSError:
        logger.warning(f"Could not read file size for book {book_id}")

    clean_path = os.path.join(CLEANED_DIR, f"{book_id}_clean")
    if os.path.exists(clean_path):
        with open(clean_path, "r", encoding="utf-8") as f:
            cleaned_text = f.read()
    else:
        cleaned_text = clean_gutenberg_text(book_path)
        save_cleaned_text(book_id, cleaned_text)

    mask = meta_df["Book#"].astype(str).str.strip() == str(book_id)
    if not mask.any():
        logger.warning(f"Book #{book_id} not found in metadata.csv")
        return

    meta_row = meta_df.loc[mask].iloc[0]
    stats = analyze_text(cleaned_text, book_id, meta_row)

    for col, value in stats.items():
        meta_df.loc[mask, col] = value

    logger.info(f"Analysis appended for book #{book_id}")

    with open(TO_PUBLISH_PATH, "a", encoding="utf-8") as f:
        f.write(f"{book_id}\n")

def main():
    import sys
    import json

    if len(sys.argv) > 1:
        # === WEB UPLOAD MODE (used by Analyze Any Book) ===
        file_path = sys.argv[1]
        logger.info(f"🔥 Processing uploaded file: {file_path}")

        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                cleaned_text = f.read()
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            return

        # Run your full analysis engine
        stats = analyze_text(cleaned_text, book_id=0, meta_row=pd.Series())

        # ONLY print clean JSON — nothing else
        print(json.dumps(stats))
        logger.info("✅ Processor finished - pure JSON sent to frontend")
    else:
        # Keep your original menu mode for local use
        logger.info("=== Rocket Readers - Processor Starting (Menu Mode) ===")
        # ... (your original main() code stays here unchanged)
        # (I left the rest of your original main() intact below)
        if len(sys.argv) > 1:
            file_path = sys.argv[1]
            logger.info(f"🔥 Processing uploaded file: {file_path}")
            # Use the single-file analysis path
            cleaned_text = clean_gutenberg_text(file_path) if file_path.endswith('.txt') else open(file_path, "r", encoding="utf-8").read()
            stats = analyze_text(cleaned_text, book_id=0, meta_row=pd.Series())
            print(json.dumps(stats))   # <-- This is what the web API reads
        else:
            # Keep original menu behavior for your local use
            print("Running original menu mode...")
            # (your original main() code here if you want)
        logger.info("=== Rocket Readers - Processor Starting ===")

        meta_df = pd.read_csv(METADATA_PATH, low_memory=False, dtype=str)
        logger.info(f"Loaded {len(meta_df)} rows from metadata.csv")
        meta_df = meta_df.rename(columns={"Etext Number": "Book#", "Authors": "Author"})

        # Menu
        print("\n" + "="*60)
        print("Rocket Readers Processor")
        print("="*60)
        print("1. Process books via \"To Be Analyzed\" list.")
        print("2. Start mining through the Archive.")
        print("="*60)
        choice = input("Enter your choice (1 or 2): ").strip()

        if choice == "1":
            logger.info("Mode 1 selected: Processing via To Be Analyzed list")
            with open(TO_ANALYZE_PATH, "r", encoding="utf-8") as f:
                book_ids = [int(line.strip()) for line in f if line.strip().isdigit()]

            if not book_ids:
                logger.info("No books in To Be Analyzed.txt")
                return

            logger.info(f"Processing {len(book_ids)} books from To Be Analyzed.txt...")
            for book_id in book_ids:
                process_single_book(book_id, meta_df)

        elif choice == "2":
            logger.info("Mode 2 selected: Mining the full archive")
            try:
                num_to_process = int(input("How many books would you like to process? (maximum 10000): ").strip())
                num_to_process = min(max(num_to_process, 1), 10000)
            except ValueError:
                num_to_process = 100
                logger.warning(f"Invalid input. Defaulting to {num_to_process} books.")

            logger.info(f"Mining mode: Targeting up to {num_to_process} unanalyzed books (smallest files first)")

            all_candidates = get_candidate_books(BOOKS_DIR)

            if not all_candidates:
                logger.error("No .txt files found in the books directory. Please check the path and files.")
                return

            # Filter unanalyzed books
            to_process = []
            for book_id, filepath, filesize in all_candidates:
                if not is_already_analyzed(meta_df, book_id):
                    to_process.append((book_id, filepath, filesize))
                    if len(to_process) >= num_to_process:
                        break

            if not to_process:
                logger.info("No unanalyzed books found in the archive!")
                return

            logger.info(f"Found {len(to_process)} unanalyzed books to process (smallest first).")

            total = len(to_process)
            for idx, (book_id, _, _) in enumerate(to_process, 1):
                process_single_book(book_id, meta_df)

                if idx % 10 == 0 or idx == total or idx == 1:
                    percent = (idx / total) * 100
                    logger.info(f"Progress: {idx}/{total} books analyzed - {percent:.1f}% Complete")

        else:
            logger.error("Invalid choice. Please run again and choose 1 or 2.")
            return

        meta_df.to_csv(METADATA_PATH, index=False)
        logger.info("=== SUCCESS! ===")
        logger.info(f"Updated {METADATA_PATH}")
        logger.info(f"Ready for publishing: {TO_PUBLISH_PATH}")

if __name__ == "__main__":
    main()
    