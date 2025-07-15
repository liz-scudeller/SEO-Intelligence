import React, { useState, useEffect } from 'react';
import SeoReportCard from './SeoReportCard';

export default function SeoReportList({ data, onReanalyze, onMarkResolved, onToggleResolved, onReanalyzePage, urlFilter }) {
  const grouped = data.reduce((acc, page) => {
    const key = page.type || 'unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(page);
    return acc;
  }, {});

  const typeOrder = ['service', 'city', 'blog', 'product', 'page', 'unknown'];

  const [expandedTypes, setExpandedTypes] = useState({});

  useEffect(() => {
    if (urlFilter.trim()) {
      // Expande apenas grupos com resultados no filtro
      const typesWithMatches = {};
      Object.keys(grouped).forEach(type => {
        typesWithMatches[type] = grouped[type].some(page =>
          page.url?.toLowerCase().includes(urlFilter.toLowerCase())
        );
      });
      setExpandedTypes(typesWithMatches);
    } else {
      // Colapsa tudo por padrao
      const allTypes = {};
      Object.keys(grouped).forEach(type => {
        allTypes[type] = false;
      });
      setExpandedTypes(allTypes);
    }
  }, [urlFilter, data]);

  const toggleType = (type) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="space-y-8">
      {[...typeOrder, ...Object.keys(grouped).filter(t => !typeOrder.includes(t))].map(type => (
        grouped[type]?.length ? (
          <div key={type}>
            <h2
  className="text-xl font-bold mb-3 capitalize cursor-pointer flex items-center gap-2"
  onClick={() => toggleType(type)}
>
  <span className="text-gray-500 text-base">
    {expandedTypes[type] ? '−' : '+'} {/* Usando + e − */}
  </span>
  {type} Pages
</h2>

            {expandedTypes[type] && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {grouped[type].map(page => (
                  <SeoReportCard
                    key={page._id}
                    page={page}
                    onReanalyze={onReanalyze}
                    onMarkResolved={onMarkResolved}
                    onToggleResolved={onToggleResolved}
                    onReanalyzePage={onReanalyzePage}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null
      ))}
    </div>
  );
}
