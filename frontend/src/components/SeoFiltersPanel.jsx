export default function SeoFiltersPanel({
  // type, setType,
  // minScore, setMinScore,
  // aiStatus, setAiStatus,
  // resolvedFilter, setResolvedFilter,
  // urlFilter, setUrlFilter,
  // onReanalyzeAll,
  // onExport
   type,
  setType,
  minScore,
  setMinScore,
  aiStatus,
  setAiStatus,
  resolvedFilter,
  setResolvedFilter,
  urlFilter,
  setUrlFilter,
  onReanalyzeAll,
  onExport,
  city,
  setCity,
  locations
}) {
  return (
    <div className="bg-white shadow rounded-xl p-4 mb-6">
      {/* Linha 1 - Type, Status, Min Score */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Page Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm text-sm"
          >
            <option value="">All Types</option>
            <option value="page">Page</option>
            <option value="blog">Blog</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">AI Status</label>
          <select
            value={aiStatus}
            onChange={(e) => setAiStatus(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm text-sm"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="done">Done</option>
            <option value="implemented">Implemented</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Min. Score</label>
          <input
            type="number"
            value={minScore}
            onChange={(e) => setMinScore(e.target.value)}
            placeholder="e.g. 60"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm text-sm"
          />
        </div>
      </div>

      {/* Linha 2 - Resolved, URL Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Resolution</label>
          <select
            value={resolvedFilter}
            onChange={(e) => setResolvedFilter(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm text-sm"
          >
            <option value="">All</option>
            <option value="true">Resolved</option>
            <option value="false">Unresolved</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Search by URL</label>
          <input
            type="text"
            value={urlFilter}
            onChange={(e) => setUrlFilter(e.target.value)}
            placeholder="Enter part of the URL..."
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm text-sm"
          />
        </div>
      <select
  value={city}
  onChange={(e) => setCity(e.target.value)}
  className="border px-2 py-1 rounded"
>
  <option value="">All Cities</option>
  {locations.map((loc) => (
    <option key={loc.id} value={loc.slug}>
      {loc.city}
    </option>
  ))}
</select>
      </div>


      {/* Ações */}
      <div className="flex flex-col md:flex-row justify-between mt-6 gap-3">
        <button
  onClick={onReanalyzeAll}
  className="bg-[#2a2b2e] hover:bg-[#1e1f21] text-white text-sm px-4 py-2 rounded-md shadow-sm transition"
>
  🔁 Reanalyze All
</button>

<button
  onClick={onExport}
  className="bg-[#759b2c] hover:bg-[#638c26] text-white text-sm px-4 py-2 rounded-md shadow-sm transition"
>
  📥 Export as Excel
</button>
 
      </div>
    </div>
  );
}
