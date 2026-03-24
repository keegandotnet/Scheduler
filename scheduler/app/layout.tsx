import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { createAuthClient } from '../lib/supabase-auth';
import { supabase } from '../lib/supabase';
import { logout } from './actions/auth';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Scheduler',
  description: 'Employee shift scheduler',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authClient = await createAuthClient();
  const { data: { claims } } = await authClient.auth.getClaims();

  let userName: string | null = null;
  let userRole: string | null = null;

  if (claims) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', claims.sub)
      .single();
    userName = profile?.full_name ?? null;
    userRole = profile?.role ?? null;
  }

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {claims && (
          <nav className="site-nav">
            <span className="site-nav-brand">Scheduler</span>
            <Link href="/shifts">Shifts</Link>
            {userRole === 'manager' && <Link href="/offers">Offers</Link>}
            {userRole === 'manager' && <Link href="/claims">Claims</Link>}
            <span className="site-nav-spacer" />
            <span className="site-nav-user">{userName}</span>
            <form action={logout}>
              <button type="submit" className="site-nav-logout">Sign Out</button>
            </form>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
