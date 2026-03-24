'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { approveClaim, denyClaim } from '../actions/offers';

type Shift = { id: string; position_id: string; start_time: string };
type Offer = { id: string; shift_id: string; offered_by: string };
type Claim = { id: string; offer_id: string; claimant_id: string; message: string | null; status: string };

type Props = {
  claims: Claim[];
  offerMap: Record<string, Offer>;
  shiftMap: Record<string, Shift>;
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
  isManager?: boolean;
};

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function ClaimsTable({
  claims,
  offerMap,
  shiftMap,
  profileMap,
  positionMap,
  isManager = false,
}: Props) {
  const [showResolved, setShowResolved] = useState(false);

  const pendingClaims  = claims.filter((c) => c.status === 'pending');
  const resolvedClaims = claims.filter((c) => c.status !== 'pending');
  const visibleClaims  = showResolved ? claims : pendingClaims;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Shift Claims</h1>
        {resolvedClaims.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={() => setShowResolved((v) => !v)}>
            {showResolved ? 'Hide resolved' : `Show resolved (${resolvedClaims.length})`}
          </button>
        )}
      </div>
      <div className="page-body">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {visibleClaims.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
              No pending claims.
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Offered By</th>
                  <th>Claimant</th>
                  <th>Shift Date</th>
                  <th>Position</th>
                  <th>Note</th>
                  <th>Status</th>
                  {isManager && <th style={{ width: 1 }} />}
                </tr>
              </thead>
              <tbody>
                {visibleClaims.map((claim) => {
                  const offer   = offerMap[claim.offer_id];
                  const shift   = offer ? shiftMap[offer.shift_id] : undefined;
                  const isPending = claim.status === 'pending';

                  return (
                    <tr
                      key={claim.id}
                      className={
                        claim.status === 'rejected' ? 'row-rejected' :
                        claim.status === 'approved' ? 'row-approved' : ''
                      }
                    >
                      <td>{offer ? (profileMap[offer.offered_by] ?? offer.offered_by) : '—'}</td>
                      <td style={{ fontWeight: 500 }}>{profileMap[claim.claimant_id] ?? claim.claimant_id}</td>
                      <td>{shift ? fmtDateTime(shift.start_time) : '—'}</td>
                      <td>{shift ? positionMap[shift.position_id] : '—'}</td>
                      <td style={{ color: '#6b7280', fontStyle: claim.message ? 'normal' : 'italic' }}>
                        {claim.message ?? 'No note'}
                      </td>
                      <td>
                        <span className={`status-pill status-${claim.status}`}>{claim.status}</span>
                      </td>
                      {isManager && (
                        <td className="row-actions">
                          {isPending ? (
                            <>
                              <form action={approveClaim.bind(null, claim.id)} style={{ display: 'inline' }}>
                                <button type="submit" className="btn btn-primary btn-sm">
                                  <Check size={13} /> Approve
                                </button>
                              </form>
                              <form action={denyClaim.bind(null, claim.id)} style={{ display: 'inline' }}>
                                <button type="submit" className="btn btn-danger btn-sm">
                                  <X size={13} /> Deny
                                </button>
                              </form>
                            </>
                          ) : (
                            <span className={`status-pill status-${claim.status}`}>{claim.status}</span>
                          )}
                        </td>
                      )}
                    </tr>
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
