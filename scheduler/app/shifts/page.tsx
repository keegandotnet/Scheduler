import { supabase } from '../../lib/supabase';
import ShiftsTable from '../components/ShiftsTable';

export default async function ShiftsPage() {
  const [{ data: shifts }, { data: profiles }, { data: positions }] = await Promise.all([
    supabase.from('shifts').select('id, owner_id, position_id, start_time, end_time, status').order('start_time'),
    supabase.from('profiles').select('id, full_name'),
    supabase.from('positions').select('id, name'),
  ]);

  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  const positionMap = Object.fromEntries((positions ?? []).map((p) => [p.id, p.name]));

  return (
    <main>
      <ShiftsTable shifts={shifts ?? []} profileMap={profileMap} positionMap={positionMap} />
    </main>
  );
}
