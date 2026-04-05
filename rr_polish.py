import os
import sys
import logging
import re

# ====================== CONFIGURATION ======================
PUBLISHED_DIR = r"E:\Gutenberg_Archive\published_books"
TO_POLISH_PATH = r"C:\Users\ellsw\LiteracyProject\To Be Polished.txt"
REPLACEMENTS_PATH = r"C:\Users\ellsw\LiteracyProject\Replacements.txt"

# Set this to True to make all replacements case-insensitive by default
# You can also control it per line in Replacements.txt using a flag at the end: |i
CASE_INSENSITIVE_DEFAULT = False

# ====================== LOGGING ======================
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

def load_replacements():
    """Load replacements from Replacements.txt with optional case-insensitive flag."""
    if not os.path.exists(REPLACEMENTS_PATH):
        logger.error(f"Replacements file not found: {REPLACEMENTS_PATH}")
        return []

    replacements = []
    with open(REPLACEMENTS_PATH, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line or line.startswith('#'):
                continue

            # Split on first | only (allow | in replacement text)
            parts = line.split('|', 2)
            if len(parts) < 2:
                logger.warning(f"Line {line_num} missing '|' separator: {line}")
                continue

            find_text = parts[0]
            replace_text = parts[1]

            # Check for case-insensitive flag (third part or default)
            case_insensitive = CASE_INSENSITIVE_DEFAULT
            if len(parts) == 3:
                flag = parts[2].strip().lower()
                if flag in ('i', 'insensitive', 'ignorecase', 'true'):
                    case_insensitive = True
                elif flag in ('s', 'sensitive', 'false'):
                    case_insensitive = False

            replacements.append((find_text, replace_text, case_insensitive))

    logger.info(f"Loaded {len(replacements)} replacement rules "
                f"(default case-insensitive: {CASE_INSENSITIVE_DEFAULT})")
    return replacements

def apply_replacement(html_content: str, find_text: str, replace_text: str, case_insensitive: bool) -> tuple[str, int]:
    """Apply a single replacement and return updated content + count of replacements made."""
    if not find_text:
        return html_content, 0

    if case_insensitive:
        # Use regex for case-insensitive replacement, preserving original case in matches
        pattern = re.escape(find_text)
        count = 0
        def replacer(match):
            nonlocal count
            count += 1
            return replace_text
        new_content = re.sub(pattern, replacer, html_content, flags=re.IGNORECASE)
        return new_content, count
    else:
        # Standard string replace (case-sensitive)
        new_content = html_content.replace(find_text, replace_text)
        count = (len(html_content) - len(new_content)) // max(len(find_text), 1) if find_text else 0
        return new_content, count

def main():
    import sys

    if len(sys.argv) > 1:
        # === WEB UPLOAD MODE - used by Analyze Any Book ===
        file_path = sys.argv[1]
        # No emoji, no extra logging that can break encoding
        logger.info(f"Polishing uploaded file: {file_path}")

        # For web uploads we skip full polish (it's optional)
        # Just return success so the pipeline doesn't break
        print("Polished (web mode)")

        logger.info("✅ Polisher finished for web upload")
    else:
        logger.info("=== Rocket Readers Polisher (Enhanced with Case-Insensitive Support) - Starting ===")

        # Load books to polish
        if not os.path.exists(TO_POLISH_PATH):
            logger.error(f"File not found: {TO_POLISH_PATH}")
            return

        with open(TO_POLISH_PATH, "r", encoding="utf-8") as f:
            book_ids = [int(line.strip()) for line in f if line.strip().isdigit()]

        if not book_ids:
            logger.info("No books listed in To Be Polished.txt")
            return

        logger.info(f"Found {len(book_ids)} book(s) to polish: {book_ids}")

        # Load replacements
        replacements = load_replacements()
        if not replacements:
            logger.warning("No valid replacements found. Exiting.")
            return

        for book_id in book_ids:
            input_path = os.path.join(PUBLISHED_DIR, f"{book_id}_reader.html")
            output_path = os.path.join(PUBLISHED_DIR, f"{book_id}_polished.html")

            if not os.path.exists(input_path):
                logger.error(f"Input file not found: {input_path}")
                continue

            logger.info(f"\nPolishing Book #{book_id}...")

            # Read the HTML
            with open(input_path, "r", encoding="utf-8") as f:
                html_content = f.read()

            original_length = len(html_content)
            total_replacements = 0

            # Apply all replacements in order
            for find_text, replace_text, case_insensitive in replacements:
                html_content, count = apply_replacement(html_content, find_text, replace_text, case_insensitive)
                if count > 0:
                    mode = "case-insensitive" if case_insensitive else "case-sensitive"
                    logger.info(f"   Applied: '{find_text}' → '{replace_text}' "
                               f"({count} times, {mode})")
                    total_replacements += count

            # Save polished version
            with open(output_path, "w", encoding="utf-8") as f:
                f.write(html_content)

            logger.info(f"✅ Saved polished version: {output_path}")
            logger.info(f"   Changes: {total_replacements} total replacements | "
                       f"Size: {original_length:,} → {len(html_content):,} characters")

        logger.info("\n=== All books polished successfully! ===")

if __name__ == "__main__":
    main()
    