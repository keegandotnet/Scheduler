'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { createShift } from '../actions/shifts';

type Profile  = { id: string; full_name: string };
type Position = { id: string; name: string };

type Props = { employees: Profile[]; positions: Position[] };

export default function CreateShiftForm({ employees, positions }: Props) {
  const [open, setOpen] = useState(false);
  const endTimeRef = useRef<HTMLInputElement>(null);

  function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.value || !endTimeRef.current) return;
    const end = new Date(new Date(e.target.value).getTime() + 4 * 60 * 60 * 1000);
    const p = (n: number) => String(n).padStart(2, '0');
    endTimeRef.current.value = `${end.getFullYear()}-${p(end.getMonth() + 1)}-${p(end.getDate())}T${p(end.getHours())}:${p(end.getMinutes())}`;
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen((v) => !v)}>
        {open ? <X size={15} /> : <Plus size={15} />}
        {open ? 'Cancel' : 'New Shift'}
      </button>

      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 520, padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>New Shift</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}><X size={15} /></button>
            </div>

            <form action={async (fd) => { await createShift(fd); setOpen(false); }}>
              <div className="form-row" style={{ marginBottom: '0.75rem' }}>
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">Employee</label>
                  <select name="owner_id" required className="form-select">
                    <option value="">Select employee…</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                  </select>
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">Position</label>
                  <select name="position_id" required className="form-select">
                    <option value="">Select position…</option>
                    {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">Start time</label>
                  <input name="start_time" type="datetime-local" required className="form-input" onChange={handleStartChange} />
                </div>
                <div className="form-field" style={{ flex: 1 }}>
                  <label className="form-label">End time</label>
                  <input name="end_time" type="datetime-local" required className="form-input" ref={endTimeRef} />
                </div>
              </div>
              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary"><Plus size={15} /> Create Shift</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
