import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../../services/supabaseClient';

export default function GSCResultsTable({ groupedData, getSeoScore, getRowColor, dimension, showOnlySuggestions, }) {
  const showURL = dimension.includes('page');
  const showKeyword = dimension.includes('query');
  const [generatingKeyword, setGeneratingKeyword] = useState(null);
  const [suggestedSlugs, setSuggestedSlugs] = useState({});
  
function shouldShowGenerateButton({ url, keyword }) {
  if (!url || !keyword) return false;

  const urlSlug = url.split('/').filter(Boolean).pop() || '';
  const urlWords = urlSlug.split('-'); // ['gutter', 'guards']
  const keywordWords = keyword.toLowerCase().split(/\s+/);

  // Verifica quantas palavras da keyword já estão na URL
  const matchCount = keywordWords.filter(kw => urlWords.includes(kw)).length;

  // Se menos de 2 palavras da keyword estão na URL, sugere criar página
  return matchCount < 2;
}


  const handleGeneratePage = async (keyword, url, metrics) => {
    setGeneratingKeyword(keyword);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('❌ User not logged in');

      const response = await fetch('/api/seo-tasks/generate-local-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, url, userId: user.id, metrics }),
      });

      const result = await response.json();
      if (!result.success || !result.task || !result.task._id) {
        alert('⚠️ Failed: ' + (result.error || 'Unknown error'));
        return;
      }

      const contentRes = await fetch('/api/seo-tasks/generate-local-page-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: result.task._id }),
      });

      const contentResult = await contentRes.json();
      if (contentResult.success) {
        alert('✅ Page content generated!');
      } else {
        alert('⚠️ Page created, but content generation failed: ' + (contentResult.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('❌ Error generating page:', err);
      alert('❌ Error generating page');
    } finally {
      setGeneratingKeyword(null);
    }
  };

  if (!groupedData || Object.keys(groupedData).length === 0) return null;


  return (
    <details className="mb-6 border border-[#dbe3d1] rounded-xl bg-white shadow-sm" open>
      <summary className="cursor-pointer px-6 py-4 text-lg font-semibold bg-[#f5f7f2] text-[#2a2b2e] hover:bg-[#eaf0e3] border-b border-[#dbe3d1]">
        📊 View Search Console Results
      </summary>

      <div className="flex justify-end">

</div>


      <div className="p-4 space-y-4">
        {Object.entries(groupedData).map(([keywordGroup, rows]) => {
const filteredRows = rows.filter((row) => {
  const url = row.keys?.[0] || '';
  const keyword = dimension === 'page,query' ? row.keys?.[1] : row.keys?.[0];

  if (!showOnlySuggestions) return true;

  const result = shouldShowGenerateButton({ url, keyword });
  return result;
});






          if (filteredRows.length === 0) return null;

          return (
            <details key={keywordGroup} open className="border border-[#dbe3d1] rounded-xl bg-gray-50 shadow-sm">
              <summary className="px-4 py-2 bg-[#f5f7f2] border-b border-[#dbe3d1] text-sm font-semibold text-[#2a2b2e] cursor-pointer select-none rounded-t-xl">
                🔑 {keywordGroup} <span className="ml-2 text-gray-500">({filteredRows.length} URLs)</span>
              </summary>

              <div className="overflow-x-auto rounded-b-xl bg-white">
                <table className="w-full text-sm table-fixed border-collapse">
                  <thead className="bg-gray-100 text-left">
                    <tr>
                      {showURL && <th className="w-[220px] px-3 py-2 border-b text-[#2a2b2e]">URL</th>}
                      {showKeyword && <th className="w-[160px] px-3 py-2 border-b text-[#2a2b2e]">Keyword</th>}
                      <th className="w-[80px] px-3 py-2 border-b text-right text-[#2a2b2e]">Impr.</th>
                      <th className="w-[80px] px-3 py-2 border-b text-right text-[#2a2b2e]">Clicks</th>
                      <th className="w-[80px] px-3 py-2 border-b text-right text-[#2a2b2e]">CTR (%)</th>
                      <th className="w-[80px] px-3 py-2 border-b text-right text-[#2a2b2e]">Position</th>
                      <th className="w-[140px] px-3 py-2 border-b text-[#2a2b2e]">SEO Score</th>
                    </tr>
                  </thead>
                  <tbody>
  {filteredRows.map((row, idx) => {
    const url = row.keys?.[0] || '';
    const keyword = dimension === 'page,query' ? row.keys?.[1] : row.keys?.[0];
    const key = `${url}___${keyword}`;

 

const showGeneratePage = shouldShowGenerateButton({ url, keyword });

    return (
      <tr key={idx} className={`${getRowColor(row)} hover:bg-[#f9faf8] transition-colors`}>
        {showURL && (
          <td className="px-3 py-2 border-t break-words text-gray-800">{url}</td>
        )}
        {showKeyword && (
          <td className="px-3 py-2 border-t break-words text-gray-800">
            <div>{keyword}</div>
            {showGeneratePage && (
              <button
                onClick={() =>
                  handleGeneratePage(keyword, url, {
                    impressions: row.impressions,
                    clicks: row.clicks,
                    ctr: row.ctr,
                    position: row.position,
                  })
                }
                disabled={generatingKeyword === keyword}
                className={`mt-1 inline-block text-xs border rounded px-2 py-0.5 transition
                  ${generatingKeyword === keyword
                    ? 'text-gray-400 border-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-blue-600 border-blue-600 hover:bg-blue-50'}
                `}
              >
                {generatingKeyword === keyword ? 'Generating...' : 'Generate Page'}
              </button>
            )}
          </td>
        )}
        <td className="px-3 py-2 border-t text-right text-gray-700">{row.impressions}</td>
        <td className="px-3 py-2 border-t text-right text-gray-700">{row.clicks}</td>
        <td className="px-3 py-2 border-t text-right text-gray-700">
          {(row.ctr * 100).toFixed(1)}
        </td>
        <td className="px-3 py-2 border-t text-right text-gray-700">
          {row.position?.toFixed(1)}
        </td>
        <td className="px-3 py-2 border-t">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              getSeoScore(row) >= 80
                ? 'bg-green-100 text-green-800'
                : getSeoScore(row) >= 50
                ? 'bg-yellow-100 text-yellow-800'
                : 'text-red-700'
            }`}
          >
            {getSeoScore(row)}
          </span>
        </td>
      </tr>
    );
  })}
</tbody>

                </table>
              </div>
            </details>
          );
        })}
      </div>
    </details>
  );
}
