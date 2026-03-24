'use client';

import { approveClaim, denyClaim } from '../actions/offers';

type Shift = {
  id: string;
  position_id: string;
  start_time: string;
};

type Offer = {
  id: string;
  shift_id: string;
};

type Claim = {
  id: string;
  offer_id: string;
  claimant_id: string;
  message: string | null;
  status: string;
};

type Props = {
  claims: Claim[];
  offerMap: Record<string, Offer>;
  shiftMap: Record<string, Shift>;
  profileMap: Record<string, string>;
  positionMap: Record<string, string>;
  isManager?: boolean;
};

export default function ClaimsTable({
  claims,
  offerMap,
  shiftMap,
  profileMap,
  positionMap,
  isManager = false,
}: Props) {
  return (
    <>
      <h2>Shift Claims</h2>
      <table>
        <thead>
          <tr>
            <th>Claimant</th>
            <th>Shift Date</th>
            <th>Position</th>
            <th>Message</th>
            <th>Status</th>
            {isManager && <th></th>}
          </tr>
        </thead>
        <tbody>
          {claims.map((claim) => {
            const offer = offerMap[claim.offer_id];
            const shift = offer ? shiftMap[offer.shift_id] : undefined;
            return (
              <tr key={claim.id}>
                <td>{profileMap[claim.claimant_id] ?? claim.claimant_id}</td>
                <td>{shift ? new Date(shift.start_time).toLocaleString() : '—'}</td>
                <td>{shift ? positionMap[shift.position_id] : '—'}</td>
                <td>{claim.message ?? '—'}</td>
                <td>{claim.status}</td>
                {isManager && (
                  <td className="row-actions">
                    {claim.status === 'pending' ? (
                      <>
                        <button className="btn-save" onClick={() => approveClaim(claim.id)}>
                          Approve
                        </button>
                        <button className="btn-delete" onClick={() => denyClaim(claim.id)}>
                          Deny
                        </button>
                      </>
                    ) : (
                      <span className="offered-badge">{claim.status}</span>
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
