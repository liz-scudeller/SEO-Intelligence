function generateAiRecommendations(page) {
  const checklist = page.seoChecklist || [];

  const map = [
    // TITLE
    { match: 'Missing <title>', suggestion: 'Add a <title> tag with 50–60 characters.', type: 'title', impact: 'high' },
    { match: '<title> too short', suggestion: 'Extend the <title> tag to at least 50 characters.', type: 'title', impact: 'low' },
    { match: '<title> too long', suggestion: 'Shorten the <title> to 60 characters or less.', type: 'title', impact: 'medium' },

    // META DESCRIPTION
    { match: 'Missing meta description', suggestion: 'Add a meta description to summarize the page.', type: 'meta', impact: 'high' },
    { match: 'Meta description too short', suggestion: 'Write a meta description with 120–160 characters.', type: 'meta', impact: 'medium' },
    { match: 'Meta description too long', suggestion: 'Shorten the meta description to 160 characters or less.', type: 'meta', impact: 'medium' },

    // HEADINGS
    { match: 'Missing <h1> or <h2>', suggestion: 'Include at least one <h1> or <h2> to define page hierarchy.', type: 'headings', impact: 'high' },
    { match: 'Multiple <h1> tags', suggestion: 'Use only one <h1> tag per page.', type: 'headings', impact: 'high' },
    { match: 'Incorrect heading tag order', suggestion: 'Ensure heading tags follow a logical hierarchy (H1 > H2 > H3).', type: 'headings', impact: 'medium' },

    // STRUCTURED DATA
    { match: 'Missing structured data', suggestion: 'Include JSON-LD structured data to improve search engine understanding.', type: 'structured-data', impact: 'medium' },

    // OPEN GRAPH
    { match: 'Missing Open Graph', suggestion: 'Include Open Graph meta tags for better social sharing.', type: 'og', impact: 'medium' },

    // CANONICAL
    { match: 'Missing canonical', suggestion: 'Add a <link rel="canonical"> to specify the preferred URL.', type: 'canonical', impact: 'medium' },

    // IMAGES
    { match: '<img> tags without alt', suggestion: 'Add descriptive alt attributes to all images.', type: 'images', impact: 'low' },

    // LINKS
    { match: 'No internal links', suggestion: 'Add links to other pages within your site.', type: 'internal-links', impact: 'medium' },
    { match: 'No external links', suggestion: 'Add links to reputable external sources.', type: 'external-links', impact: 'low' },

    // INDEXABILITY
    { match: 'Page is blocked by robots.txt', suggestion: 'Remove the block in robots.txt to allow search engine crawling.', type: 'indexability', impact: 'high' },
    { match: 'Page has noindex tag', suggestion: 'Remove the noindex directive if you want this page to be indexed.', type: 'indexability', impact: 'high' },

    // MOBILE
    { match: 'Mobile viewport not set', suggestion: 'Add a responsive viewport meta tag for better mobile experience.', type: 'mobile', impact: 'medium' },

    // CONTENT
    { match: 'Low word count', suggestion: 'Add more relevant content to provide value and improve SEO.', type: 'content', impact: 'medium' },
    { match: 'Duplicate content detected', suggestion: 'Rewrite or consolidate duplicated content to improve uniqueness.', type: 'content', impact: 'high' },
    { match: 'No main content detected', suggestion: 'Include relevant textual content in the main area of the page.', type: 'content', impact: 'high' }
  ];

  const recs = [];

  checklist.forEach(item => {
    map.forEach(rule => {
      if (item.includes(rule.match)) {
        recs.push({
          type: rule.type,
          suggestion: rule.suggestion,
          impact: rule.impact
        });
      }
    });
  });

  if (recs.length === 0) {
    recs.push({
      type: 'info',
      suggestion: 'No issues found. Great job!',
      impact: 'low'
    });
  }

  return recs;
}

module.exports = { generateAiRecommendations };
