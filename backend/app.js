require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const gscRoute = require('./routes/gscRoute');
const openAIRoute = require('./routes/openAIRoute');
const SeoTasksRoute = require('./routes/seoTasksRoute');
const classifiedPagesRoute = require('./routes/classifiedPagesRoute');
const seoReportRoute = require('./routes/seoReportRoute');
const blogIdeasRoute = require('./routes/seo/blogIdeasRoute'); 

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
