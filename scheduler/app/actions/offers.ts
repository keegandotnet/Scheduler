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

export async function createOffer(shiftId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'employee') return;

  // Guard: don't create a duplicate open offer
  const { data: existing } = await supabase
    .from('shift_offers')
    .select('id')
    .eq('shift_id', shiftId)
    .eq('status', 'open')
    .maybeSingle();

  if (existing) return;

  await supabase.from('shift_offers').insert({
    shift_id: shiftId,
    offered_by: user.id,
    status: 'open',
  });

  revalidatePath('/shifts');
  revalidatePath('/offers');
}

export async function createClaim(offerId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'employee') return;

  // Guard: don't double-claim
  const { data: existing } = await supabase
    .from('shift_claims')
    .select('id')
    .eq('offer_id', offerId)
    .eq('claimant_id', user.id)
    .maybeSingle();

  if (existing) return;

  await supabase.from('shift_claims').insert({
    offer_id: offerId,
    claimant_id: user.id,
    status: 'pending',
  });

  revalidatePath('/offers');
  revalidatePath('/claims');
}

export async function approveClaim(claimId: string) {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== 'manager') return;

  // Load the claim → offer → shift
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

  // Transfer the shift to the claimant
  await supabase
    .from('shifts')
    .update({ owner_id: claim.claimant_id })
    .eq('id', offer.shift_id);

  // Approve this claim, deny all others for the same offer
  await supabase
    .from('shift_claims')
    .update({ status: 'approved' })
    .eq('id', claimId);

  await supabase
    .from('shift_claims')
    .update({ status: 'denied' })
    .eq('offer_id', claim.offer_id)
    .neq('id', claimId);

  // Close the offer
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
