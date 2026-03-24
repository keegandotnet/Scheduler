import { supabase } from '../lib/supabase';

export default async function Home() {
  const { data: shifts } = await supabase
    .from('shifts')
    .select('id, start_time, end_time, status');

  return (
    <ul>
      {shifts?.map((shift) => (
        <li key={shift.id}>
          {shift.id} — {shift.start_time} to {shift.end_time} ({shift.status})
        </li>
      ))}
    </ul>
  );
}
