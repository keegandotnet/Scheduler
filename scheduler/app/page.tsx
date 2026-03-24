import { supabase } from '../lib/supabase';
import ShiftsTable from './components/ShiftsTable';
import OffersTable from './components/OffersTable';
import ClaimsTable from './components/ClaimsTable';

export default async function Home() {
  const [{ data: shifts }, { data: profiles }, { data: positions }, { data: offers }, { data: claims }] = await Promise.all([
    supabase.from('shifts').select('id, owner_id, position_id, start_time, end_time, status').order('start_time'),
    supabase.from('profiles').select('id, full_name'),
    supabase.from('positions').select('id, name'),
    supabase.from('shift_offers').select('id, shift_id, offered_by, message, status').eq('status', 'open'),
    supabase.from('shift_claims').select('id, offer_id, claimant_id, message, status'),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const positionMap = Object.fromEntries((positions ?? []).map((p) => [p.id, p.name]));
  const shiftMap = Object.fromEntries((shifts ?? []).map((s) => [s.id, s]));
  const offerMap = Object.fromEntries((offers ?? []).map((o) => [o.id, o]));

  return (
    <main>
      <ShiftsTable shifts={shifts ?? []} profileMap={profileMap} positionMap={positionMap} />
      <OffersTable offers={offers ?? []} shiftMap={shiftMap} profileMap={profileMap} positionMap={positionMap} />
      <ClaimsTable claims={claims ?? []} offerMap={offerMap} shiftMap={shiftMap} profileMap={profileMap} positionMap={positionMap} />
    </main>
  );
}
