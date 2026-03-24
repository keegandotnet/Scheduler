'use server';

import { revalidatePath } from 'next/cache';
import { createAuthClient } from '../../lib/supabase-auth';
import { supabase } from '../../lib/supabase';

async function getAuthenticatedUser() {
  const authClient = await createAuthClient();
  const { data: claimsData } = await authClient.auth.getClaims();
  const claims = claimsData?.claims ?? null;
  if (!claims) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', claims.sub)
    .single();

  return profile ?? null;
}

export async function createOffer(shiftId: string, message: string): Promise<{ error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'employee') return { error: 'Unauthorized.' };

  const { data: existing } = await supabase
    .from('shift_offers')
    .select('id')
    .eq('shift_id', shiftId)
    .eq('status', 'open')
    .maybeSingle();

  if (existing) return { error: 'This shift already has an open offer.' };

  await supabase.from('shift_offers').insert({
    shift_id: shiftId,
    offered_by: user.id,
    message: message.trim() || null,
    status: 'open',
  });

  revalidatePath('/shifts');
  revalidatePath('/offers');
  return {};
}

export async function createClaim(offerId: string, message: string): Promise<{ error?: string }> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'employee') return { error: 'Unauthorized.' };

  // Guard: don't double-claim
  const { data: existing } = await supabase
    .from('shift_claims')
    .select('id')
    .eq('offer_id', offerId)
    .eq('claimant_id', user.id)
    .maybeSingle();

  if (existing) return { error: 'You have already claimed this offer.' };

  // Overlap check: load offered shift times
  const { data: offer } = await supabase
    .from('shift_offers')
    .select('shift_id')
    .eq('id', offerId)
    .single();

  if (!offer) return { error: 'Offer not found.' };

  const { data: offeredShift } = await supabase
    .from('shifts')
    .select('start_time, end_time')
    .eq('id', offer.shift_id)
    .single();

  if (!offeredShift) return { error: 'Shift not found.' };

  const { data: myShifts } = await supabase
    .from('shifts')
    .select('start_time, end_time')
    .eq('owner_id', user.id);

  const hasOverlap = (myShifts ?? []).some((s) => {
    return (
      new Date(s.start_time) < new Date(offeredShift.end_time) &&
      new Date(s.end_time) > new Date(offeredShift.start_time)
    );
  });

  if (hasOverlap) {
    return { error: 'This shift overlaps with one of your existing shifts.' };
  }

  await supabase.from('shift_claims').insert({
    offer_id: offerId,
    claimant_id: user.id,
    message: message.trim() || null,
    status: 'pending',
  });

  revalidatePath('/offers');
  revalidatePath('/claims');
  return {};
}

export async function approveClaim(claimId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'manager') return;

  const { data: claim } = await supabase
    .from('shift_claims')
    .select('offer_id, claimant_id')
    .eq('id', claimId)
    .single();

  if (!claim) return;

  const { data: offer } = await supabase
    .from('shift_offers')
    .select('shift_id')
    .eq('id', claim.offer_id)
    .single();

  if (!offer) return;

  await supabase
    .from('shifts')
    .update({ owner_id: claim.claimant_id })
    .eq('id', offer.shift_id);

  await supabase
    .from('shift_claims')
    .update({ status: 'approved' })
    .eq('id', claimId);

  await supabase
    .from('shift_claims')
    .update({ status: 'denied' })
    .eq('offer_id', claim.offer_id)
    .neq('id', claimId);

  await supabase
    .from('shift_offers')
    .update({ status: 'closed' })
    .eq('id', claim.offer_id);

  revalidatePath('/shifts');
  revalidatePath('/offers');
  revalidatePath('/claims');
}

export async function denyClaim(claimId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'manager') return;

  await supabase
    .from('shift_claims')
    .update({ status: 'denied' })
    .eq('id', claimId);

  revalidatePath('/claims');
}
