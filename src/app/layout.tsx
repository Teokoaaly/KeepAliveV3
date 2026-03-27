import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "SUPABASE_KEEPALIVE // SYSTEM v2.0",
  description:
    ">> Secure Supabase Instance Management Terminal <<",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background font-mono antialiased">
        <LanguageProvider>
          <div className="relative min-h-screen flex flex-col">
            <div className="flex-1">{children}</div>
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
