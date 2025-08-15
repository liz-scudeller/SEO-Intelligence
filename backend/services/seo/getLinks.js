export function getLinks($) {
  const internal = $('a[href*="homeservicesolutions.ca"]')
    .map((i, el) => $(el).attr('href'))
    .get();

  const external = $('a[href^="http"]')
    .filter((i, el) => !$(el).attr('href').includes('homeservicesolutions.ca'))
    .map((i, el) => $(el).attr('href'))
    .get();

  return { internal, external };
}
