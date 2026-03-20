import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const NAROU_API = 'https://api.syosetu.com/novelapi/api/';
const NAROU_RANK_API = 'https://api.syosetu.com/rank/rankget/';
const NAROU_CONTENT = 'https://ncode.syosetu.com';

// 模拟真实浏览器请求头，绕过 syosetu 的 IP 封锁
// syosetu 根据 X-Forwarded-For 判断地区，伪造日本 IP 可绕过封锁
const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'same-origin',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'Cookie': 'over18=yes',
  // 伪造日本 IP，绕过 syosetu 的地区封锁
  'X-Forwarded-For': '126.0.0.1',
  'X-Real-IP': '126.0.0.1',
};

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

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
    const apiRes = await axios.get(NAROU_API, { params, headers: { 'User-Agent': UA } });
    const [meta, ...items] = apiRes.data || [{ allcount: 0 }];
    const novels = items.map(formatNovel);
    res.json({ novels, total: meta.allcount || 0, hasMore: st + lim - 1 < (meta.allcount || 0) });
  } catch (err) {
    console.error('search error:', err.message);
    res.status(500).json({ error: 'Failed to search novels' });
  }
});

// GET /api/novel/:ncode - novel metadata
// 调试端点：检查 Vercel 函数的出口 IP
app.get('/api/debug', async (req, res) => {
  try {
    const r = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
    const ip = r.data.ip;
    // 测试 syosetu 是否可访问
    let syosetuStatus = 'unknown';
    try {
      const sr = await axios.get('https://ncode.syosetu.com/n6764lx/1/', {
        headers: BROWSER_HEADERS,
        timeout: 8000,
        maxRedirects: 5,
      });
      syosetuStatus = `${sr.status} (${sr.data.length} bytes)`;
    } catch (e) {
      syosetuStatus = `${e.response?.status || 'error'}: ${e.message}`;
    }
    res.json({ vercelIP: ip, syosetuStatus });
  } catch (e) {
    res.json({ error: e.message });
  }
});

app.get('/api/novel/:ncode', async (req, res) => {
  try {
    const ncode = req.params.ncode.toLowerCase();
    const apiRes = await axios.get(NAROU_API, {
      params: { of: API_FIELDS, out: 'json', ncode },
      headers: { 'User-Agent': UA },
    });
    const items = (apiRes.data || []).slice(1);
    if (!items.length) return res.status(404).json({ error: 'Novel not found' });
    res.json(formatNovel(items[0]));
  } catch (err) {
    console.error('novel error:', err.message);
    res.status(500).json({ error: 'Failed to fetch novel' });
  }
});

// GET /api/novel/:ncode/chapters
// 优先使用 Narou 官方 API 生成章节列表（不被封锁），再用 HTML 抓取补充日期
app.get('/api/novel/:ncode/chapters', async (req, res) => {
  try {
    const ncode = req.params.ncode.toLowerCase();

    // Step 1: 通过官方 API 获取章节总数
    const metaRes = await axios.get(NAROU_API, {
      params: { of: 't-n-ga-gl-end', out: 'json', ncode },
      headers: { 'User-Agent': UA },
    });
    const items = (metaRes.data || []).slice(1);

    if (!items.length) {
      return res.status(404).json({ error: 'Novel not found' });
    }

    const meta = items[0];
    const totalChapters = meta.general_all_no || 0;
    const title = meta.title || '';

    // 短篇小说（general_all_no === 0）
    if (totalChapters === 0) {
      return res.json([{ id: `${ncode}-0`, title, number: 0, content: '', publishDate: meta.general_lastup || '' }]);
    }

    // Step 2: 生成章节列表（编号 1 到 totalChapters）
    // 尝试从 HTML 抓取章节标题和日期（如果失败则用编号代替）
    let chapters = [];
    try {
      const url = `${NAROU_CONTENT}/${ncode}/`;
      const htmlRes = await axios.get(url, {
        headers: BROWSER_HEADERS,
        timeout: 8000,
      });
      const $ = cheerio.load(htmlRes.data);
      $('.p-eplist__sublist').each((_, el) => {
        const link = $(el).find('a.p-eplist__subtitle').first();
        const href = link.attr('href') || '';
        const match = href.match(/\/(\d+)\/?$/);
        if (!match) return;
        const chNum = parseInt(match[1]);
        const rawTitle = link.text().trim();
        // 如果标题只是数字（syosetu 新版 UI），用 "第N话" 格式
        const chTitle = rawTitle && !/^\d+$/.test(rawTitle) ? rawTitle : `第${chNum}話`;
        const dateText = $(el).find('.p-eplist__update').first().text()
          .replace(/（改）[\s\S]*/, '').replace(/\s+/g, ' ').trim();
        chapters.push({ id: `${ncode}-${chNum}`, title: chTitle, number: chNum, content: '', publishDate: dateText });
      });

      // 处理分页（超过 100 话时）
      const totalPages = parseInt($('.c-pager__item--last').attr('href')?.match(/p=(\d+)/)?.[1] || '1');
      if (totalPages > 1) {
        const pagePromises = [];
        for (let p = 2; p <= Math.min(totalPages, 10); p++) {
          pagePromises.push(axios.get(`${url}?p=${p}`, { headers: BROWSER_HEADERS, timeout: 8000 }));
        }
        const pageResults = await Promise.allSettled(pagePromises);
        for (const pr of pageResults) {
          if (pr.status === 'fulfilled') {
            const $p = cheerio.load(pr.value.data);
            $p('.p-eplist__sublist').each((_, el) => {
              const link = $p(el).find('a.p-eplist__subtitle').first();
              const href = link.attr('href') || '';
              const match = href.match(/\/(\d+)\/?$/);
              if (!match) return;
              const chNum = parseInt(match[1]);
              const rawTitle = link.text().trim();
              const chTitle = rawTitle && !/^\d+$/.test(rawTitle) ? rawTitle : `第${chNum}話`;
              const dateText = $p(el).find('.p-eplist__update').first().text()
                .replace(/（改）[\s\S]*/, '').replace(/\s+/g, ' ').trim();
              chapters.push({ id: `${ncode}-${chNum}`, title: chTitle, number: chNum, content: '', publishDate: dateText });
            });
          }
        }
      }
    } catch (scrapeErr) {
      console.warn('HTML scrape failed, falling back to API-generated list:', scrapeErr.message);
    }

    // Step 3: 如果 HTML 抓取失败或章节数不匹配，用 API 数据生成
    if (chapters.length === 0) {
      for (let i = 1; i <= totalChapters; i++) {
        chapters.push({ id: `${ncode}-${i}`, title: `第${i}話`, number: i, content: '', publishDate: '' });
      }
    }

    chapters.sort((a, b) => a.number - b.number);
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

    // 使用完整浏览器请求头，加上正确的 Referer
    const headers = {
      ...BROWSER_HEADERS,
      'Referer': num === 0
        ? 'https://syosetu.com/'
        : `${NAROU_CONTENT}/${ncode}/`,
    };

    const htmlRes = await axios.get(url, { headers, timeout: 10000 });
    const $ = cheerio.load(htmlRes.data);

    // 检测是否被重定向到错误页
    if (htmlRes.status !== 200) {
      return res.status(502).json({ error: `Upstream ${htmlRes.status}` });
    }

    // New Narou UI uses .p-novel__title, old uses .novel_subtitle
    const rawTitle = $('.p-novel__title').first().text().trim()
      || $('.novel_subtitle').text().trim();
    // 如果标题只是数字，用 "第N话" 格式
    const title = rawTitle && !/^\d+$/.test(rawTitle) ? rawTitle : `第${num}話`;

    // Extract body text — new UI: .js-novel-text p, old UI: #novel_honbun p
    const bodySelector = $('.js-novel-text').length ? '.js-novel-text p' : '#novel_honbun p';
    const lines = [];
    $(bodySelector).each((_, el) => {
      // Remove ruby readings (furigana), get plain text
      $(el).find('rt, rp').remove();
      const text = $(el).text().trim();
      if (text) lines.push(text);
    });

    // Fallback if still empty
    if (!lines.length) {
      $('.p-novel__body p, #novel_honbun p').each((_, el) => {
        $(el).find('rt, rp').remove();
        const text = $(el).text().trim();
        if (text) lines.push(text);
      });
    }

    const content = lines.join('\n\n');

    // Get publish date from meta tag
    const dateText = $('meta[property="article:published_time"]').attr('content')?.split('T')[0] || '';

    res.json({
      id: `${ncode}-${num}`,
      title,
      number: num,
      content: content.trim(),
      publishDate: dateText,
    });
  } catch (err) {
    console.error('chapter content error:', err.message);
    // 如果是 403，返回更友好的错误
    if (err.response?.status === 403) {
      return res.status(503).json({ error: 'Content temporarily unavailable (upstream blocked). Please try again later.' });
    }
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
