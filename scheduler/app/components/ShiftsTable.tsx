'use client';

import { Fragment, useState } from 'react';
import { deleteShift, updateShift } from '../actions/shifts';
import { createOffer } from '../actions/offers';

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
  shifts: Shift[];
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
  isManager?: boolean;
  employees?: Profile[];
  positions?: Position[];
  currentUserId?: string;
  offeredShiftIds?: Set<string>;
};

type Draft = {
  owner_id: string;
  position_id: string;
  start_time: string;
  end_time: string;
};

function toDateTimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ShiftsTable({
  shifts,
  profileMap,
  positionMap,
  isManager = false,
  employees = [],
  positions = [],
  currentUserId,
  offeredShiftIds = new Set(),
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [offeringShiftId, setOfferingShiftId] = useState<string | null>(null);
  const [offerMessage, setOfferMessage] = useState('');
  const [offerError, setOfferError] = useState('');

  function startEdit(shift: Shift) {
    setEditingId(shift.id);
    setDraft({
      owner_id: shift.owner_id,
      position_id: shift.position_id,
      start_time: toDateTimeLocal(shift.start_time),
      end_time: toDateTimeLocal(shift.end_time),
    });
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    const fd = new FormData();
    fd.set('id', id);
    fd.set('owner_id', draft.owner_id);
    fd.set('position_id', draft.position_id);
    fd.set('start_time', draft.start_time);
    fd.set('end_time', draft.end_time);
    await updateShift(fd);
    setEditingId(null);
    setDraft(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(null);
  }

  async function submitOffer(shiftId: string) {
    setOfferError('');
    const result = await createOffer(shiftId, offerMessage);
    if (result?.error) {
      setOfferError(result.error);
    } else {
      setOfferingShiftId(null);
      setOfferMessage('');
    }
  }

  const colSpan = isManager || !!currentUserId ? 6 : 5;

  return (
    <>
      <h1>Shifts</h1>
      <table>
        <thead>
          <tr>
            <th>Employee</th>
            <th>Position</th>
            <th>Start</th>
            <th>End</th>
            <th>Status</th>
            {(isManager || !!currentUserId) && <th></th>}
          </tr>
        </thead>
        <tbody>
          {shifts.map((shift) => {
            const isEditing = editingId === shift.id;
            const isOffering = offeringShiftId === shift.id;
            const isOwn = shift.owner_id === currentUserId;
            const alreadyOffered = offeredShiftIds.has(shift.id);

            return (
              <Fragment key={shift.id}>
                <tr>
                  {isEditing && draft ? (
                    <>
                      <td>
                        <select value={draft.owner_id} onChange={(e) => setDraft({ ...draft, owner_id: e.target.value })}>
                          {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                        </select>
                      </td>
                      <td>
                        <select value={draft.position_id} onChange={(e) => setDraft({ ...draft, position_id: e.target.value })}>
                          {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="datetime-local" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} />
                      </td>
                      <td>
                        <input type="datetime-local" value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} />
                      </td>
                      <td>{shift.status}</td>
                      <td className="row-actions">
                        <button className="btn-save" onClick={() => saveEdit(shift.id)}>Save</button>
                        <button className="btn-cancel" onClick={cancelEdit}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{profileMap[shift.owner_id] ?? shift.owner_id}</td>
                      <td>{positionMap[shift.position_id] ?? shift.position_id}</td>
                      <td>{new Date(shift.start_time).toLocaleString()}</td>
                      <td>{new Date(shift.end_time).toLocaleString()}</td>
                      <td>{shift.status}</td>
                      {isManager && (
                        <td className="row-actions">
                          <button className="btn-edit" onClick={() => startEdit(shift)}>Edit</button>
                          <button className="btn-delete" onClick={() => deleteShift(shift.id)}>Delete</button>
                        </td>
                      )}
                      {!isManager && isOwn && (
                        <td className="row-actions">
                          {alreadyOffered ? (
                            <span className="offered-badge">Offered</span>
                          ) : (
                            <button
                              className="btn-offer"
                              onClick={() => { setOfferingShiftId(shift.id); setOfferMessage(''); setOfferError(''); }}
                            >
                              Offer for Swap
                            </button>
                          )}
                        </td>
                      )}
                      {!isManager && !isOwn && <td />}
                    </>
                  )}
                </tr>

                {isOffering && (
                  <tr className="inline-form-row">
                    <td colSpan={colSpan}>
                      <div className="inline-form">
                        <textarea
                          placeholder="Add a message (optional)…"
                          value={offerMessage}
                          onChange={(e) => setOfferMessage(e.target.value)}
                          rows={2}
                        />
                        {offerError && <p className="inline-form-error">{offerError}</p>}
                        <div className="inline-form-actions">
                          <button className="btn-save" onClick={() => submitOffer(shift.id)}>Submit Offer</button>
                          <button className="btn-cancel" onClick={() => { setOfferingShiftId(null); setOfferError(''); }}>Cancel</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
