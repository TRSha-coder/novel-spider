export const config = { runtime: 'edge' };

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
  'Referer': 'https://syosetu.com/',
  'Cookie': 'over18=yes',
};

function decodeEntities(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function stripTags(html) {
  return decodeEntities(
    html.replace(/<rt>[^<]*<\/rt>/gi, '').replace(/<rp>[^<]*<\/rp>/gi, '').replace(/<[^>]+>/g, '')
  ).trim();
}

function parseToc(html, ncode) {
  const chapters = [];
  // Match all <a> tags that have p-eplist__subtitle in their class
  const tagRe = /<a\s([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const attrs = m[1];
    if (!attrs.includes('p-eplist__subtitle')) continue;
    const hrefMatch = attrs.match(/href="\/[^/]+\/(\d+)\/"/);
    if (!hrefMatch) continue;
    const chNum = parseInt(hrefMatch[1]);
    const title = stripTags(m[2]);
    chapters.push({ id: `${ncode}-${chNum}`, title, number: chNum, content: '', publishDate: '' });
  }
  return chapters;
}

function detectTotalPages(html) {
  // Look for last-page link in pagination
  const m = html.match(/c-pager__item--last[^>]*href="[^"]*[?&]p=(\d+)"/);
  if (m) return parseInt(m[1]);
  // Alt: look for href="?p=N" patterns and take the max
  const pageNums = [...html.matchAll(/href="\?p=(\d+)"/g)].map(x => parseInt(x[1]));
  return pageNums.length ? Math.max(...pageNums) : 1;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // expected: ['api', 'novel', ncode, 'chapters']
  const ncode = (parts[2] || '').toLowerCase();
  if (!ncode) return Response.json({ error: 'Missing ncode' }, { status: 400 });

  try {
    const tocUrl = `https://ncode.syosetu.com/${ncode}/`;
    const r = await fetch(tocUrl, { headers: HEADERS });
    if (!r.ok) return Response.json({ error: `Upstream ${r.status}` }, { status: 502 });
    const html = await r.text();

    let chapters = parseToc(html, ncode);

    // Fetch additional pages if paginated (Narou: 100 ep/page)
    const totalPages = detectTotalPages(html);
    if (totalPages > 1) {
      const extra = await Promise.all(
        Array.from({ length: Math.min(totalPages, 10) - 1 }, (_, i) =>
          fetch(`${tocUrl}?p=${i + 2}`, { headers: HEADERS }).then(x => x.text())
        )
      );
      for (const pageHtml of extra) chapters.push(...parseToc(pageHtml, ncode));
    }

    chapters.sort((a, b) => a.number - b.number);

    // Tanpen fallback: no episode list → single chapter at num=0
    if (!chapters.length) {
      const titleM = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      const title = titleM ? stripTags(titleM[1]) : '本文';
      chapters.push({ id: `${ncode}-0`, title, number: 0, content: '', publishDate: '' });
    }

    return Response.json(chapters, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('chapters edge error:', err.message);
    return Response.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}
