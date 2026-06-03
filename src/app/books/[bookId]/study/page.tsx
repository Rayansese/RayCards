"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

interface StudyCard {
  id: string;
  front: string;
  back: string;
  pageNumber: number;
}

function StudyPageContent() {
  const { bookId } = useParams<{ bookId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const from = searchParams.get("from") ?? "1";
  const to = searchParams.get("to") ?? "9999";

  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookTitle, setBookTitle] = useState("Study Session");
  const [sessionComplete, setSessionComplete] = useState(false);

  const loadCards = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studyRes, bookRes] = await Promise.all([
        fetch(`/api/books/${bookId}/study?from=${from}&to=${to}`),
        fetch(`/api/books/${bookId}`),
      ]);
      if (!studyRes.ok) throw new Error("Failed to fetch study cards.");
      const studyData = await studyRes.json();
      if (bookRes.ok) {
        const bookData = await bookRes.json();
        setBookTitle(bookData.title);
      }
      setCards(studyData.flashcards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionComplete(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [bookId, from, to]);

  useEffect(() => {
    loadCards();
  }, [loadCards]);

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setSessionComplete(true);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleReshuffle = async () => {
    setIsFlipped(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/books/${bookId}/study?from=${from}&to=${to}`);
      const data = await res.json();
      setCards(data.flashcards);
      setCurrentIndex(0);
      setSessionComplete(false);
    } catch (e) {
      setError("Failed to reshuffle cards.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
        <p style={{ color: "var(--text-muted)" }}>Loading study session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-2xl mb-2">⚠️</p>
        <p className="font-medium" style={{ color: "var(--accent-rose)" }}>{error}</p>
        <button className="btn btn-secondary mt-4" onClick={() => router.back()}>← Go Back</button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
        <p className="text-4xl mb-4">🃏</p>
        <p className="font-medium text-base" style={{ color: "var(--text-secondary)" }}>No flashcards found</p>
        <p className="text-sm mt-1">No pages in range {from}–{to} have been processed yet.</p>
        <Link href={`/books/${bookId}`} className="btn btn-secondary mt-6 inline-flex">
          ← Add Pages
        </Link>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-slideUp">
        <div className="text-6xl mb-6">🎉</div>
        <h2 className="text-3xl font-bold mb-2">Session Complete!</h2>
        <p className="text-gray-400 mb-8">You've reviewed all {cards.length} flashcards in this range.</p>
        <div className="flex gap-4">
          <button className="btn btn-primary" onClick={handleReshuffle}>🔀 Study Again</button>
          <Link href={`/books/${bookId}`} className="btn btn-secondary">← Back to Book</Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/books/${bookId}`} className="hover:text-white transition-colors">{bookTitle}</Link>
            <span>/</span>
            <span>Study</span>
          </nav>
          <h1 className="text-2xl font-bold">
            Pages {from}–{to !== "9999" ? to : "end"}
          </h1>
        </div>
        <div className="badge badge-violet">{cards.length} cards</div>
      </div>

      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Flashcard */}
      <div className="perspective-1000 relative h-[340px] w-full cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : 'rotate-y-0'}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-white/10"
            style={{
              backfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #13131d, #1a1a2e)',
              color: 'var(--text-primary)'
            }}
          >
            <div className="text-xs uppercase tracking-widest opacity-50 mb-4">Question</div>
            <div className="text-2xl font-medium leading-relaxed">{currentCard.front}</div>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-white/10"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: 'linear-gradient(135deg, #0f1a2e, #12122a)',
              color: 'var(--text-secondary)'
            }}
          >
            <div className="text-xs uppercase tracking-widest opacity-50 mb-4">Answer</div>
            <div className="text-xl leading-relaxed">{currentCard.back}</div>
            <div className="text-xs mt-6 opacity-40">Page {currentCard.pageNumber}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={handlePrev} disabled={currentIndex === 0}>
            ← Previous
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={currentIndex === cards.length - 1}
          >
            {currentIndex === cards.length - 1 ? "Finish" : "Next →"}
          </button>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary" onClick={handleReshuffle}>
            🔀 Reshuffle
          </button>
          <Link href={`/books/${bookId}`} className="btn btn-secondary">
            ← Change Range
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-slate-400">Loading study session…</div>}>
      <StudyPageContent />
    </Suspense>
  );
}
