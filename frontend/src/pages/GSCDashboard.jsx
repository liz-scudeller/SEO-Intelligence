import React, { useState, useEffect } from 'react';
import GSCFilters from '../features/gsc/GSCFilters';
import GSCResultsTable from '../features/gsc/GSCResultsTable';
import GSCSuggestionsPanel from '../features/gsc/GSCSuggestionsPanel';
import { supabase } from '../services/supabaseClient';

export default function GSCDashboard() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [city, setCity] = useState('');
  const [service, setService] = useState('');
  const [dimension, setDimension] = useState('page,query');
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [showLowCTR, setShowLowCTR] = useState(false);
  const [showGoodRankings, setShowGoodRankings] = useState(false);
  const [seoSuggestions, setSeoSuggestions] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [excludeTerm, setExcludeTerm] = useState('');
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [cities, setCities] = useState([]);
  const [services, setServices] = useState([]);
  const [userId, setUserId] = useState(null);
  const [showOnlySuggestions, setShowOnlySuggestions] = useState(false);
  const [slugSuggestions, setSlugSuggestions] = useState({});

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id || null);
    };
    fetchUser();
  }, []);

  const handleFetch = async () => {
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date cannot be after end date.");
      return;
    }

    setLoadingReport(true);
    try {
      const siteUrl = 'https://homeservicesolutions.ca';
      const response = await fetch(`/gsc/report?siteUrl=${siteUrl}&startDate=${startDate}&endDate=${endDate}&dimensions=${dimension}`);
      const result = await response.json();

      const rows = Array.isArray(result) ? result : result.rows || [];
      setData(rows);
      filterData(rows);
    } catch (error) {
      console.error("Error fetching GSC report:", error);
    } finally {
      setLoadingReport(false);
    }
  };

  const filterData = (rows) => {
    if (!Array.isArray(rows)) return;
    const cityLower = city.toLowerCase();
    const serviceLower = service.toLowerCase();
    const excludedTerms = excludeTerm.toLowerCase().split(/[ ,]+/).map((t) => t.trim()).filter(Boolean);
    const normalizeWhitespace = (str) => str.replace(/\s+/g, ' ').trim();

    const filtered = rows.filter((row) => {
      const keys = row.keys?.map((k) => k.toLowerCase()) || [];
      let keyword = '';
      if (dimension === 'query') keyword = keys[0] || '';
      else if (dimension === 'page,query') keyword = keys[1] || '';

      const matchesCity = !city || keys.join(' ').includes(cityLower);
      const matchesService = !service || keys.join(' ').includes(serviceLower);
      const notExcluded =
        excludedTerms.length === 0 ||
        !excludedTerms.some((term) => normalizeWhitespace(keyword).includes(normalizeWhitespace(term)));

      return matchesCity && matchesService && notExcluded;
    });

    setFilteredData(filtered);
  };

  useEffect(() => {
    filterData(data);
  }, [city, service, excludeTerm, dimension, data]);

  useEffect(() => {
    const fetchCities = async () => {
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('locations')
        .select('city')
        .eq('user_id', user.data.user.id)
        .eq('active', true);

      if (!error && data) {
        setCities(data.map(loc => loc.city));
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchServices = async () => {
      const user = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('services')
        .select('name')
        .eq('user_id', user.data.user.id)
        .eq('active', true);

      if (!error && data) {
        setServices(data.map(s => s.name));
      }
    };
    fetchServices();
  }, []);



  const visibleData = filteredData.filter(row => {
    const keys = row.keys || [];
    const url = keys[0] || '';
    const keyword = dimension === 'page,query' ? keys[1] : keys[0];
    const key = `${url}_${keyword}`;

    const isOpportunity = row.impressions > 500 && row.position > 10;
    const isLowCTR = row.position <= 5 && row.ctr < 0.02;
    const isGoodRanking = row.position <= 3 && row.ctr >= 0.05;
    const hasLocalPageOpportunity = slugSuggestions[key];

    if (showOpportunities && !isOpportunity) return false;
    if (showLowCTR && !isLowCTR) return false;
    if (showGoodRankings && !isGoodRanking) return false;

    return true;
  });


  const sortedData = [...visibleData].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField] ?? '';
    let bVal = b[sortField] ?? '';
    if (sortField === 'url') {
      aVal = a.keys?.[0] ?? '';
      bVal = b.keys?.[0] ?? '';
    }
    if (sortField === 'keyword') {
      aVal = a.keys?.[1] ?? '';
      bVal = b.keys?.[1] ?? '';
    }
    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  console.log('🔎 sortedData:', sortedData);

function groupByDimension(data, dimension) {
  const grouped = {};
  data.forEach((row) => {
    let key;
    if (dimension === 'query') {
      key = row.keys?.[0];
    } else if (dimension === 'page') {
      key = row.keys?.[0];
    } else if (dimension === 'page,query') {
      key = row.keys?.[1];
    } else {
      key = 'unknown';
    }

    if (!key) return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(row);
  });
  return grouped;
}


  const getSeoScore = (row) => {
    const { impressions, ctr, position } = row;
    if (impressions > 1000 && position > 10) return '🔥 High Priority';
    if (position < 3 && ctr < 0.01) return '⚠️ Bad Title/Description';
    if (ctr >= 0.05 && position > 10) return '👍 Good copywriting, missing ranking';
    return '✔️ OK';
  };

  const setToday = () => {
    setStartDate(today);
    setEndDate(today);
  };

  const setLast7Days = () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setStartDate(sevenDaysAgo);
    setEndDate(today);
  };

  const setLast30Days = () => {
    setStartDate(thirtyDaysAgo);
    setEndDate(today);
  };

const getSeoSuggestions = async () => {
  if (loadingReport || loadingSuggestions) return;

  if (!filteredData || filteredData.length === 0) {
    alert("No data available to analyze.");
    return;
  }

  setLoadingSuggestions(true); // ✅
  try {
    const response = await fetch('http://localhost:3000/ai/seo-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: filteredData }),
    });
    const result = await response.json();
    setSeoSuggestions(result?.suggestions || []);
  } catch (error) {
    console.error('AI error:', error);
    setSeoSuggestions('An error occurred while fetching suggestions.');
  } finally {
    setLoadingSuggestions(false); // ✅
  }
};

const generateSeoSuggestionsWithFilter = async (filterType) => {
  if (!filteredData || filteredData.length === 0) {
    alert("No data available to analyze.");
    return;
  }

  try {
    const response = await fetch(`http://localhost:3000/ai/seo-suggestions?filterType=${filterType}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: filteredData, userId }),
    });
    const result = await response.json();
    setSeoSuggestions(result.suggestions);
  } catch (error) {
    console.error('Error generating filtered SEO suggestions:', error);
    setSeoSuggestions('An error occurred while fetching suggestions.');
  }
};


  const getRowColor = (row) => {
    if (row.impressions > 500 && row.position > 10) return 'bg-yellow-100';
    if (row.position <= 5 && row.ctr < 0.02) return 'bg-red-100';
    if (row.position <= 3 && row.ctr >= 0.05) return 'bg-green-100';
    return '';
  };

  return (
    <div className="p-6 max-w-screen-2xl mx-auto text-gray-800">
      <h1 className="text-3xl font-bold mb-8">Search Console Dashboard</h1>

<GSCFilters {...{
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
}} />

      <div className="flex flex-wrap gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-gray-300"></div>
          <span>High impressions, low rank (Opportunity)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-gray-300"></div>
          <span>Good rank, low CTR (Improve meta)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-gray-300"></div>
          <span>Top performer (Good CTR & Position)</span>
        </div>
      </div>

      <GSCResultsTable
  groupedData={groupByDimension(sortedData, dimension)}
         getSeoScore={getSeoScore}
        getRowColor={getRowColor}
        dimension={dimension}
        showOnlySuggestions={showOnlySuggestions}
      />

      <div className="flex flex-wrap gap-4 my-6">
        <button
          onClick={() => generateSeoSuggestionsWithFilter('ranking')}
          className="bg-[#759b2c] hover:bg-[#638c26] text-white px-4 py-2 rounded"
        >
          🎯 SEO Suggestions for Ranking
        </button>
        <button
          onClick={() => generateSeoSuggestionsWithFilter('lowCtr')}
          className="bg-[#2a2b2e] hover:bg-[#1e1f21] text-white px-4 py-2 rounded"
        >
          📉 SEO Suggestions for Low CTR
        </button>
      </div>

      <GSCSuggestionsPanel suggestions={seoSuggestions} />
    </div>
  );
}
