import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Fisher-Yates shuffle
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// GET /api/books/[bookId]/study?from=1&to=10
// Returns all flashcards for the specified page range, shuffled
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    const { searchParams } = new URL(req.url);
    const from = parseInt(searchParams.get("from") ?? "1", 10);
    const to = parseInt(searchParams.get("to") ?? "9999", 10);

    if (isNaN(from) || isNaN(to) || from < 1 || to < from) {
      return NextResponse.json(
        { error: "Invalid page range. 'from' and 'to' must be positive integers with from <= to." },
        { status: 400 }
      );
    }

    const pages = await prisma.page.findMany({
      where: {
        bookId: bookId,
        pageNumber: { gte: from, lte: to },
      },
      include: {
        flashcards: true,
      },
      orderBy: { pageNumber: "asc" },
    });

    const allFlashcards = pages.flatMap((page) =>
      page.flashcards.map((fc) => ({
        id: fc.id,
        front: fc.front,
        back: fc.back,
        pageNumber: page.pageNumber,
      }))
    );

    const shuffled = shuffle(allFlashcards);

    return NextResponse.json({
      bookId: bookId,
      from,
      to,
      totalCards: shuffled.length,
      flashcards: shuffled,
    });
  } catch (error) {
    console.error("[GET /api/books/[bookId]/study]", error);
    return NextResponse.json({ error: "Failed to fetch study cards" }, { status: 500 });
  }
}
