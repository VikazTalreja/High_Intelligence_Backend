const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.send('LinkedIn Scraper API is running');
});

// Import LinkedIn routes
const linkedInRoutes = require('./routes/linkedin');
app.use('/api/scrape', linkedInRoutes);

// Import keyword-based scraping routes
const keywordScraperRoutes = require('./routes/keywordScraper');
app.use('/api/keyword', keywordScraperRoutes);

// Import Firecrawl scraper routes
const firecrawlRoutes = require('./routes/firecrawl');
app.use('/api/firecrawl', firecrawlRoutes);

// Import VPScrapper routes for procurement executives
const vpScrapperRoutes = require('./routes/VPScrapper');
app.use('/api/vp', vpScrapperRoutes);

// Import GemDeep routes for multi-model data processing
const gemDeepRoutes = require('./routes/gemdeep');
app.use('/api/gemdeep', gemDeepRoutes);

// Import Analysis routes for comprehensive data analysis
const analysisRoutes = require('./routes/analysis');
app.use('/api/analysis', analysisRoutes);

// Import DeepSeek routes
const deepseekRouter = require('./routes/deepseek');
app.use('/api/deepseek', deepseekRouter);

// Import Other Competitor routes
const otherCompetitorRouter = require('./routes/othercompetitor');
app.use('/api/othercompetitor', otherCompetitorRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 