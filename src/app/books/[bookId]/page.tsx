"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface PageEntry { id: string; pageNumber: number; rawText: string; _count: { flashcards: number }; }
interface Book {
  id: string;
  title: string;
  author: string | null;
  subject: string | null;
  createdAt: string;
  pages: PageEntry[];
}

function AddPageForm({ bookId, onAdded }: { bookId: string; onAdded: (p: PageEntry) => void }) {
  const [activeTab, setActiveTab] = useState<"manual" | "pdf">("manual");
  
  // Tab 1 (Manual) state
  const [pageNumber, setPageNumber] = useState("");
  const [rawText, setRawText] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  // Tab 2 (PDF) state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentPageNum: number } | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pn = parseInt(pageNumber, 10);
    if (isNaN(pn) || pn < 1) { setError("Enter a valid page number."); return; }
    if (rawText.trim().length < 20) { setError("Page text must be at least 20 characters."); return; }
    setManualLoading(true); setError(""); setSuccess("");

    try {
      const res = await fetch(`/api/books/${bookId}/pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageNumber: pn, rawText }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Something went wrong."); return; }
      setSuccess(`✓ Generated ${data.flashcardCount} flashcards for page ${pn}!`);
      setPageNumber(""); setRawText("");
      onAdded({ id: data.pageId, pageNumber: pn, rawText, _count: { flashcards: data.flashcardCount } });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setManualLoading(false);
    }
  }

  async function handlePdfSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pdfFile) { setError("Please select a PDF file."); return; }
    setPdfLoading(true); setError(""); setSuccess(""); setBatchProgress(null);

    try {
      const formData = new FormData();
      formData.append("file", pdfFile);

      // 1. Send to server to parse PDF text page-by-page
      const uploadRes = await fetch(`/api/books/${bookId}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) { setError(uploadData.error || "Failed to parse PDF."); setPdfLoading(false); return; }

      const pagesToProcess = uploadData.pages;
      if (!pagesToProcess || pagesToProcess.length === 0) {
        setError("No pages with text could be extracted from this PDF.");
        setPdfLoading(false);
        return;
      }

      setBatchProgress({ current: 0, total: pagesToProcess.length, currentPageNum: pagesToProcess[0].pageNumber });

      // 2. Loop through pages sequentially and invoke Gemini flashcards generation
      let processedCount = 0;
      const failedPages: number[] = [];
      for (let i = 0; i < pagesToProcess.length; i++) {
        const page = pagesToProcess[i];
        setBatchProgress({ current: i + 1, total: pagesToProcess.length, currentPageNum: page.pageNumber });

        try {
          const pageRes = await fetch(`/api/books/${bookId}/pages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pageNumber: page.pageNumber, rawText: page.text }),
          });
          const pageData = await pageRes.json();
          if (pageRes.ok) {
            processedCount++;
            onAdded({
              id: pageData.pageId,
              pageNumber: page.pageNumber,
              rawText: page.text,
              _count: { flashcards: pageData.flashcardCount },
            });
          } else {
            failedPages.push(page.pageNumber);
          }
        } catch {
          failedPages.push(page.pageNumber);
        }
      }

      const failNote = failedPages.length ? ` Failed: ${failedPages.join(", ")}.` : "";
      setSuccess(`✓ Processed ${processedCount}/${pagesToProcess.length} pages.${failNote}`);
      setPdfFile(null);
    } catch {
      setError("An unexpected network error occurred while processing PDF.");
    } finally {
      setPdfLoading(false);
      setBatchProgress(null);
    }
  }

  return (
    <div className="card p-6">
      {/* Tabs */}
      <div className="flex mb-5 border-b" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "manual" ? "border-violet-500 text-white" : "border-transparent text-slate-400 hover:text-white"
          }`}
          onClick={() => { setActiveTab("manual"); setError(""); setSuccess(""); }}
        >
          📄 Paste Text
        </button>
        <button
          type="button"
          className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === "pdf" ? "border-violet-500 text-white" : "border-transparent text-slate-400 hover:text-white"
          }`}
          onClick={() => { setActiveTab("pdf"); setError(""); setSuccess(""); }}
        >
          📁 Upload PDF
        </button>
      </div>

      {activeTab === "manual" ? (
        <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>Manual Page Entry</h3>
          <div className="grid grid-cols-2 gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>Page Number</label>
              <input
                id="page-number-input"
                type="number"
                min={1}
                className="input"
                placeholder="e.g. 42"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
              />
            </div>
            <p className="text-xs pb-2" style={{ color: "var(--text-muted)" }}>
              Each page is stored separately so you can study by range.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Page Text <span style={{ color: "var(--accent-rose)" }}>*</span>
            </label>
            <textarea
              id="page-text-input"
              className="textarea"
              rows={7}
              placeholder="Paste the full text content of this page here…"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              {rawText.length} characters
            </p>
          </div>
          {error && <p className="text-sm" style={{ color: "var(--accent-rose)" }}>{error}</p>}
          {success && <p className="text-sm" style={{ color: "var(--accent-emerald)" }}>{success}</p>}
          <button id="generate-flashcards-btn" type="submit" className="btn btn-primary" disabled={manualLoading}>
            {manualLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating with Gemini…
              </span>
            ) : (
              "✦ Generate Flashcards"
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePdfSubmit} className="flex flex-col gap-4">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-secondary)" }}>Batch PDF Processing</h3>
          
          <div 
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-white/[0.02]" 
            style={{ 
              borderColor: pdfFile ? "var(--accent-violet)" : "var(--border)",
              boxShadow: pdfFile ? "0 0 16px rgba(124, 58, 237, 0.1)" : "none"
            }}
          >
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              id="pdf-upload-input"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              disabled={pdfLoading}
            />
            <label htmlFor="pdf-upload-input" className="cursor-pointer">
              <span className="block text-4xl mb-3">📚</span>
              <span className="block text-sm font-semibold text-white">
                {pdfFile ? pdfFile.name : "Select or drag textbook PDF"}
              </span>
              <span className="block text-xs text-slate-400 mt-1.5">
                {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : "Supports PDFs up to 50MB"}
              </span>
            </label>
          </div>

          {batchProgress && (
            <div className="p-4 rounded-xl bg-violet-950/10 border border-violet-500/15">
              <div className="flex justify-between text-xs mb-2 text-slate-300">
                <span>Processing page {batchProgress.currentPageNum} (AI batch generation)</span>
                <span>{batchProgress.current} of {batchProgress.total}</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm" style={{ color: "var(--accent-rose)" }}>{error}</p>}
          {success && <p className="text-sm" style={{ color: "var(--accent-emerald)" }}>{success}</p>}

          <button type="submit" className="btn btn-primary" disabled={pdfLoading || !pdfFile}>
            {pdfLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Batch generating flashcards…
              </span>
            ) : (
              "✦ Start PDF Flashcard Batch"
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function PageTile({ page, bookId, onDeleted }: { page: PageEntry; bookId: string; onDeleted: (id: string) => void }) {
  const [deleting, setDeleting] = useState(false);
  async function handleDelete() {
    if (!confirm(`Delete page ${page.pageNumber}?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/books/${bookId}/pages/${page.id}`, { method: "DELETE" });
      if (!res.ok) { alert("Failed to delete page."); return; }
      onDeleted(page.id);
    } finally {
      setDeleting(false);
    }
  }
  return (
    <div className="card p-4 flex flex-col items-center gap-2 text-center">
      <span className="text-lg font-bold text-violet-300">{page.pageNumber}</span>
      <span className="badge badge-emerald">{page._count.flashcards} cards</span>
      <button type="button" className="text-xs text-rose-400 opacity-70 hover:opacity-100" onClick={handleDelete} disabled={deleting}>
        {deleting ? "…" : "Remove"}
      </button>
    </div>
  );
}

function StudyRangeSelector({ bookId, pages }: { bookId: string; pages: PageEntry[] }) {
  const [from, setFrom] = useState("1");
  const [to, setTo] = useState("");
  const router = useRouter();
  const maxPage = pages.length > 0 ? Math.max(...pages.map((p) => p.pageNumber)) : 999;

  function handleStudy(e: React.FormEvent) {
    e.preventDefault();
    const f = parseInt(from, 10) || 1;
    const t = parseInt(to, 10) || maxPage;
    router.push(`/books/${bookId}/study?from=${f}&to=${t}`);
  }

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-base mb-1">Start a Study Session</h2>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
        Select a page range — all flashcards will be shuffled and presented randomly.
      </p>
      <form onSubmit={handleStudy} className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>From page</label>
          <input id="study-from" type="number" min={1} className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>To page</label>
          <input id="study-to" type="number" min={1} className="input" placeholder={`${maxPage}`} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button id="start-study-btn" type="submit" className="btn btn-primary" disabled={pages.length === 0}>
          Study →
        </button>
      </form>
      {pages.length === 0 && (
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>Add at least one page to start studying.</p>
      )}
    </div>
  );
}

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBook = useCallback(async () => {
    const res = await fetch(`/api/books/${bookId}`);
    if (!res.ok) { router.push("/"); return; }
    const data = await res.json();
    setBook(data);
    setLoading(false);
  }, [bookId, router]);

  useEffect(() => { fetchBook(); }, [fetchBook]);

  function handlePageAdded(page: PageEntry) {
    setBook((prev) => {
      if (!prev) return prev;
      const pages = [...prev.pages.filter((p) => p.pageNumber !== page.pageNumber), page].sort(
        (a, b) => a.pageNumber - b.pageNumber
      );
      return { ...prev, pages };
    });
  }

  function handlePageDeleted(pageId: string) {
    setBook((prev) => (prev ? { ...prev, pages: prev.pages.filter((p) => p.id !== pageId) } : prev));
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="skeleton h-48 w-full rounded-2xl" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <span style={{ color: "var(--text-secondary)" }}>{book.title}</span>
      </nav>

      {/* Book header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
          <div className="flex items-center gap-3 mt-2" style={{ color: "var(--text-secondary)" }}>
            {book.author && <span className="text-sm">{book.author}</span>}
            {book.subject && <span className="badge badge-violet">{book.subject}</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm shrink-0" style={{ color: "var(--text-secondary)" }}>
          <span>{book.pages.length} pages</span>
          <span>·</span>
          <span>{book.pages.reduce((s, p) => s + p._count.flashcards, 0)} cards</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AddPageForm bookId={bookId} onAdded={handlePageAdded} />
        <StudyRangeSelector bookId={bookId} pages={book.pages} />
      </div>

      {/* Pages list */}
      {book.pages.length > 0 && (
        <section>
          <h2 className="font-semibold text-base mb-4">Processed Pages</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {book.pages.map((page) => (
              <PageTile key={page.id} page={page} bookId={bookId} onDeleted={handlePageDeleted} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
