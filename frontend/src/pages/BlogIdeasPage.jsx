import { supabase } from '../services/supabaseClient';
import { useEffect, useState } from 'react';
import axios from 'axios';


export default function BlogIdeasPage() {
  const today = new Date();
  const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  const formatDate = (d) => d.toISOString().slice(0, 10);

  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(formatDate(firstDayLastMonth));
  const [endDate, setEndDate] = useState(formatDate(firstDayThisMonth));
  const [generatingId, setGeneratingId] = useState(null);
  const [filterPosted, setFilterPosted] = useState('all');
  const [userId, setUserId] = useState(null);

useEffect(() => {
  const getUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Erro ao pegar usuário:', error.message);
    } else if (user) {
      setUserId(user.id);
    }
  };

  getUser();
}, []);


  const fetchIdeas = async () => {
    const res = await axios.get('http://localhost:3001/blog-ideas');
    const allIdeas = res.data.suggestions || [];
    const filtered = filterPosted === 'all'
      ? allIdeas
      : allIdeas.filter(i => filterPosted === 'posted' ? i.posted : !i.posted);
    setIdeas(filtered);
  };

  const generateIdeas = async () => {
    setLoading(true);
    try {
      // await axios.post(`http://localhost:3001/blog-ideas/generate?start=${startDate}&end=${endDate}`);
      await axios.post(
  `http://localhost:3001/blog-ideas/generate?start=${startDate}&end=${endDate}`,
  { userId }
);

      await fetchIdeas();
    } catch (err) {
      console.error('Failed to generate blog ideas:', err.message);
      alert('Could not generate blog ideas.');
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async (id) => {
    setGeneratingId(id);
    try {
      await axios.post(`http://localhost:3001/blog-ideas/${id}/generate-content`);
      await fetchIdeas();
    } catch (err) {
      console.error(err);
      alert('❌ Failed to generate blog content.');
    } finally {
      setGeneratingId(null);
    }
  };

  useEffect(() => { fetchIdeas(); }, []);
  useEffect(() => { fetchIdeas(); }, [filterPosted]);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#2a2b2e]">📝 Blog Post Ideas</h1>

        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-medium text-[#2a2b2e]">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-3 py-1" />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#2a2b2e]">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-3 py-1" />
          </div>
          <button
            onClick={generateIdeas}
            disabled={loading}
            className="self-end px-4 py-2 rounded text-white bg-[#759b2c] hover:bg-[#638c26] disabled:opacity-50 text-sm"
          >
            {loading ? 'Generating...' : '✨ Generate Ideas'}
          </button>
        </div>
      </div>

      <div className="mb-4">
        <label className="mr-2 font-medium text-[#2a2b2e]">Filter:</label>
        <select
          value={filterPosted}
          onChange={(e) => setFilterPosted(e.target.value)}
          className="border px-3 py-1 rounded"
        >
          <option value="all">All</option>
          <option value="posted">✅ Posted</option>
          <option value="not-posted">❌ Not Posted</option>
        </select>
      </div>

      {ideas.length === 0 ? (
        <p className="text-gray-500">No blog ideas available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ideas.map((idea) => (
  <div
    key={idea._id}
    className="p-4 border border-gray-200 rounded-xl shadow-sm bg-white flex flex-col h-full"
  >
    {/* CONTEÚDO */}
    <div className="flex-1 overflow-auto space-y-2 text-sm text-[#2a2b2e]">
      <div>
        <p><strong>Keyword:</strong> {idea.keyword}</p>
        <p><strong>Title:</strong> {idea.blogTitle || idea.seoTitle}</p>
        <p><strong>Slug:</strong> {idea.slug}</p>
        <p><strong>Meta Description:</strong> {idea.metaDescription}</p>
      </div>

      {idea.justification && (
        <div className="bg-green-50 border border-gray-200 p-2 rounded text-sm">
          <p className="font-medium">Justification:</p>
          <p>{idea.justification}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 text-sm text-gray-700 pt-2">
        <p><strong>Impressions:</strong> {idea.impressions ?? '-'}</p>
        <p><strong>Clicks:</strong> {idea.clicks ?? '-'}</p>
        <p><strong>CTR:</strong> {idea.ctr ? `${(idea.ctr * 100).toFixed(2)}%` : '-'}</p>
        <p><strong>Position:</strong> {idea.position != null ? Math.trunc(idea.position) : '-'}</p>
        <p className={`font-medium ${idea.semanticScore >= 7 ? 'text-[#759b2c]' : idea.semanticScore < 4 ? 'text-red-600' : 'text-yellow-600'}`}>
          Score: {idea.semanticScore}/10
        </p>
        <p><strong>CTA:</strong> {idea.hasCallToAction ? 'Yes' : 'No'}</p>
      </div>

      {idea.contentPrompt && (
        <div className="pt-2">
          <p className="font-medium mb-1">Prompt:</p>
          <textarea
            className="w-full text-xs bg-white p-2 border border-gray-300 rounded resize-none"
            rows={5}
            defaultValue={idea.contentPrompt}
            onChange={(e) => {
              idea._updatedPrompt = e.target.value;
            }}
          />
        </div>
      )}
    </div>

    {/* AÇÕES */}
    <div className="mt-4 border-t pt-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Save Prompt à esquerda */}
        <button
          onClick={async () => {
            try {
              const updatedPrompt = idea._updatedPrompt || idea.contentPrompt;
              await axios.patch(`http://localhost:3001/blog-ideas/${idea._id}/save-prompt`, {
                contentPrompt: updatedPrompt,
              });
              await fetchIdeas();
            } catch (err) {
              console.error('Failed to save prompt:', err.message);
              alert('Could not save updated prompt.');
            }
          }}
          className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 text-[#2a2b2e] w-full sm:w-auto"
        >
          Save Prompt
        </button>

        {/* Botões lado a lado */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => generateContent(idea._id)}
            disabled={generatingId === idea._id}
            className="px-3 py-1 bg-[#759b2c] text-white rounded hover:bg-[#638c26] text-sm disabled:opacity-50 w-full sm:w-auto"
          >
            {generatingId === idea._id ? 'Generating...' : 'Generate'}
          </button>

          <button
            onClick={async () => {
              if (window.confirm('Are you sure you want to delete this idea?')) {
                try {
                  await axios.delete(`http://localhost:3001/blog-ideas/${idea._id}`);
                  await fetchIdeas();
                } catch (err) {
                  console.error('Failed to delete idea:', err.message);
                  alert('Could not delete this blog idea.');
                }
              }
            }}
            className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 w-full sm:w-auto"
          >
            Delete
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
              {idea.posted ? 'Posted' : 'Not Posted'}
            </span>

            <button
              onClick={async () => {
                try {
                  const newStatus = !idea.posted;
                  await axios.patch(`http://localhost:3001/blog-ideas/${idea._id}/posted`, {
                    posted: newStatus,
                  });
                  await fetchIdeas();
                } catch (err) {
                  console.error('Failed to update posted status:', err.message);
                  alert('Could not update posted status.');
                }
              }}
              className={`w-12 h-6 rounded-full transition-all duration-300 relative ${idea.posted ? 'bg-[#759b2c]' : 'bg-gray-300'}`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all duration-300 ${
                  idea.posted ? 'left-[1.5rem]' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
))}

        </div>
      )}
    </div>
  );
}
