'use client';

import { createClaim } from '../actions/offers';

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
  claimedOfferIds?: Set<string>;
};

export default function OffersTable({
  offers,
  shiftMap,
  profileMap,
  positionMap,
  currentUserId,
  claimedOfferIds = new Set(),
}: Props) {
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
            const alreadyClaimed = claimedOfferIds.has(offer.id);

            return (
              <tr key={offer.id}>
                <td>{profileMap[offer.offered_by] ?? offer.offered_by}</td>
                <td>{shift ? positionMap[shift.position_id] : '—'}</td>
                <td>{shift ? new Date(shift.start_time).toLocaleString() : '—'}</td>
                <td>{offer.message ?? '—'}</td>
                {currentUserId && (
                  <td className="row-actions">
                    {isOwn ? (
                      <span className="offered-badge">Your offer</span>
                    ) : alreadyClaimed ? (
                      <span className="offered-badge">Claimed</span>
                    ) : (
                      <button className="btn-offer" onClick={() => createClaim(offer.id)}>
                        Claim
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
