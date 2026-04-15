import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "SUPABASE_KEEPALIVE // SYSTEM v2.0",
  description:
    ">> Secure Supabase Instance Management Terminal <<",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen overflow-x-hidden bg-background font-mono antialiased">
        <LanguageProvider>
          <div className="relative flex min-h-screen flex-col overflow-x-clip">
            <div className="flex-1 overflow-x-clip">{children}</div>
            <Footer />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
