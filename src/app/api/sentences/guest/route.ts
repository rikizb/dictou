import { NextRequest, NextResponse } from "next/server";
import { generateDictationSentence } from "@/lib/claude";

// POST /api/sentences/guest — génère une phrase sans auth (mode invité)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { words, level, previousSentences } = body as {
    words: string[];
    level?: "cp" | "ce1" | "ce2" | "cm1" | "cm2";
    previousSentences?: string[];
  };

  if (!words || words.length === 0) {
    return NextResponse.json({ error: "Aucun mot fourni" }, { status: 400 });
  }

  // Adapter le nombre de mots requis au niveau
  const maxRequired: Record<string, number> = { cp: 3, ce1: 4, ce2: 5, cm1: 5, cm2: 6 };
  const max = maxRequired[level || "cp"] || 4;
  const targetWords = words.slice(0, max);
  const optionalWords = words.slice(max, max + 3);

  const generated = await generateDictationSentence({
    targetWords,
    optionalWords,
    level: level || "cp",
    previousSentences: previousSentences?.slice(0, 5) || [],
  });

  return NextResponse.json({ sentence: generated.text });
}
