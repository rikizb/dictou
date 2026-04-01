import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-purple-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-purple-700">
            <span>✏️</span>
            <span>Dictou</span>
          </Link>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <Link
              href="/dashboard"
              className="px-2 py-2 sm:px-3 sm:py-1.5 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
            >
              <span>🏠</span><span className="hidden sm:inline"> Accueil</span>
            </Link>
            <Link
              href="/practice"
              className="px-2 py-2 sm:px-3 sm:py-1.5 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
            >
              <span>🎯</span><span className="hidden sm:inline"> Pratiquer</span>
            </Link>
            <Link
              href="/words"
              className="px-2 py-2 sm:px-3 sm:py-1.5 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
            >
              <span>📚</span><span className="hidden sm:inline"> Mes mots</span>
            </Link>
            <Link
              href="/stats"
              className="px-2 py-2 sm:px-3 sm:py-1.5 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition"
            >
              <span>📊</span><span className="hidden sm:inline"> Stats</span>
            </Link>
            <div className="ml-1 sm:ml-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-5xl mx-auto px-4 py-4 sm:py-8">{children}</main>
    </div>
  );
}
