import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpinScope — מה שהכתבה לא אמרה לך",
  description: "ניתוח ספין בכתבות חדשותיות עם AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
