//  FILE:  /components/ui/BookFeedback.tsx
//  ========================================

'use client';

import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

export default function BookFeedback({ bookId }: { bookId: string | number }) {
  const { user } = useAuth();

  const submitFeedback = async (actionType: string) => {
    if (!user) {
      alert("Please log in to submit feedback!");
      return;
    }
    
    try {
      const { error } = await supabase.from('book_feedback').insert({
        user_id: user.id,
        book_id: bookId.toString(),
        action_type: actionType
      });

      if (error) {
        if (error.code === '23505') { // Postgres Unique Violation code
          alert("You have already submitted this feedback for this book.");
        } else {
          console.error(error);
          alert("Error submitting feedback.");
        }
      } else {
        alert("Thank you! Your feedback has been recorded.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-8 mt-6 pt-6 border-t border-slate-200 text-sm font-medium text-slate-400">
      <button 
        onClick={() => submitFeedback('recommend')}
        className="hover:text-amber-500 transition flex items-center gap-2"
      >
        <span className="text-lg">⭐</span> Recommend Book
      </button>
      <button 
        onClick={() => submitFeedback('flag_content')}
        className="hover:text-rose-500 transition flex items-center gap-2"
      >
        <span className="text-lg">⚠️</span> Flag Content
      </button>
      <button 
        onClick={() => submitFeedback('flag_error')}
        className="hover:text-red-600 transition flex items-center gap-2"
      >
        <span className="text-lg">🚩</span> Report Error
      </button>
    </div>
  );
}