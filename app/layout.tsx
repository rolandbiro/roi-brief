import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "ROI Works - Kampány Brief",
  description: "AI-asszisztált kampány brief kitöltés",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hu">
      <body className="min-h-screen antialiased">
        <Header />
        <main className="pt-20">{children}</main>
      </body>
    </html>
  );
}
