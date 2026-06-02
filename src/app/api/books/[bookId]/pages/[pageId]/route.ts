import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ bookId: string; pageId: string }> }
) {
  try {
    const { bookId, pageId } = await params;
    const page = await prisma.page.findFirst({ where: { id: pageId, bookId } });
    if (!page) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
    }
    await prisma.page.delete({ where: { id: pageId } });
    return NextResponse.json({ ok: true, pageNumber: page.pageNumber });
  } catch (error) {
    console.error("[DELETE page]", error);
    return NextResponse.json({ error: "Failed to delete page" }, { status: 500 });
  }
}
