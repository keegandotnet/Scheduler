'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, User, Briefcase, Clock, Tag } from 'lucide-react';

type Shift = {
  id: string;
  owner_id: string;
  position_id: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Props = {
  shifts: Shift[];
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
  positionIds: string[];
};

const PX_PER_HOUR = 64;
const START_HOUR  = 6;
const END_HOUR    = 23;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const DAYS        = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const POSITION_COLORS = [
  '#6366f1', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f59e0b', '#ec4899',
];

function positionColor(positionIds: string[], positionId: string): string {
  const idx = positionIds.indexOf(positionId);
  return POSITION_COLORS[Math.max(0, idx) % POSITION_COLORS.length];
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function weekLabel(ws: Date): string {
  const we = addDays(ws, 6);
  if (ws.getMonth() === we.getMonth()) {
    return `${ws.toLocaleDateString('en-US', { month: 'long' })} ${ws.getDate()}–${we.getDate()}, ${ws.getFullYear()}`;
  }
  return `${ws.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${we.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${ws.getFullYear()}`;
}

function fmtHour(h: number): string {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h > 12 ? `${h - 12} PM` : `${h} AM`;
}

function fmtTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function fmtFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function fmtDuration(start: string, end: string): string {
  const h = (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60);
  return `${h % 1 === 0 ? h : h.toFixed(1)} hour${h !== 1 ? 's' : ''}`;
}

export default function WeekCalendar({ shifts, profileMap, positionMap, positionIds }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [selected, setSelected]   = useState<Shift | null>(null);
  const today    = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours    = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  const gridH    = TOTAL_HOURS * PX_PER_HOUR;

  return (
    <>
      <div className="calendar-container">
        {/* ── Top bar ─────────────────────────────────────────── */}
        <div className="calendar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="calendar-nav-btn" onClick={() => setWeekStart(w => addDays(w, -7))}>
              <ChevronLeft size={15} />
            </button>
            <button className="calendar-nav-btn" onClick={() => setWeekStart(w => addDays(w, 7))}>
              <ChevronRight size={15} />
            </button>
            <span className="calendar-week-label">{weekLabel(weekStart)}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            Today
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────── */}
        <div style={{ overflowY: 'auto', maxHeight: 620 }}>
          {/* Day header row */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff', zIndex: 20 }}>
            <div style={{ width: 56, flexShrink: 0 }} />
            {weekDays.map((day) => {
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  style={{ flex: 1, textAlign: 'center', padding: '0.5rem 0.25rem' }}
                  className={`calendar-day-header${isToday ? ' today' : ''}`}
                >
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: isToday ? '#6366f1' : '#6b7280', marginBottom: '0.15rem' }}>
                    {DAYS[day.getDay()]}
                  </div>
                  <div className="day-num" style={{ margin: '0 auto' }}>{day.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div style={{ display: 'flex', position: 'relative' }}>
            {/* Hour labels */}
            <div style={{ width: 56, flexShrink: 0 }}>
              {hours.map((h) => (
                <div key={h} style={{ height: PX_PER_HOUR, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end', paddingRight: '0.5rem', paddingTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.65rem', color: '#9ca3af', fontWeight: 500 }}>{fmtHour(h)}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dayShifts = shifts.filter((s) => isSameDay(new Date(s.start_time), day));
              return (
                <div key={day.toISOString()} style={{ flex: 1, borderLeft: '1px solid #f3f4f6', position: 'relative', height: gridH }}>
                  {hours.map((h) => (
                    <div key={h} style={{ position: 'absolute', top: (h - START_HOUR) * PX_PER_HOUR, left: 0, right: 0, borderTop: h === START_HOUR ? '1px solid #e5e7eb' : '1px solid #f3f4f6', height: PX_PER_HOUR }} />
                  ))}
                  {dayShifts.map((shift) => {
                    const start  = new Date(shift.start_time);
                    const end    = new Date(shift.end_time);
                    const topPx  = (start.getHours() - START_HOUR + start.getMinutes() / 60) * PX_PER_HOUR;
                    const dur    = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    const h      = Math.max(0.75, dur) * PX_PER_HOUR;
                    const color  = positionColor(positionIds, shift.position_id);
                    const isSelected = selected?.id === shift.id;

                    return (
                      <div
                        key={shift.id}
                        className="shift-block"
                        style={{
                          top: topPx, height: h, background: color,
                          outline: isSelected ? `2px solid #fff` : 'none',
                          boxShadow: isSelected ? `0 0 0 3px ${color}` : undefined,
                        }}
                        onClick={() => setSelected(shift)}
                        title={`${profileMap[shift.owner_id] ?? ''} · ${positionMap[shift.position_id] ?? ''}`}
                      >
                        <div className="shift-block-name">{profileMap[shift.owner_id] ?? 'Unknown'}</div>
                        {h > 40 && <div className="shift-block-time">{fmtTime(start)} – {fmtTime(end)}</div>}
                        {h > 64 && shift.status !== 'scheduled' && (
                          <div className="shift-block-badge">{shift.status.replace('_', ' ')}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Position color legend ────────────────────────────── */}
        {positionIds.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', padding: '0.85rem 1.25rem', borderTop: '1px solid #f3f4f6' }}>
            {positionIds.map((pid, idx) => (
              <div key={pid} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: '0.7rem', height: '0.7rem', borderRadius: '3px', background: POSITION_COLORS[idx % POSITION_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>{positionMap[pid] ?? pid}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Shift detail modal ───────────────────────────────── */}
      {selected && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 420, padding: '1.5rem', position: 'relative' }}>
            {/* Color accent bar */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: positionColor(positionIds, selected.position_id), borderRadius: '0.75rem 0.75rem 0 0' }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', marginTop: '0.25rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>Shift Details</h2>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#6b7280' }}>{fmtFullDate(selected.start_time)}</p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} style={{ marginTop: '-0.25rem' }}>
                <X size={15} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <DetailRow icon={<User size={15} color="#6366f1" />} label="Employee" value={profileMap[selected.owner_id] ?? selected.owner_id} />
              <DetailRow icon={<Briefcase size={15} color="#8b5cf6" />} label="Position" value={positionMap[selected.position_id] ?? selected.position_id} />
              <DetailRow
                icon={<Clock size={15} color="#0ea5e9" />}
                label="Time"
                value={`${fmtTime(new Date(selected.start_time))} – ${fmtTime(new Date(selected.end_time))} (${fmtDuration(selected.start_time, selected.end_time)})`}
              />
              <DetailRow
                icon={<Tag size={15} color="#14b8a6" />}
                label="Status"
                value={
                  <span className={`status-pill status-${selected.status}`}>
                    {selected.status.replace('_', ' ')}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{ width: '1.75rem', height: '1.75rem', borderRadius: '0.35rem', background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 70, fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: 500 }}>{value}</div>
    </div>
  );
}
