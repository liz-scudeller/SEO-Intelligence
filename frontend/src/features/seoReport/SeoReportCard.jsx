import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams  } from 'react-router-dom';
import {
  Eye,
  RotateCcw,
  CheckCircle2,
  Undo2,
} from 'lucide-react';

export default function SeoReportCard({ page, onToggleResolved, onReanalyzePage }) {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingReanalyze, setLoadingReanalyze] = useState(false);
  const messageRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();

const type = searchParams.get('type') || '';
const aiStatus = searchParams.get('aiStatus') || '';
const minScore = searchParams.get('min') || '';
const resolvedFilter = searchParams.get('resolved') || '';
const urlFilter = searchParams.get('url') || '';

const updateFilters = (updates) => {
  const newParams = new URLSearchParams(searchParams.toString());
  Object.entries(updates).forEach(([key, value]) => {
    if (value) newParams.set(key, value);
    else newParams.delete(key);
  });
  setSearchParams(newParams);
};

  const handleMarkResolved = async () => {
    try {
      const newResolvedState = !page.resolved;
      const response = await axios.patch(`http://localhost:3000/seo-report/resolve/${page._id}`, {
        resolved: newResolvedState,
      });

      if (response.data && response.data.resolved !== undefined) {
        onToggleResolved(page._id, response.data.resolved);
        setSuccessMessage(
          response.data.resolved ? '✅ Marked as Solved' : '↩️ Marked as Unsolved'
        );
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (err) {
      console.error('Error marking as resolved:', err.message);
    }
  };

  const handleReanalyzeClick = async () => {
    setLoadingReanalyze(true);
    try {
      await onReanalyzePage(page._id);
      messageRef.current = '✅ Reanalyzed successfully!';
    } catch (err) {
      console.error('Error reanalyzing:', err.message);
      messageRef.current = '❌ Error during reanalysis.';
    } finally {
      setLoadingReanalyze(false);
      setSuccessMessage(messageRef.current);
      setTimeout(() => {
        setSuccessMessage('');
        messageRef.current = '';
      }, 3000);
    }
  };

  const getAiVisibilityLabel = (score) => {
    if (score >= 40) return { label: 'Excellent', color: 'text-[#759b2c]' };
    if (score >= 20) return { label: 'Needs Improvement', color: 'text-yellow-600' };
    return { label: 'Poor Visibility', color: 'text-red-600' };
  };

  const aiLabel = getAiVisibilityLabel(page.aiVisibilityScore || 0);

  return (
    <div className="relative p-4 border rounded-xl shadow-sm bg-white flex flex-col justify-between hover:shadow-md transition">
      {/* Status Badge */}
      {page.aiRecommendations?.status && (
        <span
          className={`absolute top-3 right-3 text-xs font-semibold px-2 py-1 rounded-full
            ${page.aiRecommendations.status === 'implemented'
              ? 'bg-green-100 text-green-800'
              : page.aiRecommendations.status === 'done'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
            }`}
        >
          {page.aiRecommendations.status.charAt(0).toUpperCase() + page.aiRecommendations.status.slice(1)}
        </span>
      )}

      {/* URL */}
      <p className="font-semibold text-sm break-words text-[#2a2b2e] mb-2">{page.url}</p>

      {/* Scores */}
      <div className="flex flex-wrap items-center gap-3 text-sm mb-2">
        <p className="text-[#2a2b2e] font-medium">SEO Score: {page.seoScore}</p>
        {typeof page.aiVisibilityScore === 'number' && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${aiLabel.color} border-current`}>
            AI Score {aiLabel.label} ({page.aiVisibilityScore})
          </span>
        )}
      </div>

      {/* Type */}
      <p className="text-xs text-gray-600 mb-4">Type: <span className="font-medium text-[#2a2b2e]">{page.type}</span></p>

      {/* Buttons */}
      <div className="flex flex-wrap gap-2 items-center text-sm">
        <button
          onClick={() => navigate(`/seo-report/${page._id}`)}
          className="flex items-center gap-1 px-3 py-1 bg-[#2a2b2e] text-white rounded hover:bg-[#1d1e20]"
        >
          <Eye size={14} /> View
        </button>

        <button
          onClick={handleReanalyzeClick}
          disabled={loadingReanalyze}
          className={`flex items-center gap-1 px-3 py-1 rounded text-white transition text-sm ${
            loadingReanalyze
              ? 'bg-yellow-400 opacity-70 cursor-not-allowed'
              : 'bg-yellow-600 hover:bg-yellow-700'
          }`}
        >
          <RotateCcw size={14} />
          {loadingReanalyze ? 'Reanalyzing...' : 'Reanalyze'}
        </button>

        <button
          onClick={handleMarkResolved}
          className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition ${
            page.resolved
              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              : 'bg-[#759b2c] text-white hover:bg-[#678e27]'
          }`}
        >
          {page.resolved ? <Undo2 size={14} /> : <CheckCircle2 size={14} />}
          {page.resolved ? 'Unsolve' : 'Solve'}
        </button>
      </div>

      {/* Feedback */}
      {successMessage && (
        <div className="text-green-600 text-xs mt-3">{successMessage}</div>
      )}
    </div>
  );
}
