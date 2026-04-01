import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/db";
import PublicListClient from "./PublicListClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getList(slug: string) {
  const list = await prisma.wordList.findUnique({
    where: { slug },
    include: {
      items: { orderBy: { position: "asc" } },
    },
  });
  return list;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const list = await getList(slug);

  if (!list || list.isArchived) {
    return { title: "Liste introuvable — Dictou" };
  }

  return {
    title: `${list.name} — Dictou`,
    description: `Liste de ${list.items.length} mots à dicter. Copiez-la gratuitement sur Dictou.`,
    openGraph: {
      title: list.name,
      description: `${list.items.length} mots • Copiée ${list.copyCount} fois`,
    },
  };
}

export default async function PublicListPage({ params }: PageProps) {
  const { slug } = await params;
  const list = await getList(slug);

  if (!list || list.isArchived) {
    notFound();
  }

  return (
    <PublicListClient
      list={{
        name: list.name,
        slug: list.slug,
        copyCount: list.copyCount,
        items: list.items.map((i) => ({ id: i.id, word: i.word })),
      }}
    />
  );
}
