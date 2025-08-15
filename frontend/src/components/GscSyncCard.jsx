import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

function LogsViewer({ lines }) {
  return (
    <pre className="bg-black text-white text-xs p-3 rounded h-56 overflow-auto">
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </pre>
  );
}

export default function GscSyncCard() {
  const [running, setRunning] = useState(false);
  const [jobId, setJobId] = useState(null);
  const [lines, setLines] = useState([]);
  const esRef = useRef(null);

  const start = async () => {
    try {
      setRunning(true);
      setLines([]);
      setJobId(null);

      const resp = await fetch('/gsc/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // tudo vem do .env no backend; override opcional aqui
      });

      const data = await resp.json();
      if (!resp.ok || !data?.jobId) throw new Error(data?.error || 'Failed to start GSC sync');

      setJobId(data.jobId);
      toast.success('GSC sync started');

      const es = new EventSource(`/gsc/refresh/${data.jobId}/stream`);
      esRef.current = es;

      es.addEventListener('init', (e) => {
        const { startedAt } = JSON.parse(e.data);
        setLines(prev => [...prev, `>> job started (${startedAt})`]);
      });

      es.onmessage = (e) => {
        const line = JSON.parse(e.data);
        setLines(prev => [...prev, line]);
      };

      es.addEventListener('done', (e) => {
        const { status, finishedAt } = JSON.parse(e.data);
        setLines(prev => [...prev, `>> job ${status} (${finishedAt})`]);
        setRunning(false);
        es.close();
        esRef.current = null;
        if (status === 'finished') toast.success('GSC sync finished');
        else toast.error('GSC sync failed');
      });

      es.onerror = () => {
        setLines(prev => [...prev, '!! stream error']);
        setRunning(false);
        es.close();
        esRef.current = null;
        toast.error('Stream error');
      };
    } catch (err) {
      setRunning(false);
      toast.error(err.message);
      setLines(prev => [...prev, `Error: ${err.message}`]);
    }
  };

  const stop = () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
      setRunning(false);
      setLines(prev => [...prev, '>> job stopped by user']);
    }
  };

  useEffect(() => () => { esRef.current?.close(); }, []);

  return (
    <div className="mt-10 p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Sync Search Console</h3>
        <div className="flex gap-2">
          <button
            onClick={start}
            disabled={running}
            className={`px-4 py-2 rounded ${running ? 'bg-gray-400' : 'bg-[#2a2b2e]'} text-white`}
          >
            {running ? 'Running…' : 'Sync Search Console'}
          </button>
          <button
            onClick={stop}
            disabled={!running}
            className={`px-3 py-2 rounded border ${running ? 'opacity-100' : 'opacity-50 cursor-not-allowed'}`}
          >
            Stop
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3">
        Usa GSC_SITE_URL / GSC_DAYS / credenciais do .env no backend. Acompanhe os logs abaixo.
      </p>

      <LogsViewer lines={lines} />
    </div>
  );
}
