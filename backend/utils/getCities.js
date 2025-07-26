const supabase = require('../services/supabaseClient');

async function getCitiesFromSettings() {
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

module.exports = { getCitiesFromSettings };
