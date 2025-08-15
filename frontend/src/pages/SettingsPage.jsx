import { useEffect, useState, useMemo, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { toast } from 'react-hot-toast';

import GscSyncCard from '../components/GscSyncCard';

/** ---------- Small helpers ---------- */
const toArray = (kw) => {
  if (!kw) return [];
  if (Array.isArray(kw)) return kw;
  // split by comma; also support semicolon or newline just in case
  return kw.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
};

const fromArray = (arr) => (Array.isArray(arr) ? arr.join(', ') : String(arr || ''));

const truncate = (text, max = 22) => (text.length > max ? `${text.slice(0, max - 1)}…` : text);

/** ---------- Keyword preview w/ "Read more" ---------- */
function KeywordPreview({ keywords, maxItems = 6, maxCharsPerChip = 22 }) {
  const [expanded, setExpanded] = useState(false);
  const items = useMemo(() => toArray(keywords), [keywords]);

  if (!items.length) return <span className="text-gray-400">—</span>;

  const visible = expanded ? items : items.slice(0, maxItems);
  const hiddenCount = Math.max(0, items.length - maxItems);

  return (
    <div className="flex flex-wrap items-start gap-1">
      {visible.map((kw, i) => (
        <span
          key={`${kw}-${i}`}
          className="inline-block text-[11px] leading-none px-2 py-1 rounded-full border border-gray-200 bg-gray-50"
          title={kw}
        >
          {truncate(kw, maxCharsPerChip)}
        </span>
      ))}

      {!expanded && hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-[11px] underline underline-offset-2"
          aria-label={`Show ${hiddenCount} more keywords`}
        >
          +{hiddenCount} more
        </button>
      )}

      {expanded && items.length > maxItems && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-[11px] underline underline-offset-2"
          aria-label="Show fewer keywords"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function LogsViewer({ lines }) {
  return (
    <pre className="bg-black text-white text-xs p-3 rounded h-56 overflow-auto">
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </pre>
  );
}

export default function SettingsPage() {
  const [locations, setLocations] = useState([]);
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');

  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState('');
  const [newServiceKeywords, setNewServiceKeywords] = useState('');

  const [editingService, setEditingService] = useState(null);
  const [editedServiceName, setEditedServiceName] = useState('');
  const [editedServiceKeywords, setEditedServiceKeywords] = useState('');

  const [editingLocation, setEditingLocation] = useState(null);
  const [editedCity, setEditedCity] = useState('');
  const [editedProvince, setEditedProvince] = useState('');

  const [fetchingIdeas, setFetchingIdeas] = useState(false);
const [jobId, setJobId] = useState(null);
const [logLines, setLogLines] = useState([]);
const [serviceSlugInput, setServiceSlugInput] = useState('');   // opcional
const [locSlugInput, setLocSlugInput] = useState('');           // opcional
const [topN, setTopN] = useState(60);
const [perLoc, setPerLoc] = useState(40);

const [saveIdeas, setSaveIdeas] = useState(true);

// listas de slugs (ativos) + rótulos amigáveis
const serviceSlugOptions = useMemo(() => {
  const list = services.filter(s => s.active).map(s => s.slug).filter(Boolean);
  return Array.from(new Set(list)).sort();
}, [services]);

const serviceSlugLabels = useMemo(() => {
  // slug -> "Nome do serviço"
  return Object.fromEntries(services.map(s => [s.slug, s.name]));
}, [services]);

const locationSlugOptions = useMemo(() => {
  const list = locations.filter(l => l.active).map(l => l.slug).filter(Boolean);
  return Array.from(new Set(list)).sort();
}, [locations]);

const locationSlugLabels = useMemo(() => {
  // slug -> "Cidade, Prov"
  return Object.fromEntries(locations.map(l => [l.slug, `${l.city}, ${l.province}`]));
}, [locations]);


const evtRef = useRef(null);

const startFetchIdeas = async () => {
  try {
    setFetchingIdeas(true);
    setLogLines([]);
    setJobId(null);

    // ajuste a URL pro seu backend (proxy ou baseURL)
    const resp = await fetch('/ads/refresh-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceSlug: serviceSlugInput || undefined,
        onlyLocSlug: locSlugInput || undefined,
        top: Number(topN),
        perLoc: Number(perLoc),
        updateServices: true,
        saveIdeas,       // mude pra true se quiser gravar em keyword_ideas
        // delayMs: 1200,       // se você aplicou o backoff no script
        // maxRetries: 6
      }),
    });

    const data = await resp.json();
    if (!resp.ok) throw new Error(data?.error || 'Failed to start job');

    setJobId(data.jobId);

    // abre SSE
    const es = new EventSource(`/ads/refresh-ideas/${data.jobId}/stream`);
    evtRef.current = es;

    es.addEventListener('init', (e) => {
      setLogLines(prev => [...prev, `>> job started (${JSON.parse(e.data).startedAt})`]);
    });

    es.addEventListener('message', (e) => {
      const line = JSON.parse(e.data);
      setLogLines(prev => [...prev, line]);
    });

    es.addEventListener('done', (e) => {
      const { status, finishedAt } = JSON.parse(e.data);
      setLogLines(prev => [...prev, `>> job ${status} (${finishedAt})`]);
      setFetchingIdeas(false);
      es.close();
    });

    es.onerror = () => {
      setLogLines(prev => [...prev, '!! stream error']);
      setFetchingIdeas(false);
      es.close();
    };
  } catch (err) {
    setFetchingIdeas(false);
    setLogLines(prev => [...prev, `Error: ${err.message}`]);
  }
};

useEffect(() => () => evtRef.current?.close(), []);

  useEffect(() => {
    fetchLocations();
    fetchServices();
  }, []);

  const fetchLocations = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.data.user.id);
    if (!error) setLocations(data || []);
  };

  const handleAddLocation = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return toast.error('Could not get user');
    if (!city || !province) return toast.error('City and province are required.');

    const slug = city.toLowerCase().replace(/\s+/g, '-');

    const { error } = await supabase.from('locations').insert([{
      user_id: user.id,
      city,
      province,
      slug,
      active: true
    }]);

    if (error) return toast.error('Failed to add city.');

    toast.success('City added!');
    setCity('');
    setProvince('');
    fetchLocations();
  };

  const handleToggleActive = async (id, currentStatus) => {
    await supabase.from('locations').update({ active: !currentStatus }).eq('id', id);
    fetchLocations();
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this city?');
    if (!confirm) return;
    await supabase.from('locations').delete().eq('id', id);
    toast.success('City deleted');
    fetchLocations();
  };

  const handleEditLocation = (location) => {
    setEditingLocation(location.id);
    setEditedCity(location.city);
    setEditedProvince(location.province);
  };

  const handleSaveLocation = async (id) => {
    const slug = editedCity.toLowerCase().replace(/\s+/g, '-');
    await supabase
      .from('locations')
      .update({ city: editedCity, province: editedProvince, slug })
      .eq('id', id);
    setEditingLocation(null);
    setEditedCity('');
    setEditedProvince('');
    toast.success('City updated');
    fetchLocations();
  };

  const fetchServices = async () => {
    const user = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('user_id', user.data.user.id);
    if (!error) setServices(data || []);
  };

  const parseKeywordsInput = (text) =>
    text.split(/[,;\n]/).map(s => s.trim()).filter(Boolean);

  const handleAddService = async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return toast.error('Could not get user');
    if (!newService) return toast.error('Service name is required.');

    const slug = newService.toLowerCase().replace(/\s+/g, '-');
    const keywordsArray = parseKeywordsInput(newServiceKeywords);

    const { error } = await supabase.from('services').insert([{
      user_id: user.id,
      name: newService,
      slug,
      active: true,
      keyword: keywordsArray
    }]);

    if (error) return toast.error('Failed to add service.');

    toast.success('Service added!');
    setNewService('');
    setNewServiceKeywords('');
    fetchServices();
  };

  const handleToggleService = async (id, currentStatus) => {
    await supabase.from('services').update({ active: !currentStatus }).eq('id', id);
    fetchServices();
  };

  const handleDeleteService = async (id) => {
    const confirm = window.confirm('Are you sure you want to delete this service?');
    if (!confirm) return;
    await supabase.from('services').delete().eq('id', id);
    toast.success('Service deleted');
    fetchServices();
  };

  const handleEditService = (service) => {
    setEditingService(service.id);
    setEditedServiceName(service.name);
    setEditedServiceKeywords(fromArray(service.keyword || service.keywords || ''));
  };

  const handleSaveService = async (id) => {
    const keywordsArray = parseKeywordsInput(editedServiceKeywords);

    const { error } = await supabase
      .from('services')
      .update({ name: editedServiceName, keyword: keywordsArray })
      .eq('id', id);

    if (error) {
      return toast.error('Failed to update service.');
    }

    setEditingService(null);
    setEditedServiceName('');
    setEditedServiceKeywords('');
    toast.success('Service updated');
    fetchServices();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Settings – Cities</h2>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Province"
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <button onClick={handleAddLocation} className="bg-[#2a2b2e] text-white px-4 py-2 rounded">
          Add City
        </button>
      </div>

      <table className="w-full mb-10">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="p-2">City</th>
            <th>Province</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((loc) => (
            <tr key={loc.id} className="border-t text-sm">
              <td className="p-2">
                {editingLocation === loc.id ? (
                  <input
                    type="text"
                    value={editedCity}
                    onChange={(e) => setEditedCity(e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  loc.city
                )}
              </td>
              <td>
                {editingLocation === loc.id ? (
                  <input
                    type="text"
                    value={editedProvince}
                    onChange={(e) => setEditedProvince(e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  loc.province
                )}
              </td>
              <td>{loc.active ? 'Active' : 'Inactive'}</td>
              <td className="flex gap-2 py-2">
                {editingLocation === loc.id ? (
                  <button onClick={() => handleSaveLocation(loc.id)} className="text-green-600">Save</button>
                ) : (
                  <button onClick={() => handleEditLocation(loc)} className="text-blue-600">Edit</button>
                )}
                <button onClick={() => handleToggleActive(loc.id, loc.active)} className="text-blue-600">
                  {loc.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDelete(loc.id)} className="text-red-500">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-2xl font-bold mb-4">Services</h2>

      {/* Create new service + keywords */}
      <div className="mb-6 grid grid-cols-1 gap-3">
        <input
          type="text"
          placeholder="New Service"
          value={newService}
          onChange={(e) => setNewService(e.target.value)}
          className="border p-2 rounded w-full"
        />
        <textarea
          placeholder="Comma-separated keywords (e.g., window installation, window installers, replacement windows)"
          value={newServiceKeywords}
          onChange={(e) => setNewServiceKeywords(e.target.value)}
          className="border p-2 rounded w-full h-20"
        />
        <button onClick={handleAddService} className="bg-[#2a2b2e] text-white px-4 py-2 rounded w-max">
          Add Service
        </button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="p-2">Service</th>
            <th>Status</th>
            <th>Keywords</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((svc) => (
            <tr key={svc.id} className="border-t text-sm">
              <td className="p-2">
                {editingService === svc.id ? (
                  <input
                    type="text"
                    value={editedServiceName}
                    onChange={(e) => setEditedServiceName(e.target.value)}
                    className="border p-1 rounded w-full"
                  />
                ) : (
                  svc.name
                )}
              </td>

              <td>{svc.active ? 'Active' : 'Inactive'}</td>

              <td className="p-2 align-top">
                {editingService === svc.id ? (
                  <textarea
                    placeholder="Comma-separated keywords"
                    value={editedServiceKeywords}
                    onChange={(e) => setEditedServiceKeywords(e.target.value)}
                    className="border p-2 rounded w-full h-20"
                  />
                ) : (
                  <KeywordPreview
                    keywords={svc.keyword || svc.keywords || []}
                    maxItems={6}
                    maxCharsPerChip={22}
                  />
                )}
              </td>

              <td className="flex gap-2 py-2">
                {editingService === svc.id ? (
                  <button onClick={() => handleSaveService(svc.id)} className="text-green-600">Save</button>
                ) : (
                  <button onClick={() => handleEditService(svc)} className="text-blue-600">Edit</button>
                )}
                <button onClick={() => handleToggleService(svc.id, svc.active)} className="text-blue-600">
                  {svc.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => handleDeleteService(svc.id)} className="text-red-500">Delete</button>
              </td>
            </tr>
            
          ))}


        </tbody>
      </table>
      <table className="w-full mt-10">
        <thead>
          </thead>
        <tbody> 
          {/* ---- Fetch Ideas (Google Ads) ---- */}
<div className="mt-10 p-4 border rounded-lg">
  <h3 className="text-lg font-semibold mb-3">Fetch Ideas (Google Ads)</h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
    <input
  type="text"
  list="service-slugs"
  placeholder="Service slug (opcional) — ex: window-installation"
  value={serviceSlugInput}
  onChange={(e) => setServiceSlugInput(e.target.value)}
  className="border p-2 rounded w-full"
/>
<datalist id="service-slugs">
  {serviceSlugOptions.map((slug) => (
    <option
      key={slug}
      value={slug}
      label={serviceSlugLabels[slug] ? `${serviceSlugLabels[slug]} — ${slug}` : slug}
    />
  ))}
</datalist>

<input
  type="text"
  list="location-slugs"
  placeholder="Location slug (opcional) — ex: kitchener"
  value={locSlugInput}
  onChange={(e) => setLocSlugInput(e.target.value)}
  className="border p-2 rounded w-full"
/>
<datalist id="location-slugs">
  {locationSlugOptions.map((slug) => (
    <option
      key={slug}
      value={slug}
      label={locationSlugLabels[slug] ? `${locationSlugLabels[slug]} — ${slug}` : slug}
    />
  ))}
</datalist>
{/* <button onClick={() => setServiceSlugInput('')} className="text-xs underline">Clear service</button>
<button onClick={() => setLocSlugInput('')} className="text-xs underline">Clear location</button> */}
    <input
      type="number"
      placeholder="Top overall"
      value={topN}
      onChange={(e) => setTopN(e.target.value)}
      className="border p-2 rounded w-full"
      min={10}
      max={200}
    />
    <input
      type="number"
      placeholder="Per location"
      value={perLoc}
      onChange={(e) => setPerLoc(e.target.value)}
      className="border p-2 rounded w-full"
      min={5}
      max={100}
    />
  </div>
  <div className="mb-3">
<label className="flex items-center gap-2 text-sm">
  <input
    type="checkbox"
    checked={saveIdeas}
    onChange={(e) => setSaveIdeas(e.target.checked)}
  />
  Save per-city ideas (keyword_ideas)
</label>
</div>
  <button
    onClick={startFetchIdeas}
    disabled={fetchingIdeas}
    className={`px-4 py-2 rounded ${fetchingIdeas ? 'bg-gray-400' : 'bg-[#2a2b2e]'} text-white`}
  >
    {fetchingIdeas ? 'Running…' : 'Fetch Ideas'}
  </button>

  <div className="mt-4">
    <LogsViewer lines={logLines} />
  </div>
</div>

</tbody>
      </table>
      <table className="w-full mt-10">
        <thead>
          </thead>
        <tbody>
          {/* ---- GSC Sync Card ---- */} 
          <GscSyncCard />
        </tbody>
      </table>
    </div>
  );
}
