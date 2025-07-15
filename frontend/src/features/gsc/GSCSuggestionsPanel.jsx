import React from 'react';

export default function GSCSuggestionsPanel({ suggestions }) {
  if (!Array.isArray(suggestions) || suggestions.length === 0) return null;

  return (
<div className="bg-white w-full px-6 py-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">🧠 AI SEO Suggestions</h2>
      {suggestions.map((s, i) => (
        <details
          key={i}
          className="mb-4 border border-gray-200 rounded-xl p-4 bg-white shadow-sm"
        >
          <summary className="cursor-pointer font-medium text-blue-700 hover:underline">
            {s.keyword} – {s.action || 'Suggestion'}
          </summary>

          <div className="mt-3 text-sm text-gray-800 space-y-2">
            <div>
              <strong>SEO Title:</strong>
              <p className="ml-2 text-gray-700 bg-gray-50 p-2 rounded whitespace-pre-wrap">{s.seoTitle}</p>
            </div>

            <div>
              <strong>Meta Description:</strong>
              <p className="ml-2 text-gray-700 bg-gray-50 p-2 rounded whitespace-pre-wrap">{s.metaDescription}</p>
            </div>

            <div>
              <strong>Content:</strong>
              <p className="ml-2 text-gray-700 bg-gray-50 p-2 rounded whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                {s.content}
              </p>
            </div>

            {s.justification && (
              <div>
                <strong>🧠 Why this suggestion:</strong>
                <p className="ml-2 text-gray-700 bg-yellow-50 p-2 rounded whitespace-pre-wrap">{s.justification}</p>
              </div>
            )}

            {s.baseData && (
              <div className="pt-2 border-t text-xs text-gray-600 grid grid-cols-2 gap-2 mt-2">
                <p><strong>🔍 Based on:</strong></p>
                <p>URL: {s.baseData.url}</p>
                <p>Keyword: {s.baseData.keyword}</p>
                <p>Impressions: {s.baseData.impressions}</p>
                <p>Clicks: {s.baseData.clicks}</p>
                <p>CTR: {(s.baseData.ctr * 100).toFixed(2)}%</p>
                <p>Position: {s.baseData.position?.toFixed(2)}</p>
              </div>
            )}

            {typeof s.semanticScore === 'number' && (
              <div
                className={`mt-2 text-xs font-medium px-2 py-1 rounded inline-block
                ${s.semanticScore >= 7
                  ? 'bg-green-100 text-green-800'
                  : s.semanticScore >= 4
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
                }`}
              >
                Semantic Score: {s.semanticScore} / 10
              </div>
            )}

            {'hasCallToAction' in s && (
              <div className="mt-2 text-xs font-medium">
                <span className="mr-2"><strong>Call to Action:</strong></span>
                <span className={s.hasCallToAction ? 'text-green-600 font-semibold' : 'text-gray-500'}>
                  {s.hasCallToAction ? '✅ Present' : '🚫 Missing'}
                </span>
              </div>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
