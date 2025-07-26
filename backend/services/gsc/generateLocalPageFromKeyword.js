function generateLocalPageFromKeyword(keyword, url, metrics = {}) {
  const location = extractCityFromKeyword(keyword);
  if (!location) return null;

  const services = [
    'eavestrough installation',
    'gutter cleaning',
    'gutter guards',
    'attic insulation',
    'window cleaning',
    'window installation',
    'door installation',
    'soffit and fascia',
    'window and door installation',
  ];

  const foundService = services.find(s =>
    keyword.toLowerCase().includes(s)
  );
  if (!foundService) return null;

  const serviceSlug = foundService.replace(/ /g, '-');
  const slug = `${serviceSlug}-${location.toLowerCase()}`;
  const seoTitle = `${capitalize(foundService)} in ${location}`;
  const metaDescription = `Explore expert ${foundService} services in ${location}. Trusted by homeowners. Get a quote today.`;

  const nearbyNeighbourhoods = getNeighbourhoodsByCity(location).join(', ');

  const contentPrompt = `
Generate an SEO-optimized local service page for a home exterior company.

Company: Home Service Solutions  
Location: ${location}  
Service: ${serviceSlug.replace(/-/g, ' ')}  
Slug: ${slug}  
Main Keyword: "${keyword}"  
Nearby Neighbourhoods: ${nearbyNeighbourhoods}

Your response should include the following sections, all adapted to ${location}:

1. **Intro Paragraph**  
Write a concise, friendly paragraph introducing Home Service Solutions as a trusted provider of reliable, energy-efficient, and long-lasting exterior home services in ${location}.  
Mention that we serve homeowners in both urban and rural areas, including neighbourhoods like ${nearbyNeighbourhoods}, with solutions tailored to Ontario's climate.  
Naturally include the main keyword.

2. **${serviceSlug.replace(/-/g, ' ')} in ${location}**  
Describe how Home Service Solutions delivers professional ${serviceSlug.replace(/-/g, ' ')} in ${location}, emphasizing comfort, durability, curb appeal, and protection.  
Mention local expertise, high-quality materials, and how this service benefits homes in ${location}. Include the main keyword naturally.

3. **How Our ${serviceSlug.replace(/-/g, ' ')} Installation Works in ${location}**  
Explain in 4–6 bullet points how the installation process works for ${serviceSlug.replace(/-/g, ' ')}.  
Include: free consultation, inspection, prep, installation, cleanup, and customer satisfaction. Tailor each point to homeowners in ${location} and typical Ontario weather conditions.

4. **Why Choose Home Service Solutions in ${location}**  
List 4–6 localized selling points for why homeowners in ${location} should trust us.  
Vary the content compared to other locations by referencing local needs, climate, or challenges.  
Avoid generic repetition across locations.

5. **Project Gallery / Service in Action**  
Write 1 paragraph introducing a visual gallery of our ${serviceSlug.replace(/-/g, ' ')} work in ${location}.  
Use a confident, friendly tone to encourage users to explore real examples.

6. **FAQ Section**  
Research real questions people ask online about "${serviceSlug.replace(/-/g, ' ')} in ${location}".  
Use public search data to suggest 4–5 specific FAQs and write clear, helpful answers for each one.  
Avoid generic FAQs — focus on what local homeowners would actually search.  
Use headings for each question, followed by a short paragraph answer. Keep tone professional, trustworthy, and informative.

Style:  
- Tone: Professional, trustworthy, and friendly  
- Emphasize local relevance and SEO (use ${location} naturally)  
- Use clear section headings  
- Be helpful and informative, avoiding unnecessary filler

Return only the page content (no explanations).
`;

  return {
    slug,
    keyword,
    seoTitle,
    metaDescription,
    contentPrompt,
    action: 'local-page',
    status: 'pending',
    created_at: new Date().toISOString(),
    justification: `This page does not currently exist on the site, but users are actively searching for "${keyword}" according to Google Search Console data. Creating a dedicated page will help capture this demand and improve SEO performance.`,
    ...metrics,
  };
}

function extractCityFromKeyword(keyword) {
  const allowedCities = [
    'Kitchener', 'Waterloo', 'Cambridge', 'Guelph', 'Fergus',
    'Ayr', 'Elmira', 'Baden', 'New Hamburg', 'Hamilton'
  ];
  const parts = keyword.split(' ');
  return allowedCities.find(city =>
    parts.some(p => p.toLowerCase() === city.toLowerCase())
  );
}

function capitalize(str) {
  return str[0].toUpperCase() + str.slice(1);
}

function getNeighbourhoodsByCity(city) {
  const map = {
    Kitchener: ['Downtown', 'Forest Heights', 'Stanley Park', 'Huron Park', 'Country Hills', 'Pioneer Park'],
    Waterloo: ['Uptown Waterloo', 'Beechwood', 'Laurelwood', 'Westmount', 'Columbia Forest', 'Eastbridge'],
    Cambridge: ['Galt', 'Preston', 'Hespeler', 'West Galt', 'East Galt', 'Northview'],
    Guelph: ['Downtown Guelph', 'Kortright Hills', 'Grange Hill East', 'Westminster Woods', 'Exhibition Park'],
    Fergus: ['Downtown Fergus', 'South End', 'North End', 'Victoria Terrace'],
    Elmira: ['Downtown Elmira', 'Birdland', 'Maple Street Area'],
    Hamilton: ['Stoney Creek', 'Dundas', 'Ancaster', 'East Hamilton', 'West Hamilton', 'Mountain'],
    Baden: ['Downtown Baden', 'Snyder\'s Flats', 'Trussler'],
    'New Hamburg': ['Downtown', 'Stonecroft', 'Breslau'],
    Ayr: ['North Ayr', 'South Ayr', 'Jedburgh', 'Nithridge'],
  };
  return map[city] || [];
}

module.exports = generateLocalPageFromKeyword;
