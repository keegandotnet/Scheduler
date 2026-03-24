'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
const START_HOUR  = 6;   // 6 AM
const END_HOUR    = 23;  // 11 PM
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
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function weekLabel(ws: Date): string {
  const we = addDays(ws, 6);
  const sameMonth = ws.getMonth() === we.getMonth();
  if (sameMonth) {
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

export default function WeekCalendar({ shifts, profileMap, positionMap, positionIds }: Props) {
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours    = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);
  const gridH    = TOTAL_HOURS * PX_PER_HOUR;

  return (
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
      <div style={{ overflowY: 'auto', maxHeight: 640 }}>
        {/* Day header row */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, background: '#fff', zIndex: 20 }}>
          {/* Gutter spacer */}
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
              <div
                key={day.toISOString()}
                style={{
                  flex: 1,
                  borderLeft: '1px solid #f3f4f6',
                  position: 'relative',
                  height: gridH,
                }}
              >
                {/* Hour grid lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      position: 'absolute',
                      top: (h - START_HOUR) * PX_PER_HOUR,
                      left: 0, right: 0,
                      borderTop: h === START_HOUR ? '1px solid #e5e7eb' : '1px solid #f3f4f6',
                      height: PX_PER_HOUR,
                    }}
                  />
                ))}

                {/* Shift blocks */}
                {dayShifts.map((shift) => {
                  const start = new Date(shift.start_time);
                  const end   = new Date(shift.end_time);
                  const topPx = (start.getHours() - START_HOUR + start.getMinutes() / 60) * PX_PER_HOUR;
                  const dur   = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                  const h     = Math.max(0.75, dur) * PX_PER_HOUR;
                  const color = positionColor(positionIds, shift.position_id);

                  return (
                    <div
                      key={shift.id}
                      className="shift-block"
                      style={{ top: topPx, height: h, background: color }}
                      title={`${profileMap[shift.owner_id] ?? ''} · ${positionMap[shift.position_id] ?? ''} · ${fmtTime(start)}–${fmtTime(end)}`}
                    >
                      <div className="shift-block-name">{profileMap[shift.owner_id] ?? 'Unknown'}</div>
                      {h > 40 && (
                        <div className="shift-block-time">{fmtTime(start)} – {fmtTime(end)}</div>
                      )}
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
    </div>
  );
}
