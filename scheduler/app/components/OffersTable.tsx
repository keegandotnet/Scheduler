'use client';

import { Fragment, useState } from 'react';
import { createClaim, withdrawClaim } from '../actions/offers';

type Shift = {
  id: string;
  position_id: string;
  start_time: string;
};

type Offer = {
  id: string;
  shift_id: string;
  offered_by: string;
  message: string | null;
};

type Props = {
  offers: Offer[];
  shiftMap: Record<string, Shift>;
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
  currentUserId?: string;
  myClaimByOfferId?: Record<string, { id: string; status: string }>;
};

export default function OffersTable({
  offers,
  shiftMap,
  profileMap,
  positionMap,
  currentUserId,
  myClaimByOfferId = {},
}: Props) {
  const [claimingOfferId, setClaimingOfferId] = useState<string | null>(null);
  const [claimMessage, setClaimMessage] = useState('');
  const [claimError, setClaimError] = useState('');

  async function submitClaim(offerId: string) {
    setClaimError('');
    const result = await createClaim(offerId, claimMessage);
    if (result?.error) {
      setClaimError(result.error);
    } else {
      setClaimingOfferId(null);
      setClaimMessage('');
    }
  }

  const colSpan = currentUserId ? 5 : 4;

  return (
    <>
      <h2>Open Shift Offers</h2>
      <table>
        <thead>
          <tr>
            <th>Offered By</th>
            <th>Position</th>
            <th>Shift Date</th>
            <th>Message</th>
            {currentUserId && <th></th>}
          </tr>
        </thead>
        <tbody>
          {offers.map((offer) => {
            const shift = shiftMap[offer.shift_id];
            const isOwn = offer.offered_by === currentUserId;
            const myClaim = myClaimByOfferId[offer.id];
            const isClaiming = claimingOfferId === offer.id;

            return (
              <Fragment key={offer.id}>
                <tr>
                  <td>{profileMap[offer.offered_by] ?? offer.offered_by}</td>
                  <td>{shift ? positionMap[shift.position_id] : '—'}</td>
                  <td>{shift ? new Date(shift.start_time).toLocaleString() : '—'}</td>
                  <td>{offer.message ?? '—'}</td>
                  {currentUserId && (
                    <td className="row-actions">
                      {isOwn ? (
                        <span className="offered-badge">Your offer</span>
                      ) : myClaim ? (
                        myClaim.status === 'pending' ? (
                          <>
                            <span className="offered-badge">Claimed</span>
                            <button
                              className="btn-delete"
                              onClick={() => withdrawClaim(myClaim.id)}
                            >
                              Withdraw
                            </button>
                          </>
                        ) : (
                          <span className="offered-badge">{myClaim.status}</span>
                        )
                      ) : (
                        <button
                          className="btn-offer"
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
                          placeholder="Add a message (optional)…"
                          value={claimMessage}
                          onChange={(e) => setClaimMessage(e.target.value)}
                          rows={2}
                        />
                        {claimError && <p className="inline-form-error">{claimError}</p>}
                        <div className="inline-form-actions">
                          <button className="btn-save" onClick={() => submitClaim(offer.id)}>Submit Claim</button>
                          <button className="btn-cancel" onClick={() => { setClaimingOfferId(null); setClaimError(''); }}>Cancel</button>
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
