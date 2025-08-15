import { getCitiesFromSettings } from '../../utils/getCities.js';
import { getServicesFromSettings } from '../../utils/getServices.js';


export default async function generateLocalPageFromKeyword(keyword, url, metrics = {}) {
  const location = await extractCityFromKeyword(keyword);
  if (!location) {
    return null;
  }

  const services = await getServicesFromSettings();
const foundService = services.find(service =>
  service.keywords.some(k =>
    keyword.toLowerCase().includes(k.toLowerCase())
  )
);

  if (!foundService) {
    return null;
  }

  const serviceSlug = foundService.name.replace(/ /g, '-');

  const slug = `${serviceSlug}-${location.toLowerCase()}`;
  const seoTitle = `${capitalize(foundService.name)} in ${location}`;
const metaDescription = `Explore expert ${foundService.name} services in ${location}. Trusted by homeowners. Get a quote today.`;

  const nearbyNeighbourhoods = (await getCitiesFromSettings()).join(', ');

const servicesList = services.map(s => `- ${s.name}`).join('\n');

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

7. **Other Services Available in ${location}**  
Include the following list of all exterior services we provide for homeowners in ${location}:  

${servicesList}

Style:  
- Tone: Professional, trustworthy, and friendly  
- Emphasize local relevance and SEO (use ${location} naturally)  
- Use clear section headings  
- Be helpful and informative, avoiding unnecessary filler

Return only the page content (no explanations).
`;

for (const service of services) {
  for (const k of service.keywords) {
    if (keyword.toLowerCase().includes(k.toLowerCase())) {
      console.log(`DEBUG: Matched keyword "${k}" in service "${service.name}"`);
    }
  }
}

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

async function extractCityFromKeyword(keyword) {
  const allowedCities = await getCitiesFromSettings();
  const normalizedKeyword = keyword.toLowerCase();
  const foundCity = allowedCities.find(city =>
    normalizedKeyword.includes(city.toLowerCase())
  );
  return foundCity;
}


function capitalize(str) {
  if (!str) return '';
  return str[0].toUpperCase() + str.slice(1);
}

