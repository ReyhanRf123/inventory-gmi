import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const isTurso = Boolean(
    process.env.TURSO_DATABASE_URL ||
    process.env.TURSO_URL ||
    process.env.DATABASE_URL
  );
  const isVercel = process.env.VERCEL === "1";

  const formattedDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <DashboardShell
      session={session}
      isTurso={isTurso}
      isVercel={isVercel}
      formattedDate={formattedDate}
    >
      {children}
    </DashboardShell>
  );
}
