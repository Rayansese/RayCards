import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/books/[bookId] — get book details with all pages and flashcard counts
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    const book = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        pages: {
          orderBy: { pageNumber: "asc" },
          include: {
            _count: { select: { flashcards: true } },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error("[GET /api/books/[bookId]]", error);
    return NextResponse.json({ error: "Failed to fetch book" }, { status: 500 });
  }
}

// DELETE /api/books/[bookId] — delete book and cascade pages + flashcards
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    await prisma.book.delete({ where: { id: bookId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/books/[bookId]]", error);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
