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

  const targetWords = words.slice(0, 3);
  const optionalWords = words.slice(3, 7);

  const generated = await generateDictationSentence({
    targetWords,
    optionalWords,
    level: level || "cp",
    previousSentences: previousSentences?.slice(0, 5) || [],
  });

  return NextResponse.json({ sentence: generated.text });
}
