'use client';

import { Fragment, useState } from 'react';
import { Pencil, Trash2, ArrowLeftRight, X, Check } from 'lucide-react';
import { deleteShift, updateShift } from '../actions/shifts';
import { createOffer, withdrawOffer } from '../actions/offers';

type Shift = {
  id: string;
  owner_id: string;
  position_id: string;
  start_time: string;
  end_time: string;
  status: string;
};

type Profile  = { id: string; full_name: string };
type Position = { id: string; name: string };

type Props = {
  shifts: Shift[];
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
  isManager?: boolean;
  employees?: Profile[];
  positions?: Position[];
  currentUserId?: string;
  myOpenOfferByShiftId?: Record<string, string>;
  title?: string;
  readonly?: boolean;
};

type Draft = { owner_id: string; position_id: string; start_time: string; end_time: string };

function toLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function ShiftsTable({
  shifts,
  profileMap,
  positionMap,
  isManager = false,
  employees = [],
  positions = [],
  currentUserId,
  myOpenOfferByShiftId = {},
  title = 'Shifts',
  readonly = false,
}: Props) {
  const [editingId, setEditingId]         = useState<string | null>(null);
  const [draft, setDraft]                 = useState<Draft | null>(null);
  const [offeringShiftId, setOfferingShiftId] = useState<string | null>(null);
  const [offerMessage, setOfferMessage]   = useState('');
  const [offerError, setOfferError]       = useState('');

  const hasActions = !readonly && (isManager || !!currentUserId);
  const colCount   = hasActions ? 6 : 5;

  function startEdit(s: Shift) {
    setEditingId(s.id);
    setDraft({ owner_id: s.owner_id, position_id: s.position_id, start_time: toLocal(s.start_time), end_time: toLocal(s.end_time) });
  }

  async function saveEdit(id: string) {
    if (!draft) return;
    const fd = new FormData();
    fd.set('id', id); fd.set('owner_id', draft.owner_id);
    fd.set('position_id', draft.position_id); fd.set('start_time', draft.start_time);
    fd.set('end_time', draft.end_time);
    await updateShift(fd);
    setEditingId(null); setDraft(null);
  }

  async function submitOffer(shiftId: string) {
    setOfferError('');
    const result = await createOffer(shiftId, offerMessage);
    if (result?.error) { setOfferError(result.error); }
    else { setOfferingShiftId(null); setOfferMessage(''); }
  }

  if (shifts.length === 0 && !readonly) return null;

  return (
    <div>
      <div className="section-header">
        <span className="section-title">{title}</span>
        <span className="section-count">{shifts.length} shift{shifts.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {shifts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
            No shifts to display.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Position</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
                {hasActions && <th style={{ width: 1 }} />}
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => {
                const isEditing  = editingId === shift.id;
                const isOffering = offeringShiftId === shift.id;
                const isOwn      = shift.owner_id === currentUserId;
                const myOfferId  = myOpenOfferByShiftId[shift.id];
                const alreadyOffered = !!myOfferId;

                return (
                  <Fragment key={shift.id}>
                    <tr>
                      {isEditing && draft ? (
                        <>
                          <td>
                            <select className="form-select" value={draft.owner_id} onChange={(e) => setDraft({ ...draft, owner_id: e.target.value })}>
                              {employees.map((e) => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="form-select" value={draft.position_id} onChange={(e) => setDraft({ ...draft, position_id: e.target.value })}>
                              {positions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td><input className="form-input" style={{ padding: '0.4rem 0.6rem' }} type="datetime-local" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value })} /></td>
                          <td><input className="form-input" style={{ padding: '0.4rem 0.6rem' }} type="datetime-local" value={draft.end_time} onChange={(e) => setDraft({ ...draft, end_time: e.target.value })} /></td>
                          <td><span className={`status-pill status-${shift.status}`}>{shift.status.replace('_', ' ')}</span></td>
                          <td className="row-actions">
                            <button className="btn btn-primary btn-sm" onClick={() => saveEdit(shift.id)}><Check size={13} /> Save</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setEditingId(null); setDraft(null); }}><X size={13} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontWeight: 500 }}>{profileMap[shift.owner_id] ?? shift.owner_id}</td>
                          <td>{positionMap[shift.position_id] ?? shift.position_id}</td>
                          <td>{fmtDateTime(shift.start_time)}</td>
                          <td>{fmtDateTime(shift.end_time)}</td>
                          <td><span className={`status-pill status-${shift.status}`}>{shift.status.replace('_', ' ')}</span></td>
                          {!readonly && isManager && (
                            <td className="row-actions">
                              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(shift)}><Pencil size={13} /></button>
                              <button className="btn btn-danger btn-sm" onClick={() => deleteShift(shift.id)}><Trash2 size={13} /></button>
                            </td>
                          )}
                          {!readonly && !isManager && isOwn && (
                            <td className="row-actions">
                              {alreadyOffered ? (
                                <>
                                  <span className="offered-badge">Offered</span>
                                  <button className="btn btn-danger btn-sm" onClick={() => withdrawOffer(myOfferId)}><X size={13} /> Cancel</button>
                                </>
                              ) : (
                                <button
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => { setOfferingShiftId(shift.id); setOfferMessage(''); setOfferError(''); }}
                                >
                                  <ArrowLeftRight size={13} /> Swap
                                </button>
                              )}
                            </td>
                          )}
                          {!readonly && !isManager && !isOwn && <td />}
                        </>
                      )}
                    </tr>

                    {isOffering && (
                      <tr className="inline-form-row">
                        <td colSpan={colCount}>
                          <div className="inline-form">
                            <textarea
                              className="inline-form"
                              placeholder="Add a note for the manager (optional)…"
                              value={offerMessage}
                              onChange={(e) => setOfferMessage(e.target.value)}
                              rows={2}
                              style={{ fontFamily: 'inherit' }}
                            />
                            {offerError && <p className="inline-form-error">{offerError}</p>}
                            <div className="inline-form-actions">
                              <button className="btn btn-primary btn-sm" onClick={() => submitOffer(shift.id)}>Submit Offer</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setOfferingShiftId(null); setOfferError(''); }}>Cancel</button>
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
        )}
      </div>
    </div>
  );
}
