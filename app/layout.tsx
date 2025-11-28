import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SparkLog",
  description: "AI Fragment Diary",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="text-slate-800 antialiased overflow-hidden h-screen selection:bg-aurora-purpleLight selection:text-aurora-purple">
        {children}
      </body>
    </html>
  );
}