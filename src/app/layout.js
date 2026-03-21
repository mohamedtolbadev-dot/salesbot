import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/shared/Providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cairo = Cairo({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "SalesBot.ma",
  description: "AI Sales Agent على واتساب",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${inter.variable} ${cairo.variable} font-arabic antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
