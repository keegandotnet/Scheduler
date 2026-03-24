'use client';

import { useState } from 'react';
import { CalendarDays, List } from 'lucide-react';
import WeekCalendar from './WeekCalendar';
import ShiftsTable from './ShiftsTable';

type Shift = {
  id: string;
  owner_id: string;
  position_id: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Profile = { id: string; full_name: string };
type Position = { id: string; name: string };

type Props = {
  activeShifts: Shift[];
  pastShifts: Shift[];
  completedShifts: Shift[];
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
  positionIds: string[];
  isManager: boolean;
  employees: Profile[];
  positions: Position[];
  currentUserId?: string;
  myOpenOfferByShiftId: Record<string, string>;
};

export default function ShiftsView({
  activeShifts,
  pastShifts,
  completedShifts,
  profileMap,
  positionMap,
  positionIds,
  isManager,
  employees,
  positions,
  currentUserId,
  myOpenOfferByShiftId,
}: Props) {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
          <button
            onClick={() => setView('calendar')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 500,
              border: 'none', cursor: 'pointer',
              background: view === 'calendar' ? '#6366f1' : '#fff',
              color: view === 'calendar' ? '#fff' : '#6b7280',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <CalendarDays size={14} /> Calendar
          </button>
          <button
            onClick={() => setView('list')}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.4rem 0.85rem', fontSize: '0.8rem', fontWeight: 500,
              border: 'none', borderLeft: '1px solid #e5e7eb', cursor: 'pointer',
              background: view === 'list' ? '#6366f1' : '#fff',
              color: view === 'list' ? '#fff' : '#6b7280',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <List size={14} /> List
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <WeekCalendar
          shifts={activeShifts}
          profileMap={profileMap}
          positionMap={positionMap}
          positionIds={positionIds}
        />
      ) : (
        <>
          <ShiftsTable
            shifts={activeShifts}
            profileMap={profileMap}
            positionMap={positionMap}
            isManager={isManager}
            employees={employees}
            positions={positions}
            currentUserId={currentUserId}
            myOpenOfferByShiftId={myOpenOfferByShiftId}
            title="Active Shifts"
          />
          {pastShifts.length > 0 && (
            <ShiftsTable
              shifts={pastShifts}
              profileMap={profileMap}
              positionMap={positionMap}
              title="Past Shifts"
              readonly
            />
          )}
          {completedShifts.length > 0 && (
            <ShiftsTable
              shifts={completedShifts}
              profileMap={profileMap}
              positionMap={positionMap}
              title="Completed Swaps"
              readonly
            />
          )}
        </>
      )}
    </div>
  );
}
