// import express from 'express';
// import * as gscController from '../controllers/gscController.js';

// const router = express.Router();

// router.get('/auth', gscController.authController);
// router.get('/callback', gscController.setTokensController);
// router.get('/report', gscController.getReportController);

// export default router;


// routes/gsc.js  (ESM)
import express from 'express';
import * as gscController from '../controllers/gscController.js';
import { randomUUID } from 'crypto';
import { runGSCIngest } from '../services/gscService.js';
import { listGscSites } from '../services/gscService.js';

const router = express.Router();

// --- suas rotas existentes ---
router.get('/auth', gscController.authController);
router.get('/callback', gscController.setTokensController);
router.get('/report', gscController.getReportController);

// --- NOVO: job store em memória para logs do SSE ---
const jobs = new Map(); // jobId -> { status, logs:[], startedAt, finishedAt }

// POST /gsc/refresh  -> dispara a ingestão (usa ENV por padrão)
router.post('/refresh', async (req, res) => {
  const jobId = randomUUID();
  const job = {
    status: 'running',
    logs: [],
    startedAt: new Date().toISOString(),
    finishedAt: null
  };
  jobs.set(jobId, job);

  const onLog = (line) => {
    job.logs.push(line);
    if (job.logs.length > 2000) job.logs.shift(); // limita memória
  };

  // roda em background (não bloqueia a resposta)
  (async () => {
    try {
      // se quiser, pode mandar overrides no body: { userId, siteUrl, days }
      const { userId, siteUrl, days } = req.body || {};
      await runGSCIngest({ onLog, userId, siteUrl, days });
      job.status = 'finished';
    } catch (e) {
      onLog('ERROR: ' + (e?.message || String(e)));
      job.status = 'failed';
    } finally {
      job.finishedAt = new Date().toISOString();
    }
  })();

  return res.status(202).json({ jobId });
});

// GET /gsc/refresh/:jobId/stream  -> SSE com logs em tempo real
router.get('/refresh/:jobId/stream', (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  // estado inicial + backlog
  res.write(`event: init\ndata: ${JSON.stringify({ status: job.status, startedAt: job.startedAt })}\n\n`);
  job.logs.forEach(line => res.write(`data: ${JSON.stringify(line)}\n\n`));

  let last = job.logs.length;
  const interval = setInterval(() => {
    const j = jobs.get(req.params.jobId);
    if (!j) return;
    while (last < j.logs.length) {
      res.write(`data: ${JSON.stringify(j.logs[last])}\n\n`);
      last++;
    }
    if (j.status !== 'running') {
      res.write(`event: done\ndata: ${JSON.stringify({ status: j.status, finishedAt: j.finishedAt })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 500);

  req.on('close', () => clearInterval(interval));
});


router.get('/sites', async (_req, res) => {
  try {
    const sites = await listGscSites();
    res.json(sites);
  } catch (e) {
    const status = e?.response?.status || 500;
    const msg = e?.response?.data?.error?.message || e.message || 'Unknown error';
    console.error('[GSC /sites]', status, msg);
    res.status(status).json({ error: msg });
  }
});


export default router;
