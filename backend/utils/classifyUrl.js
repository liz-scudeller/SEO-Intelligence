const knownServices = [
"gutter-guard",
"gutter-installation",
"gutter-cleaning",
"eavestrough-installation",
"eavestrough-cleaning",
"eavestrough-repair",
"soffit-fascia-installation-services",
"soffit-fascia-repair",
"downspout-installation-services",
"window-installation-services",
"door-installation-services",
"thermal-acoustical-cellulose-insulation-installation-services",
"window-cleaning-services",
"window-cleaning",
"home-maintenance-services",
"gutter-repair-services",

];

const knownPages = {
  about: 'about',
  contact: 'contact',
  faq: 'faq',
  'terms-of-service': 'terms',
  'privacy-policy': 'privacy',
  'reviews': 'reviews',
  'contact-us': 'contact',
  'about': 'about',
};

function classifyUrl(url) {
  const slug = url.replace('https://homeservicesolutions.ca/', '').replace(/\/$/, '');

  if (/^\d{4}\/\d{2}\/\d{2}\//.test(slug)) {
    return { url, type: 'blog', slug };
  }

if (slug.startsWith('blog/')) return { url, type: 'blog', slug };
  if (slug.startsWith('service-areas/')) return { url, type: 'city', slug };
  if (slug.startsWith('alu-rex')) return { url, type: 'product', slug };
  if (slug.startsWith('services/')) return { url, type: 'service', slug};
  if (knownServices.includes(slug)) return { url, type: 'service', slug };
  if (knownPages[slug]) return { url, type: 'page', slug };
  

  return { url, type: 'unknown', slug };
}

module.exports = {classifyUrl};
