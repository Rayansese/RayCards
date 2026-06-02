import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ flashcardId: string }> }
) {
  try {
    const { flashcardId } = await params;
    const body = await req.json();
    const { front, back } = body;

    const existing = await prisma.flashcard.findUnique({ where: { id: flashcardId } });
    if (!existing) {
      return NextResponse.json({ error: "Flashcard not found" }, { status: 404 });
    }

    const data: { front?: string; back?: string } = {};
    if (typeof front === "string" && front.trim()) data.front = front.trim();
    if (typeof back === "string" && back.trim()) data.back = back.trim();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Provide front and/or back" }, { status: 400 });
    }

    const updated = await prisma.flashcard.update({ where: { id: flashcardId }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[PATCH flashcard]", error);
    return NextResponse.json({ error: "Failed to update flashcard" }, { status: 500 });
  }
}
