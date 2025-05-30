
import express from 'express';
import puppeteer from 'puppeteer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/audit', async (req, res) => {
  const { storeUrl } = req.body;

  if (!storeUrl) {
    return res.status(400).json({ error: 'Missing storeUrl' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(storeUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    const hasSearch = await page.$('input[type="search"], .search, [aria-label*="search" i]') !== null;
    const hasHero = await page.$('section.hero, .hero-banner, .slideshow, .main-banner') !== null;

    await browser.close();

    res.json({
      url: storeUrl,
      audit: [
        {
          item: 'Search bar visible',
          status: hasSearch ? 'PASS' : 'FAIL',
          recommendation: hasSearch ? null : 'Add a visible search bar in the header.'
        },
        {
          item: 'Hero section present',
          status: hasHero ? 'PASS' : 'FAIL',
          recommendation: hasHero ? null : 'Add a hero/banner section to guide users.'
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Audit failed', details: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log('✅ Audit API running on port 3000');
});
