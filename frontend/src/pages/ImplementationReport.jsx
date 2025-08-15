import { useState, useEffect } from 'react';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';
import axios from 'axios';


export default function ImplementationReport() {
  const [expanded, setExpanded] = useState(null);
  const [items, setItems] = useState([]);
const [startDate, setStartDate] = useState(() => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.toISOString().split('T')[0];
});

const [endDate, setEndDate] = useState(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

const implementedItems = items.filter(item => item.doneAt);
const pendingItems = items.filter(item => item.status === 'pending' && !item.doneAt);

function getOpportunityLevel(task) {
  const impressions = task.impressions || 0;
  const ctr = typeof task.ctr === 'string' ? parseFloat(task.ctr.replace('%', '')) : task.ctr || 0;
  const position = task.position || 99;
  const action = task.action || '';

  if (action === 'local-page') {
  if (impressions >= 100 && ctr === 0) return 'High';
  if (impressions >= 30 && ctr < 0.5) return 'Medium';
  return 'Low';
}


  if (action === 'blog') {
    if (impressions >= 500 && ctr === 0) return 'High';
    if (impressions >= 300 && ctr < 0.5) return 'Medium';
    return 'Low';
  }

  // fallback
  return 'Low';
}



  useEffect(() => {
    async function fetchData() {
      try {
        const res = await axios.get(`/api/seo-tasks/implementation-report?doneAfter=${startDate}&doneBefore=${endDate}`);
        setItems(res.data);
      } catch (err) {
        console.error('Failed to fetch SEO tasks:', err);
      }
    }
    fetchData();
  }, [startDate, endDate]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">SEO Implementation Report</h1>

      <div className="flex flex-wrap gap-4 items-center mb-6">
        <label className="text-sm text-gray-600">
          From:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="ml-2 border rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="text-sm text-gray-600">
          To:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="ml-2 border rounded px-2 py-1 text-sm"
          />
        </label>
      </div>

      {/* Summary Box */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
  {[
    { label: 'Blog Posts', color: 'blue', action: 'blog' },
    { label: 'Local Pages', color: 'green', action: 'local-page' },
    { label: 'On-Page Edits', color: 'yellow', action: 'improve' },
    { label: 'Technical Fixes', color: 'purple', action: 'create' },
  ].map(({ label, color, action }) => {
    const total = items.filter(i => i.action === action).length;
    const pending = items.filter(i => i.action === action && i.status === 'pending').length;
    const done = items.filter(i => i.action === action && i.status === 'done').length;
console.log('Fetched items:', items.map(i => i.action));

    return (
      <div key={action} className={`bg-${color}-50 rounded-xl p-4 shadow`}>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold text-${color}-800`}>{total}</p>
        </div>
        <div className="mt-2 flex gap-2 flex-wrap">
          {done > 0 && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Done: {done}
            </span>
          )}
          {pending > 0 && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              Pending: {pending}
            </span>
          )}
        </div>
      </div>
    );
  })}
</div>



{/* IMPLEMENTED SECTION */}
<h2 className="text-2xl font-semibold mb-2">✅ Implemented</h2>
{implementedItems.length === 0 ? (
  <p className="text-gray-500 mb-6">No implemented tasks in this period.</p>
) : (
  implementedItems.map((item, idx) => (
    <div
      key={`done-${idx}`}
      className="border rounded-xl p-4 mb-4 shadow-sm bg-white cursor-pointer hover:bg-gray-50"
      onClick={() => setExpanded(expanded === `done-${idx}` ? null : `done-${idx}`)}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{item.doneAt?.split('T')[0]} – {item.action}</p>
          <h2 className="text-lg font-semibold text-gray-800">{item.title}</h2>
          <p className="text-sm text-blue-600">{item.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">Posted</span>
          {expanded === `done-${idx}` ? <ArrowUpIcon size={18} /> : <ArrowDownIcon size={18} />}
        </div>
      </div>

      {expanded === `done-${idx}` && (
        <div className="mt-4 text-sm text-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-2">
            <p><strong>Keyword:</strong> {item.keyword}</p>
            <p><strong>Impressions:</strong> {item.impressions}</p>
            <p><strong>Clicks:</strong> {item.clicks}</p>
            <p><strong>CTR:</strong> {item.ctr}</p>
            <p><strong>Opportunity:</strong>{' '}
              <span className={
                'font-semibold ' +
                (getOpportunityLevel(item) === 'High' ? 'text-red-600' :
                  getOpportunityLevel(item) === 'Medium' ? 'text-yellow-600' : 'text-green-600')
              }>
                {getOpportunityLevel(item)}
              </span>
            </p>
            <p><strong>Lead Potential:</strong> ~{item.leadPotential}/month</p>
          </div>
          <p><strong>Justification:</strong> {item.justification}</p>
          {item.generatedByAI && (
            <p className="mt-2 text-xs text-indigo-600 font-medium">Generated by AI</p>
          )}
        </div>
      )}
    </div>
  ))
)}

<h2 className="text-2xl font-semibold mt-10 mb-2">🕒 Pending</h2>
{pendingItems.length === 0 ? (
  <p className="text-gray-500 mb-6">No pending tasks.</p>
) : (
  pendingItems.map((item, idx) => (
    <div
      key={`pending-${idx}`}
      className="border rounded-xl p-4 mb-4 shadow-sm bg-white cursor-pointer hover:bg-gray-50"
      onClick={() => setExpanded(expanded === `pending-${idx}` ? null : `pending-${idx}`)}
    >
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">{item.createdAt?.split('T')[0]} – {item.action}</p>
          <h2 className="text-lg font-semibold text-gray-800">{item.title}</h2>
          <p className="text-sm text-blue-600">{item.url}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 font-medium">Pending</span>
          {expanded === `pending-${idx}` ? <ArrowUpIcon size={18} /> : <ArrowDownIcon size={18} />}
        </div>
      </div>

      {expanded === `pending-${idx}` && (
        <div className="mt-4 text-sm text-gray-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-2">
            <p><strong>Keyword:</strong> {item.keyword}</p>
            <p><strong>Impressions:</strong> {item.impressions}</p>
            <p><strong>Clicks:</strong> {item.clicks}</p>
            <p><strong>CTR:</strong> {item.ctr}</p>
            <p><strong>Opportunity:</strong>{' '}
              <span className={
                'font-semibold ' +
                (getOpportunityLevel(item) === 'High' ? 'text-red-600' :
                  getOpportunityLevel(item) === 'Medium' ? 'text-yellow-600' : 'text-green-600')
              }>
                {getOpportunityLevel(item)}
              </span>
            </p>
            <p><strong>Lead Potential:</strong> ~{item.leadPotential}/month</p>
          </div>
          <p><strong>Justification:</strong> {item.justification}</p>
          {item.generatedByAI && (
            <p className="mt-2 text-xs text-indigo-600 font-medium">Generated by AI</p>
          )}
        </div>
      )}
    </div>
  ))
)}

      <div className="mt-8 flex gap-4">
        <button className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-xl">Export as PDF</button>
        <button className="bg-gray-200 hover:bg-gray-300 text-sm font-medium px-4 py-2 rounded-xl">Export as Excel</button>
      </div>
    </div>
  );
}
