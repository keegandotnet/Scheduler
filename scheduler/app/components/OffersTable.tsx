'use client';

import { Fragment, useState } from 'react';
import { X } from 'lucide-react';
import { createClaim, withdrawClaim } from '../actions/offers';

type Shift = { id: string; position_id: string; start_time: string };
type Offer = { id: string; shift_id: string; offered_by: string; message: string | null };

type Props = {
  offers: Offer[];
  shiftMap: Record<string, Shift>;
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
  currentUserId?: string;
  myClaimByOfferId?: Record<string, { id: string; status: string }>;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function OffersTable({
  offers,
  shiftMap,
  profileMap,
  positionMap,
  currentUserId,
  myClaimByOfferId = {},
}: Props) {
  const [claimingOfferId, setClaimingOfferId] = useState<string | null>(null);
  const [claimMessage, setClaimMessage]       = useState('');
  const [claimError, setClaimError]           = useState('');

  async function submitClaim(offerId: string) {
    setClaimError('');
    const result = await createClaim(offerId, claimMessage);
    if (result?.error) { setClaimError(result.error); }
    else { setClaimingOfferId(null); setClaimMessage(''); }
  }

  const colSpan = currentUserId ? 5 : 4;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Open Shift Offers</h1>
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {offers.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              No open offers right now.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Offered By</th>
                  <th>Position</th>
                  <th>Shift Date</th>
                  <th>Note</th>
                  {currentUserId && <th style={{ width: 1 }} />}
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => {
                  const shift        = shiftMap[offer.shift_id];
                  const isOwn        = offer.offered_by === currentUserId;
                  const myClaim      = myClaimByOfferId[offer.id];
                  const isClaiming   = claimingOfferId === offer.id;

                  return (
                    <Fragment key={offer.id}>
                      <tr>
                        <td style={{ fontWeight: 500 }}>{profileMap[offer.offered_by] ?? offer.offered_by}</td>
                        <td>{shift ? positionMap[shift.position_id] : '—'}</td>
                        <td>{shift ? fmtDateTime(shift.start_time) : '—'}</td>
                        <td style={{ color: '#6b7280', fontStyle: offer.message ? 'normal' : 'italic' }}>
                          {offer.message ?? 'No note'}
                        </td>
                        {currentUserId && (
                          <td className="row-actions">
                            {isOwn ? (
                              <span className="offered-badge">Your offer</span>
                            ) : myClaim ? (
                              myClaim.status === 'pending' ? (
                                <>
                                  <span className={`status-pill status-pending`}>Claimed</span>
                                  <button className="btn btn-danger btn-sm" onClick={() => withdrawClaim(myClaim.id)}>
                                    <X size={13} /> Withdraw
                                  </button>
                                </>
                              ) : (
                                <span className={`status-pill status-${myClaim.status}`}>{myClaim.status}</span>
                              )
                            ) : (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => { setClaimingOfferId(offer.id); setClaimMessage(''); setClaimError(''); }}
                              >
                                Claim
                              </button>
                            )}
                          </td>
                        )}
                      </tr>

                      {isClaiming && (
                        <tr className="inline-form-row">
                          <td colSpan={colSpan}>
                            <div className="inline-form">
                              <textarea
                                placeholder="Add a note for the manager (optional)…"
                                value={claimMessage}
                                onChange={(e) => setClaimMessage(e.target.value)}
                                rows={2}
                                style={{ fontFamily: 'inherit' }}
                              />
                              {claimError && <p className="inline-form-error">{claimError}</p>}
                              <div className="inline-form-actions">
                                <button className="btn btn-primary btn-sm" onClick={() => submitClaim(offer.id)}>Submit Claim</button>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setClaimingOfferId(null); setClaimError(''); }}>Cancel</button>
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
    </>
  );
}
