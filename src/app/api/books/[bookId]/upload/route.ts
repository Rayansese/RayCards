import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractTextFromPdf } from "@/lib/pdf-extract";

const MAX_FILE_BYTES = 50 * 1024 * 1024;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const { bookId } = await params;

    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File exceeds 50MB limit." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { pages, totalPages } = await extractTextFromPdf(buffer);

    return NextResponse.json({
      bookId,
      fileName: file.name,
      totalPages,
      pages,
    });
  } catch (error) {
    console.error("[POST /api/books/[bookId]/upload]", error);
    return NextResponse.json(
      { error: "Failed to parse PDF file. Ensure it is not password-protected." },
      { status: 500 }
    );
  }
}
