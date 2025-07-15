import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import SeoFiltersPanel from '../components/SeoFiltersPanel';
import SeoReportList from '../features/seoReport/SeoReportList';
import { supabase } from '../services/supabaseClient';


function SeoReportPage() {
  const [pages, setPages] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [locations, setLocations] = useState([]);
const city = searchParams.get('city') || '';

useEffect(() => {
  fetchUserLocations();
}, []);

const fetchUserLocations = async () => {
  const user = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('user_id', user.data.user.id)
    .eq('active', true);

  if (!error) setLocations(data);
};

  const type = searchParams.get('type') || '';
  const minScore = searchParams.get('min') || '';
  const aiStatus = searchParams.get('aiStatus') || '';
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

  const fetchPages = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/seo-report?${searchParams.toString()}`);
      setPages(res.data);
    } catch (err) {
      console.error('Error fetching SEO report:', err.message);
    }
  };

  useEffect(() => {
    fetchPages();
  }, [searchParams]);

  // const filteredPages = pages.filter((page) => {
  //   const resolvedCheck =
  //     resolvedFilter === 'true'
  //       ? page.resolved === true
  //       : resolvedFilter === 'false'
  //       ? !page.resolved
  //       : true;

  //   const scoreCheck =
  //     minScore !== ''
  //       ? typeof page.seoScore === 'number' && page.seoScore >= Number(minScore)
  //       : true;

  //   const urlCheck = urlFilter.trim() === '' ? true : page.url?.toLowerCase().includes(urlFilter.toLowerCase());

  //   return resolvedCheck && scoreCheck && urlCheck;
  // });

  const filteredPages = pages.filter((page) => {
  const resolvedCheck =
    resolvedFilter === 'true'
      ? page.resolved === true
      : resolvedFilter === 'false'
      ? !page.resolved
      : true;

  const scoreCheck =
    minScore !== ''
      ? typeof page.seoScore === 'number' && page.seoScore >= Number(minScore)
      : true;

  const urlCheck = urlFilter.trim() === '' ? true : page.url?.toLowerCase().includes(urlFilter.toLowerCase());

  const cityCheck =
    city === '' ? true : page.url?.toLowerCase().includes(city);

  return resolvedCheck && scoreCheck && urlCheck && cityCheck;
});


  const handleToggleResolved = async (id, newResolved) => {
    try {
      await axios.patch(`http://localhost:3000/seo-report/resolve/${id}`, {
        resolved: newResolved,
      });

      setPages((prev) =>
        prev.map((p) => (p._id === id ? { ...p, resolved: newResolved } : p))
      );
    } catch (err) {
      console.error('Erro ao atualizar resolved:', err.message);
      alert('Erro ao atualizar o status de resolvido.');
    }
  };

  const reanalyzePage = async (id) => {
    try {
      const confirm = window.confirm('Reanalyze this page?');
      if (!confirm) return;

      await axios.post(`http://localhost:3001/seo-report/reanalyze/${id}`);
      fetchPages();
    } catch (err) {
      console.error('Error reanalyzing page:', err.message);
      alert('Failed to reanalyze page');
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">SEO Report</h1>

      <SeoFiltersPanel
       type={type}
  setType={(val) => updateFilters({ type: val })}
  minScore={minScore}
  setMinScore={(val) => updateFilters({ min: val })}
  aiStatus={aiStatus}
  setAiStatus={(val) => updateFilters({ aiStatus: val })}
  resolvedFilter={resolvedFilter}
  setResolvedFilter={(val) => updateFilters({ resolved: val })}
  urlFilter={urlFilter}
  setUrlFilter={(val) => updateFilters({ url: val })}
  city={city}
  setCity={(val) => updateFilters({ city: val })}
  locations={locations}
        // type={type}
        // setType={(val) => updateFilters({ type: val })}
        // minScore={minScore}
        // setMinScore={(val) => updateFilters({ min: val })}
        // aiStatus={aiStatus}
        // setAiStatus={(val) => updateFilters({ aiStatus: val })}
        // resolvedFilter={resolvedFilter}
        // setResolvedFilter={(val) => updateFilters({ resolved: val })}
        // urlFilter={urlFilter}
        // setUrlFilter={(val) => updateFilters({ url: val })}
        onReanalyzeAll={async () => {
          if (!window.confirm('This will reanalyze all pages. Continue?')) return;
          try {
            await axios.post('http://localhost:3001/seo-report/reanalyze-all');
            alert('All pages reanalyzed!');
            fetchPages();
          } catch (err) {
            console.error(err);
            alert('Something went wrong.');
          }
        }}
        onExport={() => {
          const query = searchParams.toString();
          const url = `http://localhost:3000/seo-report/export${query ? '?' + query : ''}`;
          window.open(url, '_blank');
        }}
      />

      <SeoReportList
        data={filteredPages}
        onReanalyze={fetchPages}
        onToggleResolved={handleToggleResolved}
        onReanalyzePage={reanalyzePage}
        urlFilter={urlFilter}
      />
    </div>
  );
}

export default SeoReportPage;
