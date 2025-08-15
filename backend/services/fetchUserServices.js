import { supabase } from './supabaseClient.js';

export async function fetchUserServices(userId) {
  const { data, error } = await supabase
    .from('services')
    .select('slug')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) {
    console.error('❌ Error fetching services:', error.message);
    return [];
  }

  return data.map(s => s.slug);
}
