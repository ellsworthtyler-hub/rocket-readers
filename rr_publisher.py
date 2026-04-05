import os
import re
import sys
import logging
import pandas as pd

# ====================== CONFIGURATION ======================
CLEANED_DIR = r"E:\Gutenberg_Archive\cleaned_books"
PUBLISHED_DIR = r"E:\Gutenberg_Archive\published_books"
METADATA_PATH = r"C:\Users\ellsw\LiteracyProject\gutenberg_metadata.csv"
TO_PUBLISH_PATH = r"C:\Users\ellsw\LiteracyProject\To Be Published.txt"

os.makedirs(PUBLISHED_DIR, exist_ok=True)

# ====================== LOGGING ======================
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', handlers=[logging.StreamHandler(sys.stdout)])
logger = logging.getLogger(__name__)

# ====================== DOLCH LISTS ======================
DOLCH_LISTS = {
    "prek": {"a", "and", "away", "big", "blue", "can", "come", "down", "find", "for", "funny", "go", "help", "here", "i", "in", "is", "it", "jump", "little", "look", "make", "me", "my", "not", "one", "play", "red", "run", "said", "see", "the", "three", "to", "two", "up", "we", "where", "yellow", "you"},
    "kindergarten": {"all", "am", "are", "at", "ate", "be", "black", "brown", "but", "came", "did", "do", "eat", "four", "get", "good", "have", "he", "into", "like", "must", "new", "no", "now", "on", "our", "out", "please", "pretty", "ran", "ride", "saw", "say", "she", "so", "soon", "that", "there", "they", "this", "too", "under", "want", "was", "well", "went", "what", "white", "who", "will", "with", "yes"},
    "first": {"after", "again", "an", "any", "as", "ask", "by", "could", "every", "fly", "from", "give", "going", "had", "has", "her", "him", "his", "how", "just", "know", "let", "live", "may", "of", "old", "once", "open", "over", "put", "round", "some", "stop", "take", "thank", "them", "then", "think", "walk", "were", "when"},
    "second": {"always", "around", "because", "been", "before", "best", "both", "buy", "call", "cold", "does", "don’t", "fast", "first", "five", "found", "gave", "goes", "green", "its", "made", "many", "off", "or", "pull", "read", "right", "sing", "sit", "sleep", "tell", "their", "these", "those", "upon", "us", "use", "very", "wash", "which", "why", "wish", "work", "would", "write", "your"},
    "third": {"about", "better", "bring", "carry", "clean", "cut", "done", "draw", "drink", "eight", "fall", "far", "full", "got", "grow", "hold", "hot", "hurt", "if", "keep", "kind", "laugh", "light", "long", "much", "myself", "never", "only", "own", "pick", "seven", "shall", "show", "six", "small", "start", "ten", "today", "together", "try", "warm"}
}

# ====================== NLTK SETUP ======================
try:
    import nltk
    from nltk.tokenize import word_tokenize
    from nltk import pos_tag
    nltk.download('punkt', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
except ImportError:
    logger.error("NLTK not installed. Run: pip install nltk")
    sys.exit(1)

# ====================== COLOR SCHEME ======================
POS_COLORS = {
    "noun": "#e74c3c", "adjective": "#2ecc71", "verb": "#3498db",
    "adverb": "#f39c12", "pronoun": "#9b59b6", "preposition": "#1abc9c",
    "conjunction": "#34495e", "interjection": "#e67e22"
}

# ====================== HELPERS ======================
def load_cleaned_text(book_id: int) -> str:
    path = os.path.join(CLEANED_DIR, f"{book_id}_clean")
    if not os.path.exists(path):
        logger.error(f"Cleaned file not found for {book_id}")
        return ""
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def get_metadata(book_id: int) -> tuple:
    try:
        meta_df = pd.read_csv(METADATA_PATH, low_memory=False, dtype=str)
        meta_df = meta_df.rename(columns={"Etext Number": "Book#", "Authors": "Author"})
        row = meta_df[meta_df["Book#"].astype(str).str.strip() == str(book_id)]
        if not row.empty:
            title = str(row.iloc[0].get("Title", f"Book {book_id}")).strip()
            author = str(row.iloc[0].get("Author", "Unknown Author")).strip()
            author = re.sub(r'Author\s*', '', author, flags=re.IGNORECASE).strip()
            return title, author
    except Exception as e:
        logger.warning(f"Metadata load failed for {book_id}: {e}")
    return f"Book {book_id}", "Unknown Author"

def normalize_quotes(text: str) -> str:
    text = re.sub(r'``', '"', text)
    text = re.sub(r"''", '"', text)
    text = re.sub(r'`', "'", text)
    text = re.sub(r'“|”', '"', text)
    return text

def tag_text(text: str) -> str:
    text = normalize_quotes(text)
    paragraphs = re.split(r'\n\s*\n', text.strip())
    html_paras = []

    for para in paragraphs:
        if not para.strip():
            continue
        tokens = word_tokenize(para)
        tagged = pos_tag(tokens)
        html_parts = []
        dolch_grades = ["prek", "kindergarten", "first", "second", "third"]

        for word, pos_tag_str in tagged:
            pos_class = ""
            if pos_tag_str.startswith(("NN", "NNS", "NNP", "NNPS")): pos_class = "noun"
            elif pos_tag_str.startswith(("JJ", "JJR", "JJS")): pos_class = "adjective"
            elif pos_tag_str.startswith(("VB", "VBD", "VBG", "VBN", "VBP", "VBZ")): pos_class = "verb"
            elif pos_tag_str.startswith(("RB", "RBR", "RBS")): pos_class = "adverb"
            elif pos_tag_str.startswith("PRP"): pos_class = "pronoun"
            elif pos_tag_str == "IN": pos_class = "preposition"
            elif pos_tag_str == "CC": pos_class = "conjunction"
            elif pos_tag_str in ("UH",): pos_class = "interjection"

            dolch_class = ""
            lower_word = word.lower().strip(".,!?;:'\"")
            for grade in dolch_grades:
                if lower_word in DOLCH_LISTS[grade]:
                    dolch_class = f"dolch-{grade}"
                    break

            classes = [f"pos-{pos_class}"] if pos_class else []
            if dolch_class:
                classes.append(dolch_class)

            if classes:
                html_parts.append(f'<span class="{" ".join(classes)}">{word}</span>')
            else:
                html_parts.append(word)

        html_paras.append(f"<p>{' '.join(html_parts)}</p>")

    return "\n".join(html_paras)

def generate_html(book_id: int, tagged_html: str, title: str, author: str) -> str:
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title} - Rocket Readers</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {{ font-family: system-ui, -apple-system, sans-serif; line-height: 1.7; }}
        .text-content {{ font-size: 1.15rem; color: #111827; }}
        .text-content span {{ color: #111827 !important; text-decoration: none !important; transition: all 0.2s; }}
        .pos-noun.active {{ color: {POS_COLORS["noun"]} !important; text-decoration: underline !important; }}
        .pos-adjective.active {{ color: {POS_COLORS["adjective"]} !important; text-decoration: underline !important; }}
        .pos-verb.active {{ color: {POS_COLORS["verb"]} !important; text-decoration: underline !important; }}
        .pos-adverb.active {{ color: {POS_COLORS["adverb"]} !important; text-decoration: underline !important; }}
        .pos-pronoun.active {{ color: {POS_COLORS["pronoun"]} !important; text-decoration: underline !important; }}
        .pos-preposition.active {{ color: {POS_COLORS["preposition"]} !important; text-decoration: underline !important; }}
        .pos-conjunction.active {{ color: {POS_COLORS["conjunction"]} !important; text-decoration: underline !important; }}
        .pos-interjection.active {{ color: {POS_COLORS["interjection"]} !important; text-decoration: underline !important; }}
        .dolch-prek, .dolch-kindergarten, .dolch-first, .dolch-second, .dolch-third {{ padding: 2px 5px; border-radius: 4px; }}
        .active-green {{ background-color: #d4edda !important; }}
    </style>
</head>
<body class="bg-gray-50">
    <div class="max-w-4xl mx-auto p-6">
        <!-- Banner -->
        <div class="bg-white shadow rounded-3xl p-6 mb-8 text-center">
            <h1 class="text-3xl font-bold text-gray-900">{title}</h1>
            <p class="text-xl text-gray-600 mt-2">{author}</p>
            <p class="text-sm text-gray-500 mt-1">Gutenberg #{book_id}</p>
        </div>

        <!-- Toolbar -->
        <div class="sticky top-4 bg-white shadow-md p-5 mb-8 rounded-3xl flex flex-wrap gap-3 z-50">
            <div class="flex flex-wrap gap-2">
                <button onclick="togglePOS('noun')" class="px-5 py-2.5 bg-red-100 hover:bg-red-200 rounded-2xl text-red-700 font-medium transition">Noun</button>
                <button onclick="togglePOS('adjective')" class="px-5 py-2.5 bg-green-100 hover:bg-green-200 rounded-2xl text-green-700 font-medium transition">Adjective</button>
                <button onclick="togglePOS('verb')" class="px-5 py-2.5 bg-blue-100 hover:bg-blue-200 rounded-2xl text-blue-700 font-medium transition">Verb</button>
                <button onclick="togglePOS('adverb')" class="px-5 py-2.5 bg-orange-100 hover:bg-orange-200 rounded-2xl text-orange-700 font-medium transition">Adverb</button>
                <button onclick="togglePOS('pronoun')" class="px-5 py-2.5 bg-purple-100 hover:bg-purple-200 rounded-2xl text-purple-700 font-medium transition">Pronoun</button>
                <button onclick="togglePOS('preposition')" class="px-5 py-2.5 bg-teal-100 hover:bg-teal-200 rounded-2xl text-teal-700 font-medium transition">Preposition</button>
                <button onclick="togglePOS('conjunction')" class="px-5 py-2.5 bg-gray-700 hover:bg-gray-800 rounded-2xl text-white font-medium transition">Conjunction</button>
                <button onclick="togglePOS('interjection')" class="px-5 py-2.5 bg-amber-100 hover:bg-amber-200 rounded-2xl text-amber-700 font-medium transition">Interjection</button>
                <button onclick="removeAllPOS()" class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-2xl text-gray-700 font-medium transition">Remove All POS</button>
            </div>

            <div class="flex flex-wrap gap-2">
                <button onclick="toggleDolch(0)" class="px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 rounded-2xl text-emerald-700 font-medium transition">Pre-K</button>
                <button onclick="toggleDolch(1)" class="px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 rounded-2xl text-emerald-700 font-medium transition">Kindergarten</button>
                <button onclick="toggleDolch(2)" class="px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 rounded-2xl text-emerald-700 font-medium transition">1st Grade</button>
                <button onclick="toggleDolch(3)" class="px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 rounded-2xl text-emerald-700 font-medium transition">2nd Grade</button>
                <button onclick="toggleDolch(4)" class="px-5 py-2.5 bg-emerald-100 hover:bg-emerald-200 rounded-2xl text-emerald-700 font-medium transition">3rd Grade</button>
                <button onclick="removeAllDolch()" class="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 rounded-2xl text-gray-700 font-medium transition">Remove All Dolch</button>
            </div>

            <button onclick="window.scrollTo({{top:0,behavior:'smooth'}})" class="ml-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium transition">Go to Top</button>
        </div>

        <!-- Book Text -->
        <div id="text-content" class="text-content bg-white p-10 rounded-3xl shadow-inner leading-relaxed">
            {tagged_html}
        </div>
    </div>

    <script>
        let activePOS = new Set();
        let activeDolch = new Set();

        function togglePOS(type) {{
            if (activePOS.has(type)) {{
                activePOS.delete(type);
            }} else {{
                activePOS.add(type);
            }}
            updatePOS();
        }}

        function updatePOS() {{
            const spans = document.querySelectorAll('#text-content span');
            spans.forEach(span => {{
                let shouldActivate = false;
                for (let cls of span.classList) {{
                    if (cls.startsWith('pos-')) {{
                        const posType = cls.substring(4);
                        if (activePOS.has(posType)) {{
                            shouldActivate = true;
                            break;
                        }}
                    }}
                }}
                if (shouldActivate) {{
                    span.classList.add('active');
                }} else {{
                    span.classList.remove('active');
                }}
            }});
        }}

        function removeAllPOS() {{
            activePOS.clear();
            updatePOS();
        }}

        function toggleDolch(level) {{
            const grades = ['prek', 'kindergarten', 'first', 'second', 'third'];
            const gradeName = grades[level];
            if (activeDolch.has(gradeName)) {{
                activeDolch.delete(gradeName);
            }} else {{
                activeDolch.add(gradeName);
            }}
            updateDolch();
        }}

        function updateDolch() {{
            document.querySelectorAll('#text-content span').forEach(span => {{
                let isDolch = false;
                for (let cls of span.classList) {{
                    if (cls.startsWith('dolch-')) {{
                        const g = cls.substring(6);
                        if (activeDolch.has(g)) {{
                            isDolch = true;
                            break;
                        }}
                    }}
                }}
                span.classList.toggle('active-green', isDolch);
            }});
        }}

        function removeAllDolch() {{
            activeDolch.clear();
            updateDolch();
        }}

        // Force clean black text on load
        window.addEventListener('load', () => {{
            document.querySelectorAll('#text-content span').forEach(span => {{
                span.classList.remove('active');
                span.style.color = '#111827';
                span.style.textDecoration = 'none';
            }});
        }});
    </script>
</body>
</html>'''

    return html

def main():
    import sys

    if len(sys.argv) > 1:
        # === WEB UPLOAD MODE - used by Analyze Any Book ===
        file_path = sys.argv[1]
        logger.info(f"Publishing uploaded file: {file_path}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
        except Exception as e:
            logger.error(f"Failed to read file: {e}")
            print("<p>Error loading text</p>")
            return

        title, author = "Uploaded Book", "User Upload"
        tagged = tag_text(text)
        html = generate_html(book_id=0, tagged_html=tagged, title=title, author=author)

        # FIXED: Safe UTF-8 output (no more encoding crash)
        sys.stdout.buffer.write((html + "\n").encode("utf-8"))
        logger.info("✅ Publisher finished - HTML sent to frontend")
    else:
        # Keep your original menu mode
        logger.info("=== Rocket Readers Publisher - Final POS Fix ===")
        if len(sys.argv) > 1:
            # === WEB UPLOAD MODE ===
            file_path = sys.argv[1]
            logger.info(f"Publishing uploaded file: {file_path}")
            
            with open(file_path, "r", encoding="utf-8") as f:
                text = f.read()
            
            title, author = "Uploaded Book", "User Upload"
            tagged = tag_text(text)
            html = generate_html(book_id=0, tagged_html=tagged, title=title, author=author)
            
            print(html)   # ← This is what the frontend displays as the Rocket Reader
            logger.info("✅ Publisher finished — HTML sent to web frontend")
        else:
            logger.info("=== Rocket Readers Publisher - Final POS Fix ===")
            with open(TO_PUBLISH_PATH, "r") as f:
                book_ids = [int(line.strip()) for line in f if line.strip().isdigit()]

            if not book_ids:
                logger.info("No books to publish.")
                return

            for book_id in book_ids:
                logger.info(f"Publishing Book #{book_id}...")
                text = load_cleaned_text(book_id)
                if not text:
                    continue

                title, author = get_metadata(book_id)
                tagged = tag_text(text)
                html = generate_html(book_id, tagged, title, author)

                output_path = os.path.join(PUBLISHED_DIR, f"{book_id}_reader.html")
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(html)

                logger.info(f"✅ Saved: {output_path}")

            logger.info("=== All books published successfully! ===")

if __name__ == "__main__":
    main()
    