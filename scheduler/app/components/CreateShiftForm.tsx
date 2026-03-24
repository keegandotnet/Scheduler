'use client';

import { useActionState } from 'react';
import { createShift } from '../actions/shifts';

type Profile = { id: string; full_name: string };
type Position = { id: string; name: string };

type Props = {
  employees: Profile[];
  positions: Position[];
};

export default function CreateShiftForm({ employees, positions }: Props) {
  const [, action, pending] = useActionState(async (_: unknown, formData: FormData) => {
    await createShift(formData);
    return null;
  }, null);

  return (
    <form action={action} className="create-shift-form">
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
          <input name="start_time" type="datetime-local" required />
        </label>
        <label>
          End
          <input name="end_time" type="datetime-local" required />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Create Shift'}
        </button>
      </div>
    </form>
  );
}
