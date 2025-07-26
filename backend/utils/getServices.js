const supabase = require('../services/supabaseClient');

async function getServicesFromSettings() {
  const { data, error } = await supabase
    .from('services')
    .select('name, slug, keyword')
    .eq('active', true);

  if (error || !data) {
    console.error('❌ Failed to load services:', error);
    return [];
  }

  return data.map(service => ({
    ...service,
    keywords: service.keyword || []  // ✅ converte `keyword` em `keywords` para manter compatibilidade
  }));
}

module.exports = { getServicesFromSettings };
