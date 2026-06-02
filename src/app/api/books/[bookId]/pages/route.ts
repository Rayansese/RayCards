import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFlashcards } from "@/lib/gemini";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function pagesRateLimitMax(): number {
  const n = parseInt(process.env.RATE_LIMIT_PAGES_PER_HOUR ?? "30", 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`pages:${ip}`, pagesRateLimitMax(), 60 * 60 * 1000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${limit.retryAfterSec ?? 60}s.` },
        { status: 429 }
      );
    }

    const { bookId } = await params;
    const body = await req.json();
    const { pageNumber, rawText } = body;

    if (typeof pageNumber !== "number" || pageNumber < 1) {
      return NextResponse.json({ error: "pageNumber must be a positive integer" }, { status: 400 });
    }
    if (!rawText || typeof rawText !== "string" || rawText.trim().length < 20) {
      return NextResponse.json({ error: "rawText must be at least 20 characters" }, { status: 400 });
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const existing = await prisma.page.findUnique({
      where: { bookId_pageNumber: { bookId, pageNumber } },
    });
    if (existing) {
      return NextResponse.json(
        { error: `Page ${pageNumber} already exists. Delete it first to regenerate.` },
        { status: 409 }
      );
    }

    const geminiResult = await generateFlashcards(rawText.trim(), pageNumber);

    const page = await prisma.page.create({
      data: {
        bookId,
        pageNumber,
        rawText: rawText.trim(),
        flashcards: {
          create: geminiResult.flashcards.map((fc) => ({
            front: fc.front,
            back: fc.back,
          })),
        },
      },
      include: { flashcards: true },
    });

    return NextResponse.json(
      {
        pageId: page.id,
        pageNumber: page.pageNumber,
        flashcardCount: page.flashcards.length,
        flashcards: page.flashcards,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/books/[bookId]/pages]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;
    const pages = await prisma.page.findMany({
      where: { bookId },
      orderBy: { pageNumber: "asc" },
      include: { _count: { select: { flashcards: true } } },
    });
    return NextResponse.json(pages);
  } catch (error) {
    console.error("[GET /api/books/[bookId]/pages]", error);
    return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 });
  }
}
