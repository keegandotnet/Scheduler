'use server';

import { createAuthClient } from '../../lib/supabase-auth';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = await createAuthClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/shifts');
}

export async function logout() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect('/login');
}
