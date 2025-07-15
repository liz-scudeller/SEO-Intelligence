function getHeadings($) {
  return {
    h1: $('h1').map((i, el) => $(el).text().trim()).get(),
    h2: $('h2').map((i, el) => $(el).text().trim()).get(),
    h3: $('h3').map((i, el) => $(el).text().trim()).get(),
  };
}

module.exports = getHeadings;