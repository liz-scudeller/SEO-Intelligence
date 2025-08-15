function normalizeHeadings(h) {
  if (!h) return [];
  if (Array.isArray(h)) return h.filter(x => typeof x === 'string');
  if (typeof h === 'object') {
    const out = [];
    for (const k of ['h1','h2','h3','h4','h5','h6']) {
      const v = h[k];
      if (Array.isArray(v)) out.push(...v.filter(x => typeof x === 'string'));
      else if (typeof v === 'string') out.push(v);
    }
    return out;
  }
  if (typeof h === 'string') return [h];
  return [];
}
module.exports = { normalizeHeadings };
