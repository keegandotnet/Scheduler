import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { CalendarDays, ArrowLeftRight, ClipboardList, LogOut } from 'lucide-react';
import { createAuthClient } from '../lib/supabase-auth';
import { supabase } from '../lib/supabase';
import { logout } from './actions/auth';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Scheduler',
  description: 'Employee shift scheduler',
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
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
      supabase.from('shift_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('shift_offers').select('id', { count: 'exact', head: true }).eq('status', 'open').neq('offered_by', claims.sub),
    ]);
    userName = profile?.full_name ?? null;
    userRole = profile?.role ?? null;
    if (userRole === 'manager') pendingClaimsCount = claimsCount ?? 0;
    if (userRole === 'employee') newOffersCount = offersCount ?? 0;
  }

  const initials = userName
    ? userName.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {claims ? (
          <div className="app-shell">
            <aside className="sidebar">
              <div className="sidebar-brand">
                <div className="sidebar-brand-icon">
                  <CalendarDays size={16} color="#fff" />
                </div>
                Scheduler
              </div>
              <hr className="sidebar-divider" />
              <nav className="sidebar-nav">
                <Link href="/shifts" className="sidebar-link">
                  <CalendarDays size={16} />
                  Shifts
                </Link>
                <Link href="/offers" className="sidebar-link">
                  <ArrowLeftRight size={16} />
                  Offers
                  {newOffersCount > 0 && (
                    <span className="sidebar-badge">{newOffersCount}</span>
                  )}
                </Link>
                {userRole === 'manager' && (
                  <Link href="/claims" className="sidebar-link">
                    <ClipboardList size={16} />
                    Claims
                    {pendingClaimsCount > 0 && (
                      <span className="sidebar-badge">{pendingClaimsCount}</span>
                    )}
                  </Link>
                )}
              </nav>
              <div className="sidebar-footer">
                <div className="sidebar-user">
                  <div className="sidebar-avatar">{initials}</div>
                  <div className="sidebar-user-info">
                    <div className="sidebar-user-name">{userName}</div>
                    <div className="sidebar-user-role">{userRole}</div>
                  </div>
                  <form action={logout}>
                    <button type="submit" className="sidebar-signout" title="Sign out">
                      <LogOut size={15} />
                    </button>
                  </form>
                </div>
              </div>
            </aside>
            <div className="main-content">{children}</div>
          </div>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
