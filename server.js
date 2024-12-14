const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// File paths
const viewsFile = path.join(__dirname, 'data', 'views.json');
const trendingFile = path.join(__dirname, 'data', 'trending.json');

// Utility function to read/write JSON files
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// Route: Increment views for a post
app.post('/api/views', (req, res) => {
  const { slug } = req.body;

  if (!slug) {
    return res.status(400).json({ error: 'Post slug is required' });
  }

  const views = readJSON(viewsFile);

  // Increment view count
  if (!views[slug]) {
    views[slug] = { views_all_time: 0, views_last_week: 0 };
  }

  views[slug].views_all_time += 1;
  views[slug].views_last_week += 1;

  writeJSON(viewsFile, views);

  res.json({ message: 'View count updated', views: views[slug] });
});

// Route: Get trending posts
app.get('/api/trending', (req, res) => {
  const trending = readJSON(trendingFile);
  res.json(trending);
});

// Cron-like route: Update trending posts (run this manually for now)
app.post('/api/update-trending', (req, res) => {
  const views = readJSON(viewsFile);

  // Get the top 5 posts with the highest weekly views
  const trending = Object.entries(views)
    .sort(([, a], [, b]) => b.views_last_week - a.views_last_week)
    .slice(0, 5)
    .map(([slug]) => slug);

  writeJSON(trendingFile, { trending });

  // Reset weekly view counts
  Object.values(views).forEach((post) => (post.views_last_week = 0));
  writeJSON(viewsFile, views);

  res.json({ message: 'Trending posts updated', trending });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
