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

function stripHtml(html) {
  return decodeEntities(
    html
      .replace(/<rt>[^<]*<\/rt>/gi, '')  // remove furigana readings
      .replace(/<rp>[^<]*<\/rp>/gi, '')  // remove ruby parentheses
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  ).trim();
}

// Extract all <p> text from a chunk of HTML
function extractParagraphs(html) {
  const results = [];
  const re = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const text = stripHtml(m[1]);
    if (text) results.push(text);
  }
  return results;
}

// Find the content section by class name (handle multiple classes)
function getSectionByClass(html, className) {
  const startRe = new RegExp(`<div[^>]+class="[^"]*${className}[^"]*"[^>]*>`, 'i');
  const startM = startRe.exec(html);
  if (!startM) return null;
  let depth = 1;
  let i = startM.index + startM[0].length;
  while (i < html.length && depth > 0) {
    const open = html.indexOf('<div', i);
    const close = html.indexOf('</div>', i);
    if (close === -1) break;
    if (open !== -1 && open < close) { depth++; i = open + 4; }
    else { depth--; if (depth > 0) i = close + 6; else return html.slice(startM.index + startM[0].length, close); }
  }
  return null;
}

export default async function handler(req) {
  const url = new URL(req.url);
  const parts = url.pathname.split('/').filter(Boolean);
  // expected: ['api', 'novel', ncode, 'chapter', num]
  const ncode = (parts[2] || '').toLowerCase();
  const num = parseInt(parts[4] ?? '0');
  if (!ncode || isNaN(num) || num < 0) {
    return Response.json({ error: 'Invalid params' }, { status: 400 });
  }

  try {
    const chapterUrl = num === 0
      ? `https://ncode.syosetu.com/${ncode}/`
      : `https://ncode.syosetu.com/${ncode}/${num}/`;

    const r = await fetch(chapterUrl, { headers: HEADERS });
    if (!r.ok) return Response.json({ error: `Upstream ${r.status}` }, { status: 502 });
    const html = await r.text();

    // Title: new UI = h1.p-novel__title, old UI = p.novel_subtitle
    let title = '';
    const titleM =
      html.match(/<h1[^>]+class="[^"]*p-novel__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
      html.match(/<p[^>]+class="[^"]*novel_subtitle[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    if (titleM) title = stripHtml(titleM[1]);

    // Content: try js-novel-text → p-novel__body → #novel_honbun
    let lines = [];
    const novelTextSection = getSectionByClass(html, 'js-novel-text');
    if (novelTextSection) {
      lines = extractParagraphs(novelTextSection);
    } else {
      // Fallback: find paragraphs after the honbun marker
      const honbunM = html.match(/id="novel_honbun"[^>]*>([\s\S]*?)<\/div>/i) ||
                      html.match(/class="[^"]*p-novel__body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (honbunM) lines = extractParagraphs(honbunM[1]);
    }

    // Last fallback: extract ALL paragraph content from the body
    if (!lines.length) {
      const bodyM = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyM) lines = extractParagraphs(bodyM[1]).slice(0, 500);
    }

    const content = lines.join('\n\n').trim();

    return Response.json({
      id: `${ncode}-${num}`,
      title: title || `第${num}話`,
      number: num,
      content,
      publishDate: '',
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('chapter edge error:', err.message);
    return Response.json({ error: 'Failed to fetch chapter content' }, { status: 500 });
  }
}
