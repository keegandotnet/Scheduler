import { redirect } from 'next/navigation';
import { createAuthClient } from '../../lib/supabase-auth';
import { supabase } from '../../lib/supabase';
import ClaimsTable from '../components/ClaimsTable';

export default async function ClaimsPage() {
  const authClient = await createAuthClient();
  const { data: claimsData } = await authClient.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  if (!claims) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', claims.sub)
    .single();

  if (profile?.role !== 'manager') redirect('/shifts');

  const [{ data: shifts }, { data: profiles }, { data: positions }, { data: offers }, { data: shiftClaims }] = await Promise.all([
    supabase.from('shifts').select('id, position_id, start_time'),
    supabase.from('profiles').select('id, full_name'),
    supabase.from('positions').select('id, name'),
    supabase.from('shift_offers').select('id, shift_id, offered_by'),
    supabase.from('shift_claims').select('id, offer_id, claimant_id, message, status'),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const positionMap = Object.fromEntries((positions ?? []).map((p) => [p.id, p.name]));
  const shiftMap = Object.fromEntries((shifts ?? []).map((s) => [s.id, s]));
  const offerMap = Object.fromEntries((offers ?? []).map((o) => [o.id, o]));

  return (
    <main>
      <ClaimsTable
        claims={shiftClaims ?? []}
        offerMap={offerMap}
        shiftMap={shiftMap}
        profileMap={profileMap}
        positionMap={positionMap}
        isManager={true}
      />
    </main>
  );
}
