import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inventori GMI — PT Global Medika Indonesia",
  description: "Sistem Manajemen Inventori PT Global Medika Indonesia",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
