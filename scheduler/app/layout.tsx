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
  const { data: claimsData } = await authClient.auth.getClaims();
  const claims = claimsData?.claims ?? null;

  let userName: string | null = null;
  let userRole: string | null = null;

  let pendingClaimsCount = 0;
  let newOffersCount = 0;

  if (claims) {
    const [{ data: profile }, { count: claimsCount }, { count: offersCount }] = await Promise.all([
      supabase.from('profiles').select('full_name, role').eq('id', claims.sub).single(),
      // Pending claims visible to managers
      supabase.from('shift_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      // Open offers the current user hasn't claimed yet (and didn't create)
      supabase.from('shift_offers').select('id', { count: 'exact', head: true }).eq('status', 'open').neq('offered_by', claims.sub),
    ]);
    userName = profile?.full_name ?? null;
    userRole = profile?.role ?? null;

    if (userRole === 'manager') pendingClaimsCount = claimsCount ?? 0;
    if (userRole === 'employee') newOffersCount = offersCount ?? 0;
  }

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {claims && (
          <nav className="site-nav">
            <span className="site-nav-brand">Scheduler</span>
            <Link href="/shifts">Shifts</Link>
            <Link href="/offers" className="nav-link-with-badge">
              Offers
              {newOffersCount > 0 && <span className="nav-badge">{newOffersCount}</span>}
            </Link>
            {userRole === 'manager' && (
              <Link href="/claims" className="nav-link-with-badge">
                Claims
                {pendingClaimsCount > 0 && <span className="nav-badge">{pendingClaimsCount}</span>}
              </Link>
            )}
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
