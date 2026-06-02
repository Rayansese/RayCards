import { NextResponse } from "next/server";
import { ensureDemoBook } from "@/lib/demo-seed";

export async function GET() {
  try {
    const book = await ensureDemoBook();
    const flashcardCount = book.pages.reduce(
      (sum, p) => sum + p._count.flashcards,
      0
    );
    return NextResponse.json({
      bookId: book.id,
      title: book.title,
      pageCount: book.pages.length,
      flashcardCount,
      studyUrl: `/books/${book.id}/study?from=1&to=3`,
    });
  } catch (error) {
    console.error("[GET /api/demo]", error);
    return NextResponse.json({ error: "Failed to load demo book" }, { status: 500 });
  }
}
