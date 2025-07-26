import React, {useState} from 'react';

export default function GSCFilters({
  city, setCity,
  service, setService,
  dimension, setDimension,
  startDate, setStartDate,
  endDate, setEndDate,
  handleFetch,
  setToday, setLast7Days, setLast30Days,
  showOpportunities, setShowOpportunities,
  showLowCTR, setShowLowCTR,
  showGoodRankings, setShowGoodRankings,
  getSeoSuggestions,
  cities, services,
  excludeTerm, setExcludeTerm,
  loadingReport, setLoadingReport,
  loadingSuggestions, setLoadingSuggestions,
  showOnlySuggestions, setShowOnlySuggestions, 
})

{


  return (
    <div className="bg-white p-4 rounded-xl shadow-md mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <select value={city} onChange={e => setCity(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="">All</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Service</label>
          <select value={service} onChange={e => setService(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="">All</option>
            {services.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Dimension</label>
          <select value={dimension} onChange={e => setDimension(e.target.value)} className="w-full border rounded px-3 py-2">
            <option value="query">Query</option>
            <option value="page">Page</option>
            <option value="page,query">Page + Query</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Exclude Terms (space or comma)</label>
          <input
            type="text"
            value={excludeTerm}
            onChange={(e) => setExcludeTerm(e.target.value)}
            placeholder="ex: home service solutions"
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded px-3 py-2" />
        </div>

        <div className="flex gap-2">
          <button onClick={setToday} className="flex-1 bg-gray-100 text-sm rounded px-3 py-2 hover:bg-gray-200">Today</button>
          <button onClick={setLast7Days} className="flex-1 bg-gray-100 text-sm rounded px-3 py-2 hover:bg-gray-200">Last 7d</button>
          <button onClick={setLast30Days} className="flex-1 bg-gray-100 text-sm rounded px-3 py-2 hover:bg-gray-200">Last 30d</button>
        </div>

       <button
  onClick={async () => {
  setLoadingReport(true);
  try {
    await handleFetch(); // só deve fazer fetch
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingReport(false);
  }
}}

  disabled={loadingReport}
className={`bg-[#2a2b2e] text-white px-4 py-2 rounded text-sm hover:bg-[#1f2022] ${loadingReport ? 'opacity-50' : ''}`}

>
  {loadingReport ? 'Loading...' : '🔍 Generate Report'}
</button>
</div>

<div className="flex flex-wrap gap-2 text-sm mt-2">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={showOpportunities}
      onChange={e => setShowOpportunities(e.target.checked)}
      disabled={loadingReport || loadingSuggestions}
    />
    Show Opportunities
  </label>
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={showLowCTR}
      onChange={e => setShowLowCTR(e.target.checked)}
      disabled={loadingReport || loadingSuggestions}
    />
    Show Low CTR
  </label>
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={showGoodRankings}
      onChange={e => setShowGoodRankings(e.target.checked)}
      disabled={loadingReport || loadingSuggestions}
    />
    Show Top Rankings
  </label>
<label className="flex items-center gap-2 font-medium text-blue-900">
  <input
    type="checkbox"
    checked={showOnlySuggestions}
    onChange={e => setShowOnlySuggestions(e.target.checked)}
    disabled={loadingReport || loadingSuggestions}
  />
  🧭 Only Keywords with Local Page Opportunity
</label>


  <button
    onClick={async () => {
  setLoadingSuggestions(true);
  try {
    await getSeoSuggestions(); // só AI
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingSuggestions(false);
  }
}}

    disabled={loadingSuggestions}
className={`ml-auto bg-[#759b2c] hover:bg-[#638c26] text-white px-4 py-2 rounded text-sm ${loadingSuggestions ? 'opacity-50' : ''}`}
  >
    {loadingSuggestions ? 'Generating...' : '💡 Get AI Suggestions'}
  </button>
</div>

    </div>
  );
}
