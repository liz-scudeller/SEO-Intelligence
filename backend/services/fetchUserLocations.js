const supabase = require('./supabaseClient');

async function fetchUserLocations(userId) {
  const { data, error } = await supabase
    .from('locations')
    .select('slug')
    .eq('user_id', userId)
    .eq('active', true);

  if (error) {
    console.error('❌ Error fetching locations:', error.message);
    return [];
  }

  return data.map(l => l.slug);
}

module.exports = { fetchUserLocations };
