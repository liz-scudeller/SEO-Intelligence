import { supabase } from './supabaseClient';

export async function fetchAccountInfo() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data;
}
