import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';
import { HttpsProxyAgent } from 'https-proxy-agent';

const app = express();
app.use(cors());
app.use(express.json());

const NAROU_API = 'https://api.syosetu.com/novelapi/api/';
const NAROU_RANK_API = 'https://api.syosetu.com/rank/rankget/';
const NAROU_CONTENT = 'https://ncode.syosetu.com';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

// Use system HTTPS proxy if available (required in sandboxed environments)
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
const httpsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
const PROXY_CONFIG = httpsAgent ? { httpsAgent, proxy: false } : {};

// Narou API fields: t=title w=writer s=story n=ncode gl=general_lastup end=end ga=general_all_no gp=global_point ah=all_hyoka_cnt
const API_FIELDS = 't-w-s-n-gl-end-ga-gp-ah';

function formatNovel(n) {
  const globalPoint = n.global_point || 0;
  const allHyoka = n.all_hyoka_cnt || 0;
  const rating = allHyoka > 0 ? Math.round(globalPoint / allHyoka * 10) / 10 : 0;
  const ncode = (n.ncode || '').toLowerCase();
  return {
    id: ncode,
    title: n.title || '',
    author: n.writer || '',
    description: n.story || '',
    cover: `https://placehold.co/300x400/1a1a2e/ffffff?text=${encodeURIComponent((n.title || '').slice(0, 8))}`,
    status: n.end === 1 ? 'completed' : 'ongoing',
    views: globalPoint,
    rating,
    lastUpdate: (n.general_lastup || '').split(' ')[0] || '',
    chapterCount: n.general_all_no || 0,
  };
}

async function fetchNovelsByNcodes(ncodes) {
  const res = await axios.get(NAROU_API, {
    params: { of: API_FIELDS, out: 'json', ncode: ncodes.join('-'), lim: ncodes.length },
    headers: { 'User-Agent': UA },
    ...PROXY_CONFIG,
  });
  return (res.data || []).slice(1).map(formatNovel);
}

// GET /api/popular - daily ranking from Narou
app.get('/api/popular', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const rtype = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-d`;
    const rankRes = await axios.get(NAROU_RANK_API, {
      params: { rtype, out: 'json' },
      headers: { 'User-Agent': UA },
      ...PROXY_CONFIG,
    });
    const ncodes = (rankRes.data || []).slice(0, limit).map(r => r.ncode).filter(Boolean);
    if (!ncodes.length) return res.json([]);
    const novels = await fetchNovelsByNcodes(ncodes);
    res.json(novels);
  } catch (err) {
    console.error('popular error:', err.message);
    res.status(500).json({ error: 'Failed to fetch popular novels' });
  }
});

// GET /api/latest - newest updated novels
app.get('/api/latest', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 30);
    const apiRes = await axios.get(NAROU_API, {
      params: { of: API_FIELDS, out: 'json', order: 'new', lim: limit },
      headers: { 'User-Agent': UA },
      ...PROXY_CONFIG,
    });
    const novels = (apiRes.data || []).slice(1).map(formatNovel);
    res.json(novels);
  } catch (err) {
    console.error('latest error:', err.message);
    res.status(500).json({ error: 'Failed to fetch latest novels' });
  }
});

// GET /api/search?q=...&page=1&limit=10
app.get('/api/search', async (req, res) => {
  try {
    const { q = '', page = 1, limit = 10 } = req.query;
    const lim = Math.min(parseInt(limit), 30);
    const st = (parseInt(page) - 1) * lim + 1;
    const params = { of: API_FIELDS, out: 'json', order: 'hyoka', lim, st };
    if (q.trim()) params.word = q.trim();
    const apiRes = await axios.get(NAROU_API, { params, headers: { 'User-Agent': UA }, ...PROXY_CONFIG });
    const [meta, ...items] = apiRes.data || [{ allcount: 0 }];
    const novels = items.map(formatNovel);
    res.json({ novels, total: meta.allcount || 0, hasMore: st + lim - 1 < (meta.allcount || 0) });
  } catch (err) {
    console.error('search error:', err.message);
    res.status(500).json({ error: 'Failed to search novels' });
  }
});

// GET /api/novel/:ncode - novel metadata
app.get('/api/novel/:ncode', async (req, res) => {
  try {
    const ncode = req.params.ncode.toLowerCase();
    const apiRes = await axios.get(NAROU_API, {
      params: { of: API_FIELDS, out: 'json', ncode },
      headers: { 'User-Agent': UA },
      ...PROXY_CONFIG,
    });
    const items = (apiRes.data || []).slice(1);
    if (!items.length) return res.status(404).json({ error: 'Novel not found' });
    res.json(formatNovel(items[0]));
  } catch (err) {
    console.error('novel error:', err.message);
    res.status(500).json({ error: 'Failed to fetch novel' });
  }
});

function parseTocHtml(html, ncode) {
  const $ = cheerio.load(html);
  const chapters = [];
  $('.p-eplist__sublist').each((_, el) => {
    const link = $(el).find('a.p-eplist__subtitle').first();
    const href = link.attr('href') || '';
    const match = href.match(/\/(\d+)\/?$/);
    if (!match) return;
    const chNum = parseInt(match[1]);
    const dateText = $(el).find('.p-eplist__update').first().text()
      .replace(/（改）[\s\S]*/, '').replace(/\s+/g, ' ').trim();
    chapters.push({ id: `${ncode}-${chNum}`, title: link.text().trim(), number: chNum, content: '', publishDate: dateText });
  });
  // Detect if there are more pages (Narou paginates at 100 episodes)
  const totalPages = parseInt($('.c-pager__item--last').attr('href')?.match(/p=(\d+)/)?.[1] || '1');
  return { chapters, totalPages };
}

// GET /api/novel/:ncode/chapters - scrape TOC from syosetu (all pages)
app.get('/api/novel/:ncode/chapters', async (req, res) => {
  try {
    const ncode = req.params.ncode.toLowerCase();
    const url = `${NAROU_CONTENT}/${ncode}/`;
    const htmlRes = await axios.get(url, { headers: { 'User-Agent': UA }, ...PROXY_CONFIG });
    const { chapters, totalPages } = parseTocHtml(htmlRes.data, ncode);

    // Fetch additional pages if any (Narou paginates at 100 episodes per page)
    if (totalPages > 1) {
      const pagePromises = [];
      for (let p = 2; p <= Math.min(totalPages, 10); p++) {
        pagePromises.push(axios.get(`${url}?p=${p}`, { headers: { 'User-Agent': UA }, ...PROXY_CONFIG }));
      }
      const pageResults = await Promise.all(pagePromises);
      for (const pr of pageResults) {
        const { chapters: more } = parseTocHtml(pr.data, ncode);
        chapters.push(...more);
      }
    }

    chapters.sort((a, b) => a.number - b.number);

    // If no episode links found, this is likely a tanpen (short story) — serve it as a single chapter
    if (!chapters.length) {
      const $ = cheerio.load(htmlRes.data);
      const title = $('h1').first().text().trim() || '本文';
      chapters.push({ id: `${ncode}-0`, title, number: 0, content: '', publishDate: '' });
    }

    res.json(chapters);
  } catch (err) {
    console.error('chapters error:', err.message);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// GET /api/novel/:ncode/chapter/:num - scrape chapter content
app.get('/api/novel/:ncode/chapter/:num', async (req, res) => {
  try {
    const ncode = req.params.ncode.toLowerCase();
    const num = parseInt(req.params.num);
    if (isNaN(num) || num < 0) return res.status(400).json({ error: 'Invalid chapter number' });

    // num=0 is used for tanpen (short story at root URL)
    const url = num === 0
      ? `${NAROU_CONTENT}/${ncode}/`
      : `${NAROU_CONTENT}/${ncode}/${num}/`;
    const htmlRes = await axios.get(url, { headers: { 'User-Agent': UA }, ...PROXY_CONFIG });
    const $ = cheerio.load(htmlRes.data);

    // New Narou UI uses .p-novel__title, old uses .novel_subtitle
    const title = $('.p-novel__title').first().text().trim()
      || $('.novel_subtitle').text().trim();

    // Extract body text — new UI: .js-novel-text p, old UI: #novel_honbun p
    const bodySelector = $('.js-novel-text').length ? '.js-novel-text p' : '#novel_honbun p';
    const lines = [];
    $(bodySelector).each((_, el) => {
      // Preserve ruby readings inline, get plain text
      const text = $(el).text();
      lines.push(text);
    });

    // Fallback if still empty
    if (!lines.length) {
      $('.p-novel__body p, #novel_honbun p').each((_, el) => {
        lines.push($(el).text());
      });
    }

    const content = lines.join('\n\n');

    // Get publish date
    const dateText = $('.p-eplist__update').first().text().replace(/（改）[\s\S]*/, '').trim()
      || $('meta[property="article:published_time"]').attr('content') || '';

    res.json({
      id: `${ncode}-${num}`,
      title: title || `第${num}話`,
      number: num,
      content: content.trim(),
      publishDate: dateText,
    });
  } catch (err) {
    console.error('chapter content error:', err.message);
    res.status(500).json({ error: 'Failed to fetch chapter content' });
  }
});

// Vercel serverless: export app instead of listening
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Novel Spider server running at http://localhost:${PORT}`);
  });
}

export default app;
