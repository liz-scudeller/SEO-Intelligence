import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function SeoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [showJson, setShowJson] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [message, setMessage] = useState('');


  useEffect(() => {
    fetchReport();
  }, [id]);

  useEffect(() => {
  if (report && (!report.aiRecommendations || report.aiRecommendations.items?.length === 0)) {
    generateRecommendations(false); // Gera automaticamente se não existir
  }
}, [report]);

  const fetchReport = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/seo-report/${id}/details`);
      setReport(res.data);
    } catch (err) {
      console.error('Error fetching details:', err.message);
    }
  };

  const generateRecommendations = async (regenerate = false) => {
  setLoadingRecs(true);
  setMessage('');
  try {
    const endpoint = regenerate
      ? `http://localhost:3000/seo-report/${id}/recommendations/regenerate`
      : `http://localhost:3000/seo-report/${id}/recommendations`;

    const res = await axios.get(endpoint);
    await fetchReport();

const items = res.data?.aiRecommendations?.items || [];
    if (!items || items.length === 0) {
      setMessage('No recommendations were generated.');
    } else {
      setMessage('Recommendations successfully updated.');
    }
  } catch (err) {
    console.error('Failed to generate AI recommendations:', err.message);
    setMessage('Error generating recommendations.');
  } finally {
    setLoadingRecs(false);
  }
};


  if (!report) return <p className="p-6 text-gray-500">Loading...</p>;
function getSuggestionForIssue(issue) {
  const rules = [
    { match: 'Missing <title>', fix: 'Add a <title> tag with 50–60 characters.' },
    { match: 'Meta description too short', fix: 'Write a meta description with 120–160 characters.' },
    { match: 'Meta description too long', fix: 'Shorten the meta description to 160 characters or less.' },
    { match: 'Missing meta description', fix: 'Add a meta description to summarize the page.' },
    { match: 'Missing Open Graph', fix: 'Include Open Graph meta tags for better social sharing.' },
    { match: 'Missing canonical', fix: 'Add a <link rel="canonical"> to specify the preferred URL.' },
    { match: 'Missing structured data', fix: 'Include JSON-LD structured data to improve search engine understanding.' },
    { match: 'Multiple <h1> tags', fix: 'Use only one <h1> tag per page.' },
    { match: 'Incorrect heading tag order', fix: 'Ensure heading tags follow a logical hierarchy (H1 > H2 > H3).' },
    { match: '<img> tags without alt', fix: 'Add descriptive alt attributes to all images.' },
    { match: 'No internal links', fix: 'Add links to other pages within your site.' },
    { match: 'No external links', fix: 'Add links to reputable external sources.' },
    { match: '<title> too long', fix: 'Shorten the <title> to 60 characters or less.' }
  ];

  const found = rules.find(rule => issue.includes(rule.match));
  return found?.fix || '';
}

  return (
    <div className="p-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-blue-600 hover:underline text-sm"
      >
        ← Back to SEO Report
      </button>

      <h1 className="text-3xl font-bold mb-2">{report.url}</h1>
      <p className="text-sm text-gray-500 mb-6">
        Slug: {report.slug} | Type: {report.type}
      </p>

      {/* SCORE + STATUS + BOTÕES */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div>
          <p className="text-sm">AI Visibility Score:</p>
          <p className="text-2xl font-bold text-blue-700">
            {typeof report.aiVisibilityScore === 'number'
              ? `${report.aiVisibilityScore}/50`
              : 'N/A'}
          </p>
        </div>

        <div>
          <p className="text-sm">Status:</p>
          <p className="text-md">{report.resolved ? '✅ Resolved' : '🕓 Pending'}</p>
        </div>



      </div>

      {/* CHECKLIST */}
{/* SEO Checklist */}
<div className="mb-8">
  <h2 className="text-xl font-semibold mb-2">SEO Checklist</h2>
  {Array.isArray(report.seoChecklist) && report.seoChecklist.length > 0 ? (
    <ul className="space-y-4">
      {report.seoChecklist.map((item, index) => {
  const suggestion = getSuggestionForIssue(item);
  return (
    <li
      key={index}
      className="border border-gray-200 bg-gray-50 p-4 rounded-md"
    >
      <p className="text-sm text-red-700 font-medium mb-1">
        Issue: <span className="font-normal">{item}</span>
      </p>
      {suggestion && (
        <p className="text-sm text-green-700">
          Fix: <span className="font-normal">{suggestion}</span>
        </p>
      )}
    </li>
  );
})}

    </ul>
  ) : (
    <p className="text-sm text-gray-500">No checklist found.</p>
  )}
</div>


{/* PAGE DETAILS */}
<div className="mb-8">
  <button
    onClick={() => setShowJson(prev => ({ ...prev, pageDetails: !prev.pageDetails }))}
    className="text-base font-semibold mb-2 text-[#759b2c] hover:underline"
  >
    {showJson?.pageDetails ? 'Hide Page Details ▲' : 'Show Page Details ▼'}
  </button>

  {showJson?.pageDetails && (
    <div className="mt-4 space-y-8">
      {/* HEADINGS */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Page Headings</h2>
        {report.headings && Object.keys(report.headings).length > 0 ? (
          Object.entries(report.headings).map(([tag, list]) => (
            <div key={tag} className="mb-2">
              <h4 className="font-semibold uppercase">{tag}</h4>
              {list.length > 0 ? (
                <ul className="list-disc pl-6 text-sm">
                  {list.map((text, idx) => (
                    <li key={idx}>{text}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">No {tag} tags found.</p>
              )}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No headings found.</p>
        )}
      </div>

      {/* META TAGS */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Meta Tags</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <ul className="list-disc pl-6 text-sm text-gray-800">
            {report.metaTags?.title && (
              <li><strong>Title:</strong> {report.metaTags.title}</li>
            )}
            {report.metaTags?.description && (
              <li><strong>Description:</strong> {report.metaTags.description}</li>
            )}
            {report.metaTags?.ogTitle && (
              <li><strong>OG Title:</strong> {report.metaTags.ogTitle}</li>
            )}
            {report.metaTags?.ogDescription && (
              <li><strong>OG Description:</strong> {report.metaTags.ogDescription}</li>
            )}
            {report.metaTags?.ogImage && (
              <li><strong>OG Image:</strong> {report.metaTags.ogImage}</li>
            )}
            {report.metaTags?.canonical && (
              <li><strong>Canonical:</strong> {report.metaTags.canonical}</li>
            )}
          </ul>
        </div>
      </div>

      {/* STRUCTURED DATA */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Structured Data (JSON-LD)</h2>
        <button
          onClick={() => setShowJson(prev => ({ ...prev, structuredData: !prev.structuredData }))}
          className="text-sm mb-2 text-[#759b2c] hover:underline"
        >
          {showJson?.structuredData ? 'Hide Structured Data ▲' : 'Show Structured Data ▼'}
        </button>
        {showJson?.structuredData && report.structuredData ? (
          <pre className="bg-gray-900 text-green-200 text-xs p-4 rounded overflow-x-auto max-h-[400px]">
            {JSON.stringify(report.structuredData, null, 2)}
          </pre>
        ) : (
          !report.structuredData && (
            <p className="text-sm text-gray-500">No structured data found.</p>
          )
        )}
      </div>
    </div>
  )}
</div>

      {/* AI RECOMMENDATIONS */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">AI Recommendations</h2>
        {report.aiRecommendations?.items?.length > 0 ? (
          <ul className="space-y-4">
  {Array.isArray(report.aiRecommendations?.items) && report.aiRecommendations.items.length > 0 ? (
  <ul className="space-y-4">
    {report.aiRecommendations.items.map((rec, idx) => (
      <li
        key={idx}
        className="border border-gray-200 bg-gray-50 p-4 rounded-md"
      >
        <p className="text-sm text-red-700 font-medium mb-1">
          Issue: <span className="font-normal">{rec.type || '—'}</span>
        </p>
        <p className="text-sm text-green-700">
          Fix: <span className="font-normal">{rec.suggestion || '—'}</span>
        </p>
      </li>
    ))}
  </ul>
) : (
  <p className="text-sm text-gray-500">No AI recommendations found.</p>
)}

</ul>

        ) : (
          <p className="text-sm text-gray-500">No AI recommendations found.</p>
        )}
      </div>
    </div>
  );
}
