import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const NAROU_API = 'https://api.syosetu.com/novelapi/api/';
const NAROU_CONTENT = 'https://ncode.syosetu.com';

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
  'Referer': 'https://syosetu.com/',
  'Cookie': 'over18=yes',
};

// 辅助函数：通过代理获取内容
async function fetchWithProxy(targetUrl) {
  try {
    const res = await axios.get(targetUrl, {
      headers: BROWSER_HEADERS,
      timeout: 8000,
    });
    return res.data;
  } catch (err) {
    console.log(`Direct fetch failed (${err.response?.status || err.code}), trying Google Translate proxy...`);
    // 构造 Google Translate 代理 URL
    const urlObj = new URL(targetUrl);
    const proxyDomain = urlObj.hostname.replace(/\./g, '-') + '.translate.goog';
    const proxyUrl = `https://${proxyDomain}${urlObj.pathname}${urlObj.search}${urlObj.search ? '&' : '?'}_x_tr_sl=ja&_x_tr_tl=en`;
    
    const proxyRes = await axios.get(proxyUrl, { timeout: 15000 });
    return proxyRes.data;
  }
}

// 搜索小说
app.get('/api/search', async (req, res) => {
  try {
    const { word, st, order } = req.query;
    const response = await axios.get(NAROU_API, {
      params: {
        out: 'json',
        word,
        st: st || 1,
        order: order || 'hyoka',
        lim: 20,
        gzip: 5,
      },
    });
    
    const novels = response.data.slice(1).map(novel => ({
      id: novel.ncode.toLowerCase(),
      title: novel.title,
      author: novel.writer,
      description: novel.story,
      status: novel.end === 0 ? 'ongoing' : 'completed',
      views: novel.all_hyoka_cnt,
      rating: novel.all_point,
      lastUpdate: novel.general_lastup,
      chapterCount: novel.general_all_no,
    }));

    res.json({
      novels,
      total: response.data[0].allcount,
      hasMore: novels.length === 20,
    });
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ error: 'Search failed' });
  }
});

// 获取热门小说
app.get('/api/popular', async (req, res) => {
  try {
    const response = await axios.get(NAROU_API, {
      params: {
        out: 'json',
        order: 'weekly',
        lim: 10,
      },
    });
    
    const novels = response.data.slice(1).map(novel => ({
      id: novel.ncode.toLowerCase(),
      title: novel.title,
      author: novel.writer,
      description: novel.story,
      status: novel.end === 0 ? 'ongoing' : 'completed',
      views: novel.all_hyoka_cnt,
      rating: novel.all_point,
      lastUpdate: novel.general_lastup,
      chapterCount: novel.general_all_no,
    }));

    res.json(novels);
  } catch (error) {
    console.error('Popular error:', error.message);
    res.status(500).json({ error: 'Failed to fetch popular novels' });
  }
});

// 获取最新更新
app.get('/api/latest', async (req, res) => {
  try {
    const response = await axios.get(NAROU_API, {
      params: {
        out: 'json',
        order: 'new',
        lim: 10,
      },
    });
    
    const novels = response.data.slice(1).map(novel => ({
      id: novel.ncode.toLowerCase(),
      title: novel.title,
      author: novel.writer,
      description: novel.story,
      status: novel.end === 0 ? 'ongoing' : 'completed',
      views: novel.all_hyoka_cnt,
      rating: novel.all_point,
      lastUpdate: novel.general_lastup,
      chapterCount: novel.general_all_no,
    }));

    res.json(novels);
  } catch (error) {
    console.error('Latest error:', error.message);
    res.status(500).json({ error: 'Failed to fetch latest novels' });
  }
});

// 获取小说详情和章节列表
app.get('/api/novel/:ncode/chapters', async (req, res) => {
  try {
    const ncode = req.params.ncode.toLowerCase();
    
    // Step 1: 获取小说元数据
    const metaRes = await axios.get(NAROU_API, {
      params: { out: 'json', ncode, lim: 1 }
    });
    
    if (metaRes.data[0].allcount === 0) {
      return res.status(404).json({ error: 'Novel not found' });
    }
    
    const meta = metaRes.data[1];
    const totalChapters = meta.general_all_no;
    const title = meta.title;

    // 短篇小说处理
    if (totalChapters === 0) {
      return res.json([{ id: `${ncode}-0`, title, number: 0, content: '', publishDate: meta.general_lastup || '' }]);
    }

    // Step 2: 获取章节列表
    const url = `${NAROU_CONTENT}/${ncode}/`;
    const htmlData = await fetchWithProxy(url);
    const $ = cheerio.load(htmlData);
    
    let chapters = [];
    $('.p-eplist__sublist').each((_, el) => {
      const link = $(el).find('a.p-eplist__subtitle').first();
      const href = link.attr('href') || '';
      const match = href.match(/\/(\d+)\/?$/);
      
      if (match) {
        const num = parseInt(match[1]);
        const chapterTitle = link.text().trim();
        const date = $(el).find('.p-eplist__update').text().trim();
        
        chapters.push({
          id: `${ncode}-${num}`,
          title: chapterTitle,
          number: num,
          content: '',
          publishDate: date,
        });
      }
    });

    // 如果章节很多（分页情况）
    const lastPageMatch = $('.c-pager__item--last').attr('href');
    if (lastPageMatch) {
      const totalPagesMatch = lastPageMatch.match(/[?&]p=(\d+)/);
      if (totalPagesMatch) {
        const totalPages = Math.min(parseInt(totalPagesMatch[1]), 10); // 限制抓取前10页
        for (let p = 2; p <= totalPages; p++) {
          const pageUrl = `${url}?p=${p}`;
          const pageData = await fetchWithProxy(pageUrl);
          const $p = cheerio.load(pageData);
          $p('.p-eplist__sublist').each((_, el) => {
            const link = $p(el).find('a.p-eplist__subtitle').first();
            const href = link.attr('href') || '';
            const match = href.match(/\/(\d+)\/?$/);
            if (match) {
              const num = parseInt(match[1]);
              chapters.push({
                id: `${ncode}-${num}`,
                title: link.text().trim(),
                number: num,
                content: '',
                publishDate: $p(el).find('.p-eplist__update').text().trim(),
              });
            }
          });
        }
      }
    }

    // 如果没抓到（可能是老版UI或短篇）
    if (chapters.length === 0) {
      for (let i = 1; i <= totalChapters; i++) {
        chapters.push({
          id: `${ncode}-${i}`,
          title: `第 ${i} 部分`,
          number: i,
          content: '',
          publishDate: '',
        });
      }
    }

    res.json(chapters.sort((a, b) => a.number - b.number));
  } catch (error) {
    console.error('Chapters error:', error.message);
    res.status(500).json({ error: 'Failed to fetch chapters' });
  }
});

// 获取小说详情
app.get('/api/novel/:ncode', async (req, res) => {
  try {
    const ncode = req.params.ncode.toLowerCase();
    const response = await axios.get(NAROU_API, {
      params: { out: 'json', ncode, lim: 1 },
    });
    
    if (response.data[0].allcount === 0) {
      return res.status(404).json({ error: 'Novel not found' });
    }

    const novel = response.data[1];
    res.json({
      id: novel.ncode.toLowerCase(),
      title: novel.title,
      author: novel.writer,
      description: novel.story,
      status: novel.end === 0 ? 'ongoing' : 'completed',
      views: novel.all_hyoka_cnt,
      rating: novel.all_point,
      lastUpdate: novel.general_lastup,
      chapterCount: novel.general_all_no,
    });
  } catch (error) {
    console.error('Novel detail error:', error.message);
    res.status(500).json({ error: 'Failed to fetch novel detail' });
  }
});

// 获取章节内容
app.get('/api/novel/:ncode/chapter/:num', async (req, res) => {
  try {
    const { ncode, num } = req.params;
    const targetUrl = num === '0' 
      ? `${NAROU_CONTENT}/${ncode}/`
      : `${NAROU_CONTENT}/${ncode}/${num}/`;

    const htmlData = await fetchWithProxy(targetUrl);
    const $ = cheerio.load(htmlData);

    // 获取标题
    const title = $('.p-novel__title').text().trim() || $('.novel_subtitle').text().trim() || `第 ${num} 部分`;
    
    // 获取正文内容
    const bodySelector = $('.js-novel-text').length ? '.js-novel-text p' : '#novel_honbun p';
    const lines = [];
    $(bodySelector).each((_, el) => {
      $(el).find('rt, rp').remove();
      const text = $(el).text().trim();
      if (text) lines.push(text);
    });

    if (lines.length === 0) {
      // 备选方案：尝试抓取所有 div.p-novel__text
      $('.p-novel__text p').each((_, el) => {
        $(el).find('rt, rp').remove();
        const text = $(el).text().trim();
        if (text) lines.push(text);
      });
    }

    res.json({
      id: `${ncode}-${num}`,
      title,
      number: parseInt(num),
      content: lines.join('\n\n'),
      publishDate: '',
    });
  } catch (error) {
    console.error('Chapter content error:', error.message);
    res.status(500).json({ error: 'Failed to fetch chapter content' });
  }
});

// Debug 接口
app.get('/api/debug', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Vercel 兼容性处理
app.get('/api/index', (req, res) => {
  res.json({ message: 'API is running' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
