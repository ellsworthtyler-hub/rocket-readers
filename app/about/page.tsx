//  FILE: app/about/page.tsx
//  About Us — Science of Reading foundations for Rocket Reader
//  ===========================

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — Rocket Reader',
  description:
    'How Dolch and Fry sight words, Heart words, and syllable mapping support early literacy—and how Rocket Reader puts that research into practice.',
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 tracking-tight border-b border-slate-100 pb-3">
        {title}
      </h2>
      <div className="space-y-4 text-slate-700 text-base md:text-lg leading-relaxed">
        {children}
      </div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 md:py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-center text-emerald-700 font-semibold text-sm uppercase tracking-widest mb-3">
          About Us
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 text-center tracking-tight">
          The Science of Reading at Rocket Reader
        </h1>
        <p className="text-center text-slate-500 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
          Why we measure sight words, Heart words, and syllables—and how those tools help young
          readers and students grow.
        </p>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 space-y-12">
          <Section id="how-reading-works" title="How the brain learns to read">
            <p>
              Reading is not a naturally wired brain function; it is a complex skill that must be
              taught. Research in the Science of Reading highlights{' '}
              <strong>orthographic mapping</strong>—the process of bonding a word&apos;s
              pronunciation, spelling, and meaning so the word can be recognized instantly in
              print.<sup className="text-emerald-700">[1][2]</sup> When mapping succeeds, a word
              becomes a true &ldquo;sight word&rdquo;: retrieved automatically without sounding out
              each letter every time.
            </p>
            <p>
              Adult readers hold tens of thousands of instantly recognized words. For early
              learners and English learners, building that bank is the bridge from labored decoding
              to fluent, enjoyable reading. When less mental effort is spent on word recognition,
              more is available for comprehension—the real goal of every story and textbook
              page.<sup className="text-emerald-700">[1][3]</sup>
            </p>
          </Section>

          <Section id="dolch" title="Dolch sight words">
            <p>
              The <strong>Dolch list</strong>, developed by Edward William Dolch from children&apos;s
              reading materials of the early–mid twentieth century, identifies a compact set of
              high-frequency &ldquo;service words&rdquo; (plus a short noun list) that appear again
              and again in early texts.<sup className="text-emerald-700">[4]</sup> Because these
              words carry little content of their own but glue sentences together—words such as{' '}
              <em>the</em>, <em>and</em>, <em>to</em>, <em>said</em>, <em>was</em>—automatic
              recognition of the Dolch set dramatically increases reading ease in beginning
              materials.
            </p>
            <p>
              Educators still use Dolch by grade bands (Pre-K through third grade) because mastery
              of the list is strongly associated with the ability to read a large share of the
              running text in typical primary books. Rocket Reader reports{' '}
              <strong>Dolch density</strong> (how often list words appear in a book) and{' '}
              <strong>Dolch breadth</strong> (how much of each grade list appears at least once), so
              parents and teachers can match texts to a reader&apos;s growing sight vocabulary.
            </p>
          </Section>

          <Section id="fry" title="Fry sight words">
            <p>
              The <strong>Fry Instant Word lists</strong>, compiled and refined by Edward Fry,
              rank the 1,000 most common English words in frequency order and are widely used from
              the primary grades through middle school.<sup className="text-emerald-700">[5]</sup>{' '}
              Fry estimated that the first 100 words account for about half of all written English
              word tokens, and that the full 1,000 cover the bulk of everyday print—books,
              newspapers, and online text.
            </p>
            <p>
              Where Dolch is especially useful for early &ldquo;service&rdquo; words, Fry scales
              with the reader: denser Fry coverage often means fewer rare vocabulary bottlenecks in
              intermediate materials. Rocket Reader surfaces <strong>Fry density</strong> alongside
              Dolch so you can compare books for both early automaticity and broader high-frequency
              support.
            </p>
          </Section>

          <Section id="heart" title="Heart words and irregular spellings">
            <p>
              Not every high-frequency word is fully decodable with simple phonics patterns. Words
              like <em>said</em>, <em>was</em>, or <em>of</em> contain letter–sound relationships
              that are irregular or temporarily opaque for beginning readers. The{' '}
              <strong>Heart Word</strong> approach—popularized in structured-literacy programs such
              as UFLI Foundations—teaches students to map the regular parts of a word with phonics
              and to &ldquo;learn by heart&rdquo; the irregular graphemes, rather than memorizing
              the whole word as an unanalyzed shape.<sup className="text-emerald-700">[6][7]</sup>
            </p>
            <p>
              That strategy aligns with orthographic mapping research: irregular words still need
              phoneme–grapheme connections; only the unexpected parts get extra attention.
              <sup className="text-emerald-700">[2][6]</sup> In Rocket Reader enhanced editions,
              Heart-word highlighting draws the eye to irregular letter sequences so practice stays
              connected to sound and spelling—not pure whole-word guessing.
            </p>
          </Section>

          <Section id="syllables" title="Syllable mapping">
            <p>
              Longer words are often easier when students can break them into{' '}
              <strong>syllables</strong>—units of spoken language that each contain a vowel sound.
              Explicit syllable instruction (open/closed syllables, vowel teams, consonant-le, and
              so on) is a long-standing component of structured literacy and is supported by
              reviews of effective reading instruction that emphasize phonemic awareness, phonics,
              fluency, vocabulary, and comprehension together.
              <sup className="text-emerald-700">[3][8]</sup>
            </p>
            <p>
              Syllable coloring and segmentation in our enhanced ebooks help readers &ldquo;chunk&rdquo;
              multisyllabic words instead of stalling on letter-by-letter struggle. Combined with
              sight-word density stats on each book page, teachers can choose texts that stretch
              decoding just enough—challenging, not overwhelming.
            </p>
          </Section>

          <Section id="rocket" title="How Rocket Reader puts this into practice">
            <p>
              We apply these frameworks to public-domain literature (Project Gutenberg) so every
              family and classroom can start free:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-700">
              <li>
                <strong>Book analytics</strong> — Dolch/Fry density and breadth, dialogue ratio,
                Flesch readability, word-length and parts-of-speech profiles.
              </li>
              <li>
                <strong>Enhanced ebooks</strong> — toggle Dolch, Fry, Heart words, syllables, and
                grammar (POS) highlights on the page.
              </li>
              <li>
                <strong>Classwork packets (Premium)</strong> — multi-week, book-specific practice
                so orthographic mapping continues off-screen with flashcards, context sentences,
                and related activities.
              </li>
            </ul>
            <p>
              Free users can explore the library, review stats, open Gutenberg originals, and try a{' '}
              <strong>sample enhanced ebook</strong>. Premium unlocks the full interactive text and
              downloadable packets.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/search"
                className="inline-flex justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition"
              >
                Browse the library
              </Link>
              <Link
                href="/premium"
                className="inline-flex justify-center px-6 py-3 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-800 font-bold rounded-2xl transition"
              >
                View Premium
              </Link>
            </div>
          </Section>

          {/* Citations */}
          <section id="references" className="border-t border-slate-200 pt-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4">References</h2>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-slate-600 leading-relaxed">
              <li id="ref-1">
                Ehri, L. C. (2014). Orthographic mapping in the acquisition of sight word reading,
                spelling memory, and vocabulary learning. <em>Scientific Studies of Reading</em>,{' '}
                18(1), 5–21.{' '}
                <a
                  href="https://doi.org/10.1080/10888438.2013.819356"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://doi.org/10.1080/10888438.2013.819356
                </a>
              </li>
              <li id="ref-2">
                Kilpatrick, D. A. (2015). <em>Essentials of assessing, preventing, and overcoming
                reading difficulties</em>. Wiley.
              </li>
              <li id="ref-3">
                National Institute of Child Health and Human Development. (2000).{' '}
                <em>
                  Report of the National Reading Panel: Teaching children to read
                </em>{' '}
                (NIH Publication No. 00-4769). U.S. Government Printing Office.{' '}
                <a
                  href="https://www.nichd.nih.gov/sites/default/files/publications/pubs/nrp/Documents/report.pdf"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NIH / NRP report (PDF)
                </a>
              </li>
              <li id="ref-4">
                Dolch, E. W. (1936). A basic sight vocabulary. <em>The Elementary School Journal</em>
                , 36(6), 456–460. See also Dolch, E. W. (1948). <em>Problems in reading</em>.
                Garrard Press. Overview for educators:{' '}
                <a
                  href="https://www.readingrockets.org/topics/teaching-reading-basics/articles/basic-sight-vocabulary"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reading Rockets — Basic sight vocabulary
                </a>
              </li>
              <li id="ref-5">
                Fry, E. (1980). The new instant word list. <em>The Reading Teacher</em>, 34(3),
                284–289. Educator overview:{' '}
                <a
                  href="https://www.readingrockets.org/topics/teaching-reading-basics/articles/fry-1000-instant-words"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Reading Rockets — Fry 1000 Instant Words
                </a>
              </li>
              <li id="ref-6">
                University of Florida Literacy Institute. (n.d.). <em>UFLI Foundations</em> — Heart
                Word Magic / irregular high-frequency words. Resources:{' '}
                <a
                  href="https://ufli.education.ufl.edu/foundations/"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://ufli.education.ufl.edu/foundations/
                </a>
              </li>
              <li id="ref-7">
                Reading Rockets. (n.d.). Heart word magic and teaching irregular words in a
                phonics-aligned way.{' '}
                <a
                  href="https://www.readingrockets.org/classroom/classrooms-grades-k-1/teaching-sight-words-heart-word-method"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Teaching sight words: Heart Word method
                </a>
              </li>
              <li id="ref-8">
                Archer, A. L., Gleason, M. M., & Vachon, V. L. (2003). Decoding and fluency:
                Foundation skills for struggling older readers. <em>Learning Disability Quarterly</em>
                , 26(2), 89–101. See also structured-literacy guidance on multisyllabic word
                instruction from the International Dyslexia Association.
              </li>
            </ol>
            <p className="mt-6 text-xs text-slate-400 leading-relaxed">
              Citations support the instructional frameworks described on this page. Rocket Reader
              is an independent educational product and is not affiliated with Dolch, Fry, UFLI, or
              Reading Rockets. Project Gutenberg texts are public domain where indicated by their
              source.
            </p>
          </section>
        </div>

        <p className="text-center mt-10">
          <Link href="/" className="text-emerald-700 font-semibold hover:underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}
