"use client";

import { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { FlashcardArray } from "react-quizlet-flashcard";
import Link from "next/link";

interface StudyCard {
  id: string;
  front: string;
  back: string;
  pageNumber: number;
}

// Fisher-Yates shuffle (client-side reshuffle)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function StudyPageContent() {
  const { bookId } = useParams<{ bookId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const from = searchParams.get("from") ?? "1";
  const to = searchParams.get("to") ?? "9999";

  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookTitle, setBookTitle] = useState("Study Session");
  const controlRef = useRef<{ resetArray: () => void } | null>(null);

  const loadCards = useCallback(async () => {
    setLoading(true); setError("");
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
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [bookId, from, to]);

  useEffect(() => { loadCards(); }, [loadCards]);

  function handleReshuffle() {
    setCards((prev) => shuffle(prev));
    setCurrentIndex(0);
    controlRef.current?.resetArray?.();
  }

  // Map cards to react-quizlet-flashcard format (v3 style with frontHTML / backHTML)
  const deck = cards.map((card, i) => ({
    id: i + 1,
    frontHTML: <div className="flashcard-front">{card.front}</div>,
    backHTML: (
      <div className="flashcard-back flex flex-col items-center justify-center">
        <div>{card.back}</div>
        <div className="text-xs mt-4 opacity-50">Page {card.pageNumber}</div>
      </div>
    ),
  }));

  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-2 border-white/10 border-t-violet-500 rounded-full animate-spin" />
        <p style={{ color: "var(--text-muted)" }}>Loading flashcards…</p>
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
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        <FlashcardArray
          cards={deck}
          controls={true}
          showCount={false}
          onCardChange={(_: unknown, index: number) => setCurrentIndex(index)}
          FlashcardArrayStyle={{
            background: "var(--bg-surface)",
            width: "100%",
            height: "340px",
          }}
          frontCardStyle={{
            background: "linear-gradient(135deg, #13131d, #1a1a2e)",
            border: "none",
            borderRadius: "0",
            color: "var(--text-primary)",
          }}
          backCardStyle={{
            background: "linear-gradient(135deg, #0f1a2e, #12122a)",
            border: "none",
            borderRadius: "0",
            color: "var(--text-secondary)",
          }}
          forwardRef={controlRef as any}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          💡 Click the card to flip it
        </p>
        <div className="flex gap-3">
          <button id="reshuffle-btn" className="btn btn-secondary" onClick={handleReshuffle}>
            🔀 Reshuffle
          </button>
          <Link href={`/books/${bookId}`} id="back-to-book-btn" className="btn btn-secondary">
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
