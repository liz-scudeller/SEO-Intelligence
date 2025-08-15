import { supabase } from '../services/supabaseClient.js';

export async function getCitiesFromSettings() {
  const { data, error } = await supabase
    .from('locations')
    .select('city')
    .eq('active', true);

  if (error || !data) {
    console.error('❌ Failed to load locations:', error);
    return [];
  }

  return data.map((loc) => loc.city);
}
