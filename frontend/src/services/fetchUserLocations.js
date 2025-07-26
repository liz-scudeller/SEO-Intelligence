import { supabase } from './supabaseClient';

export async function fetchUserLocations(userId) {
  const { data, error } = await supabase
    .from('locations')
    .select('name')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) {
    console.error('❌ Failed to fetch locations:', error.message);
    return [];
  }

  return data.map(location => location.name.toLowerCase());
}
