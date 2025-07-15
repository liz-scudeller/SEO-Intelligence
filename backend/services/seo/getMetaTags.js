function getMetaTags($) {
  return {
    title: $('title').text().trim() || '',
    description: $('meta[name="description"]').attr('content') || '',
    ogTitle: $('meta[property="og:title"]').attr('content') || '',
    ogDescription: $('meta[property="og:description"]').attr('content') || '',
    ogImage: $('meta[property="og:image"]').attr('content') || '',
    canonical: $('link[rel="canonical"]').attr('href') || '',
  };
}

module.exports = getMetaTags;