import { supabase } from './supabaseClient';

export async function fetchUserServices(userId) {
  const { data, error } = await supabase
    .from('services')
    .select('name')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) {
    console.error('❌ Failed to fetch services:', error.message);
    return [];
  }

  return data.map(service => service.name.toLowerCase());
}
