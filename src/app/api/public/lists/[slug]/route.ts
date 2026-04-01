import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/public/lists/[slug] — route publique, pas d'authentification
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const list = await prisma.wordList.findUnique({
    where: { slug },
    include: {
      items: { orderBy: { position: "asc" } },
    },
  });

  if (!list || list.isArchived) {
    return NextResponse.json({ error: "Liste introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    list: {
      name: list.name,
      slug: list.slug,
      copyCount: list.copyCount,
      items: list.items.map((item) => ({ id: item.id, word: item.word })),
    },
  });
}
