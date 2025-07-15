import React from 'react';

export default function GSCResultsTable({ groupedData, getSeoScore, getRowColor, dimension }) {
  const showURL = dimension.includes('page');
  const showKeyword = dimension.includes('query');

  if (!groupedData || Object.keys(groupedData).length === 0) return null;

  return (
    <details className="mb-6 border border-[#dbe3d1] rounded-xl bg-white shadow-sm" open>
      <summary className="cursor-pointer px-6 py-4 text-lg font-semibold bg-[#f5f7f2] text-[#2a2b2e] hover:bg-[#eaf0e3] border-b border-[#dbe3d1]">
        📊 View Search Console Results
      </summary>

      <div className="p-4 space-y-4">
        {Object.entries(groupedData).map(([keyword, rows]) => (
          <details key={keyword} open className="border border-[#dbe3d1] rounded-xl bg-gray-50 shadow-sm">
            <summary className="px-4 py-2 bg-[#f5f7f2] border-b border-[#dbe3d1] text-sm font-semibold text-[#2a2b2e] cursor-pointer select-none rounded-t-xl">
              🔑 {keyword} <span className="ml-2 text-gray-500">({rows.length} URLs)</span>
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
                    <th className="w-[100px] px-3 py-2 border-b text-[#2a2b2e]">SEO Score</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={`${getRowColor(row)} hover:bg-[#f9faf8] transition-colors`}>
                      {showURL && (
                        <td className="px-3 py-2 border-t break-words text-gray-800">
                          {dimension.includes('page') ? row.keys?.[0] : ''}
                        </td>
                      )}
                      {showKeyword && (
                        <td className="px-3 py-2 border-t break-words text-gray-800">
                          {dimension === 'page,query' ? row.keys?.[1] : row.keys?.[0]}
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
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </details>
  );
}
