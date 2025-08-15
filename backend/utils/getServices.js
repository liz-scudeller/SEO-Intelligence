import { supabase } from '../services/supabaseClient.js';

export async function getServicesFromSettings() {
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
    keywords: service.keyword || [] // ✅ converte `keyword` em `keywords` para manter compatibilidade
  }));
}
