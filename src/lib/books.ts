import { prisma } from "@/lib/prisma";
import { ensureDemoBook, shouldAutoSeed } from "@/lib/demo-seed";

export interface BookSummary {
  id: string;
  title: string;
  author: string | null;
  subject: string | null;
  createdAt: Date;
  pageCount: number;
  flashcardCount: number;
}

export async function listBooksWithCounts(): Promise<BookSummary[]> {
  let books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { pages: true } },
      pages: {
        include: { _count: { select: { flashcards: true } } },
      },
    },
  });

  if (books.length === 0 && shouldAutoSeed()) {
    await ensureDemoBook();
    books = await prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { pages: true } },
        pages: {
          include: { _count: { select: { flashcards: true } } },
        },
      },
    });
  }

  return books.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    subject: book.subject,
    createdAt: book.createdAt,
    pageCount: book._count.pages,
    flashcardCount: book.pages.reduce(
      (sum, page) => sum + page._count.flashcards,
      0
    ),
  }));
}

export function serializeBooksForClient(books: BookSummary[]) {
  return books.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  }));
}
