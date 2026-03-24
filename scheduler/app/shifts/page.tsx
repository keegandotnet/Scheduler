import { redirect } from 'next/navigation';
import { createAuthClient } from '../../lib/supabase-auth';
import { supabase } from '../../lib/supabase';
import ShiftsTable from '../components/ShiftsTable';
import CreateShiftForm from '../components/CreateShiftForm';

const ACTIVE_STATUSES = ['scheduled', 'offered', 'swap_pending'];

export default async function ShiftsPage() {
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
  const now = new Date().toISOString();

  const [{ data: allShifts }, { data: profiles }, { data: positions }, { data: myOpenOffers }] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, owner_id, position_id, start_time, end_time, status')
      .order('start_time')
      .then((res) => {
        if (isEmployee) {
          return { data: (res.data ?? []).filter((s) => s.owner_id === claims.sub) };
        }
        return res;
      }),
    supabase.from('profiles').select('id, full_name, role'),
    supabase.from('positions').select('id, name'),
    // Only need current user's own open offers (for the withdraw button)
    supabase
      .from('shift_offers')
      .select('id, shift_id')
      .eq('offered_by', claims.sub)
      .eq('status', 'open'),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const positionMap = Object.fromEntries((positions ?? []).map((p) => [p.id, p.name]));

  const employees = (profiles ?? [])
    .filter((p) => p.role === 'employee')
    .map(({ id, full_name }) => ({ id, full_name }));

  const positionList = (positions ?? []).map(({ id, name }) => ({ id, name }));

  // shift_id → offer_id for current user's open offers
  const myOpenOfferByShiftId: Record<string, string> = Object.fromEntries(
    (myOpenOffers ?? []).map((o) => [o.shift_id, o.id])
  );

  const activeShifts = (allShifts ?? []).filter(
    (s) => s.end_time >= now && ACTIVE_STATUSES.includes(s.status)
  );
  const pastShifts = (allShifts ?? []).filter(
    (s) => s.end_time < now && s.status !== 'completed'
  );
  const completedShifts = (allShifts ?? []).filter((s) => s.status === 'completed');

  return (
    <main>
      {!isEmployee && (
        <CreateShiftForm employees={employees} positions={positionList} />
      )}
      <ShiftsTable
        shifts={activeShifts}
        profileMap={profileMap}
        positionMap={positionMap}
        isManager={!isEmployee}
        employees={employees}
        positions={positionList}
        currentUserId={isEmployee ? claims.sub : undefined}
        myOpenOfferByShiftId={myOpenOfferByShiftId}
      />
      {pastShifts.length > 0 && (
        <ShiftsTable
          shifts={pastShifts}
          profileMap={profileMap}
          positionMap={positionMap}
          isManager={false}
          employees={[]}
          positions={positionList}
          title="Past Shifts"
          readonly
        />
      )}
      {completedShifts.length > 0 && (
        <ShiftsTable
          shifts={completedShifts}
          profileMap={profileMap}
          positionMap={positionMap}
          isManager={false}
          employees={[]}
          positions={positionList}
          title="Completed Swaps"
          readonly
        />
      )}
    </main>
  );
}
