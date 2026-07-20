//  FILE: app/about/page.tsx
//  About Us — mission, research foundations, and how Rocket Readers works
//  ===========================

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us — Rocket Reader',
  description:
    'Our mission to help young readers and English learners with research-aligned sight words, Heart words, syllable practice, and book-specific classroom packets.',
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 md:py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <p className="text-center text-emerald-700 font-semibold text-sm uppercase tracking-widest mb-3">
          About Us
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 text-center tracking-tight">
          Helping every child become a confident reader
        </h1>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 space-y-6 text-slate-700 text-base md:text-lg leading-relaxed">
          <p>
            At Rocket Readers our mission is simple and heartfelt: help every young reader—and every
            English learner—build the strong foundation they need to become confident, lifelong
            readers. We believe literacy is a right, not a privilege, and we are passionate about
            giving teachers, parents, and homeschool families practical, evidence-based tools that
            make a real difference.
          </p>

          <p>
            The need has never been greater. According to the most recent National Assessment of
            Educational Progress (NAEP, often called the Nation&apos;s Report Card), only about 31
            percent of U.S. fourth-graders and 30 percent of eighth-graders scored at or above the
            Proficient level in reading in 2024. Roughly 40 percent of fourth-graders performed
            below the Basic level—the largest share in more than two decades. Twelfth-grade reading
            scores have reached their lowest point in over thirty years.
            <sup className="text-emerald-700 font-medium">[1]</sup> These numbers represent millions
            of children who struggle to read grade-level text with ease and understanding. For
            English learners the challenge is often even steeper. We created Rocket Readers because
            we refuse to accept this as inevitable.
          </p>

          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 pt-4 tracking-tight">
            What research tells us works
          </h2>

          <p>
            Our approach rests on decades of research into what actually helps children master
            print. High-frequency word lists such as the Dolch 220 and Fry Instant Words form a
            critical bridge to fluent reading.
            <sup className="text-emerald-700 font-medium">[2][3]</sup> When students can recognize
            these words automatically, cognitive resources are freed for comprehension rather than
            laborious decoding. Studies consistently show that systematic attention to these
            words—especially when paired with phonics rather than pure rote memorization—boosts
            reading rate, fluency, and overall success for both typically developing readers and
            those who struggle.
            <sup className="text-emerald-700 font-medium">[4][5]</sup>
          </p>

          <p>
            For the subset of high-frequency words that contain irregular or unexpected letter-sound
            patterns (often called &ldquo;heart words&rdquo;), research grounded in the Science of
            Reading emphasizes orthographic mapping. Students learn to identify the regular,
            decodable parts of the word and then deliberately &ldquo;map&rdquo; or remember by heart
            the irregular portion.
            <sup className="text-emerald-700 font-medium">[6][7]</sup> Recent experimental
            comparisons demonstrate that methods requiring active attention to a word&apos;s
            spelling—whether mispronunciation correction or heart-word mapping—produce stronger
            reading and spelling gains than simple look-and-say practice.
            <sup className="text-emerald-700 font-medium">[7][8]</sup> This approach reduces memory
            load and builds lasting orthographic knowledge.
          </p>

          <p>
            Syllable-level instruction provides another powerful lever. Teaching children to
            segment, blend, and recognize common syllables improves word recognition and reading
            comprehension, particularly for struggling readers and for English learners whose first
            language may organize syllables differently from English.
            <sup className="text-emerald-700 font-medium">[5][9]</sup> Syllable-focused work also
            supports the later reading of multisyllabic words that appear with increasing frequency
            in grade-level texts.
          </p>

          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 pt-4 tracking-tight">
            How Rocket Readers helps
          </h2>

          <p>
            Rocket Readers brings these research-supported elements together in a practical,
            teacher-friendly package. Every public-domain book we process is run through our
            analysis engine (built on spaCy, NLTK, textstat, and carefully curated Dolch/Fry lists).
            We calculate exact Dolch and Fry coverage percentages, dialogue ratio, Flesch
            readability metrics, detailed word-length distributions, and part-of-speech counts.
            These data feed both transparent progress reports and a complete 10-week classroom
            curriculum packet. Each packet includes vocabulary pages that pull authentic context
            sentences from the book, printable flashcards, memory-match games with clear
            definitions, spelling and sentence scramblers, word-search puzzles, Mad Libs-style
            activities, and more—everything a teacher or parent needs to give students repeated,
            meaningful practice with the exact words and patterns that matter most.
          </p>

          <p>
            We intentionally focus on free, public-domain literature from sources such as Project
            Gutenberg so that every family and classroom can access high-quality material without
            cost barriers. When modern copyrighted texts are uploaded for private analysis, we
            provide the same rich insights and activity ideas while directing users to purchase the
            original books through affiliate links—never distributing protected content.
          </p>

          <p>
            Our deepest hope is that Rocket Readers becomes a quiet, steady partner for the adults
            who care most about children&apos;s reading success. Whether you are a classroom teacher
            looking for ready-to-print weekly modules, a parent supporting an emerging reader at the
            kitchen table, or an ESL educator seeking culturally welcoming, data-informed practice,
            we want the tools you need to be accurate, engaging, and immediately useful. Literacy
            opens doors. We are here to help more children walk through them with confidence and
            joy.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link
              href="/search"
              className="inline-flex justify-center px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition"
            >
              Browse the library
            </Link>
            <Link
              href="/premium"
              className="inline-flex justify-center px-6 py-3.5 bg-white border-2 border-slate-200 hover:border-emerald-400 text-slate-800 font-bold rounded-2xl transition"
            >
              View Premium
            </Link>
          </div>

          {/* References supporting claims above */}
          <section className="border-t border-slate-200 pt-10 mt-4">
            <h2 className="text-xl font-bold text-slate-900 mb-4">References</h2>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-slate-600 leading-relaxed">
              <li>
                National Center for Education Statistics. (2025).{' '}
                <em>NAEP Report Card: Reading</em> — 2024 results for grades 4, 8, and 12. U.S.
                Department of Education.{' '}
                <a
                  href="https://www.nationsreportcard.gov/reading/"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://www.nationsreportcard.gov/reading/
                </a>
              </li>
              <li>
                Dolch, E. W. (1936). A basic sight vocabulary. <em>The Elementary School Journal</em>
                , 36(6), 456–460.
              </li>
              <li>
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
              <li>
                Ehri, L. C. (2005). Learning to read words: Theory, findings, and issues.{' '}
                <em>Scientific Studies of Reading</em>, 9(2), 167–188.
              </li>
              <li>
                National Institute of Child Health and Human Development. (2000).{' '}
                <em>Report of the National Reading Panel: Teaching children to read</em> (NIH
                Publication No. 00-4769).{' '}
                <a
                  href="https://www.nichd.nih.gov/sites/default/files/publications/pubs/nrp/Documents/report.pdf"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  NRP report (PDF)
                </a>
              </li>
              <li>
                Ehri, L. C. (2014). Orthographic mapping in the acquisition of sight word reading,
                spelling memory, and vocabulary learning. <em>Scientific Studies of Reading</em>,
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
              <li>
                University of Florida Literacy Institute. (n.d.). <em>UFLI Foundations</em> — Heart
                Word approach to irregular high-frequency words.{' '}
                <a
                  href="https://ufli.education.ufl.edu/foundations/"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  https://ufli.education.ufl.edu/foundations/
                </a>
              </li>
              <li>
                Reading Rockets. (n.d.). Teaching sight words with the Heart Word method.{' '}
                <a
                  href="https://www.readingrockets.org/classroom/classrooms-grades-k-1/teaching-sight-words-heart-word-method"
                  className="text-emerald-700 hover:underline break-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Heart Word method overview
                </a>
              </li>
              <li>
                Archer, A. L., Gleason, M. M., &amp; Vachon, V. L. (2003). Decoding and fluency:
                Foundation skills for struggling older readers.{' '}
                <em>Learning Disability Quarterly</em>, 26(2), 89–101.
              </li>
            </ol>
            <p className="mt-6 text-xs text-slate-400 leading-relaxed">
              References support the research frameworks described on this page. Rocket Readers is
              an independent educational product and is not affiliated with NAEP/NCES, Dolch, Fry,
              UFLI, or Reading Rockets. Project Gutenberg texts are public domain where indicated by
              their source.
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
