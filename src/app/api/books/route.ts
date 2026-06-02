import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { listBooksWithCounts, serializeBooksForClient } from "@/lib/books";

export async function GET() {
  try {
    const books = await listBooksWithCounts();
    return NextResponse.json(serializeBooksForClient(books));
  } catch (error) {
    console.error("[GET /api/books]", error);
    return NextResponse.json({ error: "Failed to fetch books" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, author, subject } = body;

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Book title is required" }, { status: 400 });
    }

    const book = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author?.trim() || null,
        subject: subject?.trim() || null,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("[POST /api/books]", error);
    return NextResponse.json({ error: "Failed to create book" }, { status: 500 });
  }
}
