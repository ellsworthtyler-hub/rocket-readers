'use client';
import { useEffect, useRef } from "react";

export default function RocketReader({ html }: { html: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any previous scripts to prevent duplicate declarations
    const existingScripts = containerRef.current.querySelectorAll("script");
    existingScripts.forEach(s => s.remove());

    // Create and run the publisher's script safely
    const script = document.createElement("script");
    script.textContent = `
      let activePOS = new Set();
      let activeDolch = new Set();

      function togglePOS(type) {
        if (activePOS.has(type)) activePOS.delete(type);
        else activePOS.add(type);
        updatePOS();
      }

      function updatePOS() {
        const spans = document.querySelectorAll('#text-content span');
        spans.forEach(span => {
          let shouldActivate = false;
          for (let cls of span.classList) {
            if (cls.startsWith('pos-')) {
              const posType = cls.substring(4);
              if (activePOS.has(posType)) { shouldActivate = true; break; }
            }
          }
          span.classList.toggle('active', shouldActivate);
        });
      }

      function removeAllPOS() {
        activePOS.clear();
        updatePOS();
      }

      function toggleDolch(level) {
        const grades = ['prek', 'kindergarten', 'first', 'second', 'third'];
        const gradeName = grades[level];
        if (activeDolch.has(gradeName)) activeDolch.delete(gradeName);
        else activeDolch.add(gradeName);
        updateDolch();
      }

      function updateDolch() {
        document.querySelectorAll('#text-content span').forEach(span => {
          let isDolch = false;
          for (let cls of span.classList) {
            if (cls.startsWith('dolch-')) {
              const g = cls.substring(6);
              if (activeDolch.has(g)) { isDolch = true; break; }
            }
          }
          span.classList.toggle('active-green', isDolch);
        });
      }

      function removeAllDolch() {
        activeDolch.clear();
        updateDolch();
      }
    `;

    document.body.appendChild(script);

    return () => script.remove();
  }, [html]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-invert max-w-none bg-white/5 p-10 rounded-3xl shadow-inner leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}
