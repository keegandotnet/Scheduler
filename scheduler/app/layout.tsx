import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Scheduler",
  description: "Employee shift scheduler",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <nav className="site-nav">
          <span className="site-nav-brand">Scheduler</span>
          <Link href="/shifts">Shifts</Link>
          <Link href="/offers">Offers</Link>
          <Link href="/claims">Claims</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
