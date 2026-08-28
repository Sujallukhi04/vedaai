import "./globals.css";
import React from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { AppShell } from "@/components/AppShell";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-bricolage",
  display: "swap",
});

export const metadata = {
  title: "VedaAI - AI Assessment Extraction & Answer Mapping",
  description: "Automated question extraction, handwritten answer mapping, and AI teacher assessment tool.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/veda_logo.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.png",
    apple: "/veda_logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable}`}
    >
      <body className="font-sans antialiased bg-[#f1f3f6] text-slate-900 min-h-screen">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
