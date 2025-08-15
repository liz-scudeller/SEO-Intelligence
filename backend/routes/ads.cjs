// routes/ads.js
const { Router } = require('express');
const { spawn } = require('child_process');
const path = require('path');
const { randomUUID } = require('crypto');

const router = Router();
// memória simples p/ jobs (se preferir, troque por Redis)
const jobs = new Map(); // jobId -> { status, logs: [], startedAt, finishedAt }

function buildArgsFromBody(body = {}) {
  const {
    serviceSlug = '',     // ex: "window-installation"
    onlyLocSlug = '',     // ex: "kitchener"
    top = 60,
    perLoc = 40,
    updateServices = true,
    saveIdeas = false,
    delayMs,              // ex: 1200 (opcional, se já tiver aplicado backoff no script)
    maxRetries            // ex: 6
  } = body;

  const args = [
    'services/pullKeywordIdeasFromGoogleAds.cjs',
    `--top=${Number(top)}`,
    `--per-loc=${Number(perLoc)}`,
  ];
  if (updateServices) args.push('--update-services');
  if (saveIdeas) args.push('--save-ideas');
  if (serviceSlug) args.push(`--service-slug=${serviceSlug}`);
  if (onlyLocSlug) args.push(`--only-loc-slug=${onlyLocSlug}`);
  if (delayMs) args.push(`--delay-ms=${Number(delayMs)}`);
  if (maxRetries) args.push(`--max-retries=${Number(maxRetries)}`);
  return args;
}

// POST /ads/refresh-ideas -> { jobId }
router.post('/refresh-ideas', async (req, res) => {
  const jobId = randomUUID();
  const args = buildArgsFromBody(req.body);

  const job = { status: 'running', logs: [], startedAt: new Date().toISOString(), finishedAt: null };
  jobs.set(jobId, job);

  const child = spawn(process.execPath, args, {
    cwd: path.resolve(process.cwd()), // raiz do projeto (onde está "services/")
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  const pushLog = (line) => {
    job.logs.push(line);
    // limita memória (últimos 2000)
    if (job.logs.length > 2000) job.logs.shift();
  };

  child.stdout.on('data', (buf) => {
    const line = buf.toString();
    line.split(/\r?\n/).forEach(l => l && pushLog(`[OUT] ${l}`));
  });
  child.stderr.on('data', (buf) => {
    const line = buf.toString();
    line.split(/\r?\n/).forEach(l => l && pushLog(`[ERR] ${l}`));
  });

  child.on('close', (code) => {
    job.status = code === 0 ? 'finished' : 'failed';
    job.finishedAt = new Date().toISOString();
  });

  res.status(202).json({ jobId });
});

// GET /ads/refresh-ideas/:jobId/stream (SSE)
router.get('/refresh-ideas/:jobId/stream', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  if (!job) return res.status(404).end();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');

  // envia histórico inicial
  res.write(`event: init\ndata: ${JSON.stringify({ status: job.status, startedAt: job.startedAt })}\n\n`);
  job.logs.forEach(line => res.write(`data: ${JSON.stringify(line)}\n\n`));

  // ticker simples para push incremental
  let lastLen = job.logs.length;
  const interval = setInterval(() => {
    const j = jobs.get(jobId);
    if (!j) return;
    while (lastLen < j.logs.length) {
      res.write(`data: ${JSON.stringify(j.logs[lastLen])}\n\n`);
      lastLen++;
    }
    if (j.status !== 'running') {
      res.write(`event: done\ndata: ${JSON.stringify({ status: j.status, finishedAt: j.finishedAt })}\n\n`);
      clearInterval(interval);
      res.end();
    }
  }, 500);

  req.on('close', () => clearInterval(interval));
});

module.exports = router;
