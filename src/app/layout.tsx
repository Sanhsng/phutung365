import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin", "vietnamese"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tra cứu & Báo giá Phụ tùng Cơ giới Miền Nam - Lonking OEM",
  description: "Hệ thống tra cứu thông số kỹ thuật, quản trị tồn kho và báo giá phụ tùng máy công trình Lonking, Komatsu, Caterpillar, Kobelco, Hitachi chuyên nghiệp.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-lonking-500 selection:text-slate-950">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
