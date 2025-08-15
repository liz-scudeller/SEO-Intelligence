export function shouldShowGeneratePage(query, pageUrl) {
  if (!query || !pageUrl) return false;

  const cleanUrl = pageUrl
    .replace(/^https?:\/\/[^/]+/, '') // remove domínio
    .replace(/\/$/, '')               // remove barra final
    .toLowerCase();

  const cleanQuery = query.trim().toLowerCase();

  return !cleanQuery.includes(cleanUrl);
}
