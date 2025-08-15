import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

import gscRoute from './routes/gscRoute.js';
import openAIRoute from './routes/openAIRoute.js';
import SeoTasksRoute from './routes/seoTasksRoute.js';
import classifiedPagesRoute from './routes/classifiedPagesRoute.js';
import seoReportRoute from './routes/seoReportRoute.js';
import blogIdeasRoute from './routes/seo/blogIdeasRoute.js';
import adsRoutes from './routes/ads.cjs';

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true,
}));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

app.get('/', (req, res) => {
  res.send('SEO AI Backend is running ✅');
});

app.use('/ads', adsRoutes);
app.use('/gsc', gscRoute);
app.use('/ai', openAIRoute);
app.use('/api/seo-tasks', SeoTasksRoute);
app.use('/classified-pages', classifiedPagesRoute);
app.use('/seo-report', seoReportRoute);
app.use('/blog-ideas', blogIdeasRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
