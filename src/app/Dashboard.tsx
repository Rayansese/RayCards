"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

export interface Book {
  id: string;
  title: string;
  author: string | null;
  subject: string | null;
  createdAt: string;
  pageCount: number;
  flashcardCount: number;
}

function NewBookModal({ onClose, onCreated }: { onClose: () => void; onCreated: (b: Book) => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError("Book title is required."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, author, subject }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      onCreated({ ...data, pageCount: 0, flashcardCount: 0 });
    } catch {
      setError("Network error. Check the server is running.");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        style={{
          background: "rgba(17, 17, 24, 0.95)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(124, 58, 237, 0.3)",
          borderRadius: "var(--radius-xl)",
          padding: "32px",
          width: "90%",
          maxWidth: "520px",
          color: "white",
          position: "relative",
          zIndex: 10000,
          maxHeight: "90vh",
          overflowY: "auto",
          animation: "slideUp 0.2s ease",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
        }}
      >
      <h2 className="text-xl font-bold mb-4">Add a New Book</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input className="input rounded-lg p-3 w-full" placeholder="Book title *" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <input className="input rounded-lg p-3 w-full" placeholder="Author" value={author} onChange={(e) => setAuthor(e.target.value)} />
          <input className="input rounded-lg p-3 w-full" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        {error && <p className="text-rose-400 text-xs">{error}</p>}
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? "Creating…" : "Create"}</button>
        </div>
      </form>
      </div>
    </div>,
    document.body
  );
}


function BookCard({ book, onDelete }: { book: Book; onDelete: (id: string) => void }) {
  async function handleDelete() {
    if (!confirm(`Delete "${book.title}"?`)) return;
    const res = await fetch(`/api/books/${book.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || "Failed to delete.");
      return;
    }
    onDelete(book.id);
  }

  return (
    <div className="card p-6 flex flex-col gap-4">
      <h3 className="font-semibold">{book.title}</h3>
      {book.author && <p className="text-xs" style={{ color: "var(--text-muted)" }}>{book.author}</p>}
      <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
        {book.flashcardCount} cards · {book.pageCount} pages
      </p>
      <div className="flex gap-2 mt-auto pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <Link href={`/books/${book.id}`} className="btn btn-primary flex-1 justify-center">Open</Link>
        <button type="button" className="btn btn-danger" onClick={handleDelete}>🗑</button>
      </div>
    </div>
  );
}

export default function Dashboard({ initialBooks }: { initialBooks: Book[] }) {
  const [books, setBooks] = useState(initialBooks);
  const [showModal, setShowModal] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleTryDemo() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/demo");
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Demo unavailable"); return; }
      window.location.href = data.studyUrl;
    } catch {
      alert("Could not load demo.");
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <>
      <section className="text-center py-16 mb-4">
        <h1 className="text-5xl font-bold mb-4">
          Study smarter with <span className="text-violet-400">AI Flashcards</span>
        </h1>
        <p className="text-lg mb-8" style={{ color: "var(--text-secondary)" }}>
          Gemini 3.1 Flash-Lite — paste text or upload PDF.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-secondary px-7 py-3" onClick={handleTryDemo} disabled={demoLoading}>
            {demoLoading ? "Loading…" : "▶ Try Demo"}
          </button>
          <button type="button" className="btn btn-primary px-7 py-3" onClick={() => setShowModal(true)}>
            ✦ Add a Book
          </button>
        </div>
      </section>

      {books.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8 p-5 rounded-2xl" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="text-center"><p className="text-2xl font-bold text-violet-300">{books.length}</p><p className="text-xs text-slate-400">Books</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-violet-300">{books.reduce((s, b) => s + b.pageCount, 0)}</p><p className="text-xs text-slate-400">Pages</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-violet-300">{books.reduce((s, b) => s + b.flashcardCount, 0)}</p><p className="text-xs text-slate-400">Cards</p></div>
        </div>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-5">Your Books</h2>
        {books.length === 0 ? (
          <p className="text-center py-12 text-slate-400">No books yet — add one above.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {books.map((book) => (
              <BookCard key={book.id} book={book} onDelete={(id) => setBooks((p) => p.filter((b) => b.id !== id))} />
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <NewBookModal
          onClose={() => setShowModal(false)}
          onCreated={(b) => { setBooks((p) => [b, ...p]); setShowModal(false); }}
        />
      )}
    </>
  );
}
