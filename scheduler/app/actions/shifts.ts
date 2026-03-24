'use server';

import { revalidatePath } from 'next/cache';
import { createAuthClient } from '../../lib/supabase-auth';
import { supabase } from '../../lib/supabase';

export async function createShift(formData: FormData) {
  const authClient = await createAuthClient();
  const { data: claimsData } = await authClient.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  if (!claims) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', claims.sub)
    .single();

  if (profile?.role !== 'manager') return;

  await supabase.from('shifts').insert({
    owner_id: formData.get('owner_id') as string,
    position_id: formData.get('position_id') as string,
    start_time: formData.get('start_time') as string,
    end_time: formData.get('end_time') as string,
    created_by: claims.sub,
    status: 'scheduled',
  });

  revalidatePath('/shifts');
}

export async function deleteShift(id: string) {
  const authClient = await createAuthClient();
  const { data: claimsData } = await authClient.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  if (!claims) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', claims.sub)
    .single();

  if (profile?.role !== 'manager') return;

  await supabase.from('shifts').delete().eq('id', id);
  revalidatePath('/shifts');
}

export async function updateShift(formData: FormData) {
  const authClient = await createAuthClient();
  const { data: claimsData } = await authClient.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  if (!claims) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', claims.sub)
    .single();

  if (profile?.role !== 'manager') return;

  await supabase
    .from('shifts')
    .update({
      owner_id: formData.get('owner_id') as string,
      position_id: formData.get('position_id') as string,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
    })
    .eq('id', formData.get('id') as string);

  revalidatePath('/shifts');
}
