import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ANF Workforce - PT ANF Group",
  description: "Human Resource Management System - PT ANF Group",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-background text-[#1e293b] min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
