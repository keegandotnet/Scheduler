'use client';

import { useRef } from 'react';
import { createShift } from '../actions/shifts';

type Profile = { id: string; full_name: string };
type Position = { id: string; name: string };

type Props = {
  employees: Profile[];
  positions: Position[];
};

export default function CreateShiftForm({ employees, positions }: Props) {
  const endTimeRef = useRef<HTMLInputElement>(null);

  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value || !endTimeRef.current) return;
    const end = new Date(new Date(e.target.value).getTime() + 4 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    endTimeRef.current.value = `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`;
  }

  return (
    <form action={createShift} className="create-shift-form">
      <h2>New Shift</h2>
      <div className="create-shift-fields">
        <label>
          Employee
          <select name="owner_id" required>
            <option value="">Select…</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name}</option>
            ))}
          </select>
        </label>
        <label>
          Position
          <select name="position_id" required>
            <option value="">Select…</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label>
          Start
          <input name="start_time" type="datetime-local" required onChange={handleStartChange} />
        </label>
        <label>
          End
          <input name="end_time" type="datetime-local" required ref={endTimeRef} />
        </label>
        <button type="submit">Create Shift</button>
      </div>
    </form>
  );
}
