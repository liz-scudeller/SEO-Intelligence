export function getStructuredData($) {
  const data = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).html());
      data.push(json);
    } catch (e) {
      console.warn('Invalid JSON-LD:', e.message);
    }
  });
  return data;
}
