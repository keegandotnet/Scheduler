import { redirect } from 'next/navigation';
import { CalendarDays, ArrowLeftRight, ClipboardList, Users, Clock, TrendingUp } from 'lucide-react';
import { createAuthClient } from '../../lib/supabase-auth';
import { supabase } from '../../lib/supabase';

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

function fmtDuration(start: string, end: string) {
  const h = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
  return `${h % 1 === 0 ? h : h.toFixed(1)}h`;
}

function weekBounds() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(now.getDate() - now.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start: start.toISOString(), end: end.toISOString() };
}

export default async function DashboardPage() {
  const authClient = await createAuthClient();
  const { data: claimsData } = await authClient.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  if (!claims) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', claims.sub)
    .single();

  const isManager = profile?.role === 'manager';
  const { start: weekStart, end: weekEnd } = weekBounds();
  const now = new Date().toISOString();

  const [
    { data: allShifts },
    { count: openOffersCount },
    { count: pendingClaimsCount },
    { data: profiles },
    { data: positions },
  ] = await Promise.all([
    supabase.from('shifts').select('id, owner_id, position_id, start_time, end_time, status').order('start_time'),
    supabase.from('shift_offers').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('shift_claims').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id, full_name, role'),
    supabase.from('positions').select('id, name'),
  ]);

  const profileMap  = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const positionMap = Object.fromEntries((positions ?? []).map((p) => [p.id, p.name]));
  const employeeCount = (profiles ?? []).filter((p) => p.role === 'employee').length;

  const allActive = (allShifts ?? []).filter((s) =>
    ['scheduled', 'offered', 'swap_pending'].includes(s.status) && s.end_time >= now
  );

  // Shifts this week (active, within current Sun–Sat)
  const shiftsThisWeek = allActive.filter(
    (s) => s.start_time >= weekStart && s.start_time < weekEnd
  );

  // Next 5 upcoming shifts (for the feed)
  const upcomingShifts = allActive.slice(0, 8);

  // For employees: only their own shifts
  const myUpcoming = allActive.filter((s) => s.owner_id === claims.sub).slice(0, 5);
  const myThisWeek = allActive.filter(
    (s) => s.owner_id === claims.sub && s.start_time >= weekStart && s.start_time < weekEnd
  );

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">{greeting}, {profile?.full_name?.split(' ')[0] ?? 'there'}</h1>
          <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="page-body">
        {/* ── Stat cards ─────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
          <StatCard
            icon={<CalendarDays size={18} />}
            label={isManager ? 'Shifts This Week' : 'My Shifts This Week'}
            value={isManager ? shiftsThisWeek.length : myThisWeek.length}
            color="#6366f1"
          />
          <StatCard
            icon={<ArrowLeftRight size={18} />}
            label="Open Offers"
            value={openOffersCount ?? 0}
            color="#f59e0b"
          />
          {isManager && (
            <StatCard
              icon={<ClipboardList size={18} />}
              label="Pending Claims"
              value={pendingClaimsCount ?? 0}
              color={pendingClaimsCount ? '#ef4444' : '#10b981'}
            />
          )}
          {isManager && (
            <StatCard
              icon={<Users size={18} />}
              label="Employees"
              value={employeeCount}
              color="#8b5cf6"
            />
          )}
          {!isManager && (
            <StatCard
              icon={<TrendingUp size={18} />}
              label="Total Upcoming"
              value={allActive.filter((s) => s.owner_id === claims.sub).length}
              color="#8b5cf6"
            />
          )}
        </div>

        {/* ── Upcoming shifts feed ───────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: isManager ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
          {/* Upcoming shifts list */}
          <div>
            <div className="section-header">
              <span className="section-title">{isManager ? 'Upcoming Shifts' : 'My Upcoming Shifts'}</span>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {(isManager ? upcomingShifts : myUpcoming).length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                  No upcoming shifts scheduled.
                </div>
              ) : (
                <div>
                  {(isManager ? upcomingShifts : myUpcoming).map((shift, i) => (
                    <div
                      key={shift.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        padding: '0.85rem 1.25rem',
                        borderBottom: i < (isManager ? upcomingShifts : myUpcoming).length - 1 ? '1px solid #f3f4f6' : 'none',
                      }}
                    >
                      <div style={{
                        width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem',
                        background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Clock size={14} color="#6366f1" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#111827' }}>
                          {profileMap[shift.owner_id] ?? 'Unknown'} · {positionMap[shift.position_id] ?? ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.1rem' }}>
                          {fmtDateTime(shift.start_time)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                          {fmtDuration(shift.start_time, shift.end_time)}
                        </span>
                        <span className={`status-pill status-${shift.status}`}>
                          {shift.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Manager: open offers + pending claims summary */}
          {isManager && (
            <div>
              <div className="section-header">
                <span className="section-title">Needs Attention</span>
              </div>
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <NeedsAttentionRow
                  icon={<ArrowLeftRight size={15} color="#f59e0b" />}
                  label="Open shift offers"
                  count={openOffersCount ?? 0}
                  href="/offers"
                  bg="#fffbeb"
                />
                <NeedsAttentionRow
                  icon={<ClipboardList size={15} color="#ef4444" />}
                  label="Pending swap claims"
                  count={pendingClaimsCount ?? 0}
                  href="/claims"
                  bg="#fef2f2"
                  last
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
      <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '0.6rem', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', lineHeight: 1.1, letterSpacing: '-0.03em' }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>{label}</div>
      </div>
    </div>
  );
}

function NeedsAttentionRow({ icon, label, count, href, bg, last }: { icon: React.ReactNode; label: string; count: number; href: string; bg: string; last?: boolean }) {
  return (
    <a
      href={href}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        padding: '1rem 1.25rem',
        borderBottom: last ? 'none' : '1px solid #f3f4f6',
        textDecoration: 'none',
        transition: 'background 0.15s',
      }}
      onMouseOver={(e) => (e.currentTarget.style.background = '#f9fafb')}
      onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div style={{ width: '2rem', height: '2rem', borderRadius: '0.4rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>{label}</span>
      <span style={{
        fontSize: '0.875rem', fontWeight: 700,
        color: count > 0 ? '#111827' : '#9ca3af',
      }}>
        {count}
      </span>
    </a>
  );
}
