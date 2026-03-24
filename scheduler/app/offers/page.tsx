import { redirect } from 'next/navigation';
import { createAuthClient } from '../../lib/supabase-auth';
import { supabase } from '../../lib/supabase';
import OffersTable from '../components/OffersTable';

export default async function OffersPage() {
  const authClient = await createAuthClient();
  const { data: claimsData } = await authClient.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  if (!claims) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', claims.sub)
    .single();

  const isEmployee = profile?.role === 'employee';

  const [{ data: shifts }, { data: profiles }, { data: positions }, { data: offers }, { data: myClaims }] = await Promise.all([
    supabase.from('shifts').select('id, position_id, start_time'),
    supabase.from('profiles').select('id, full_name'),
    supabase.from('positions').select('id, name'),
    supabase.from('shift_offers').select('id, shift_id, offered_by, message, status').eq('status', 'open'),
    supabase.from('shift_claims').select('id, offer_id, status').eq('claimant_id', claims.sub),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const positionMap = Object.fromEntries((positions ?? []).map((p) => [p.id, p.name]));
  const shiftMap = Object.fromEntries((shifts ?? []).map((s) => [s.id, s]));

  // offer_id → { id, status } for current user's claims
  const myClaimByOfferId: Record<string, { id: string; status: string }> = Object.fromEntries(
    (myClaims ?? []).map((c) => [c.offer_id, { id: c.id, status: c.status }])
  );

  return (
    <main>
      <OffersTable
        offers={offers ?? []}
        shiftMap={shiftMap}
        profileMap={profileMap}
        positionMap={positionMap}
        currentUserId={isEmployee ? claims.sub : undefined}
        myClaimByOfferId={myClaimByOfferId}
      />
    </main>
  );
}
