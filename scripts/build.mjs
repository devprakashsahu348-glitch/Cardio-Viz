import fs from 'fs'; import path from 'path';
const E = process.env, P = 'public', O = 'dist';
const site = (E.SITE_URL || (E.VERCEL_PROJECT_PRODUCTION_URL ? 'https://' + E.VERCEL_PROJECT_PRODUCTION_URL : 'http://localhost:3000')).replace(/\/$/, '');
const d = new Date();
const V = { SITE: site, EMAIL: 'devprakashsahu348@gmail.com', OWNER: 'Dev Prakash Sahu', GA: E.GA_ID || '',
  WA: (E.WHATSAPP_NUMBER || '').replace(/\D/g, ''), DEMO: E.DEMO_URL || '/app/',
  DATE: d.toISOString().slice(0, 10), LONGDATE: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }), YEAR: d.getFullYear(), BUILD: String(Date.now()) };
const fill = s => s.replace(/%([A-Z]+)%/g, (m, k) => (k in V ? V[k] : m));
fs.rmSync(O, { recursive: true, force: true });
const copy = (a, b) => { fs.mkdirSync(b, { recursive: true });
  for (const f of fs.readdirSync(a)) { const s = path.join(a, f), t = path.join(b, f);
    if (fs.statSync(s).isDirectory()) copy(s, t);
    else if (/\.html$/.test(f) && a === P) continue;
    else if (/\.(txt|xml|css|js|svg|html)$/.test(f)) fs.writeFileSync(t, fill(fs.readFileSync(s, 'utf8')));
    else fs.copyFileSync(s, t); } };
copy(P, O);
const layout = fs.readFileSync('scripts/layout.html', 'utf8');
const pages = [];
for (const f of fs.readdirSync(P).filter(x => x.endsWith('.html'))) {
  const raw = fs.readFileSync(path.join(P, f), 'utf8');
  const m = k => (raw.match(new RegExp('<!--' + k + ':(.*?)-->', 's')) || [, ''])[1].trim();
  const slug = f === 'index.html' ? '' : f.replace('.html', '');
  const robots = ['404', 'login', 'signup', 'forgot', 'reset', 'dashboard', 'admin'].includes(slug) ? 'noindex' : 'index,follow';
  const crumb = slug && slug !== '404' ? `<nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <span aria-current="page">${m('crumb')}</span></nav>` : '';
  const body = raw.replace(/<!--[a-z]+:.*?-->/gs, '');
  const out = fill(layout.replace('{{content}}', () => crumb + body).replace(/{{title}}/g, m('title')).replace(/{{desc}}/g, m('desc'))
    .replace(/{{path}}/g, '/' + slug).replace(/{{robots}}/g, robots));
  fs.writeFileSync(path.join(O, f), out);
  if (robots !== 'noindex') pages.push(slug);
}
fs.writeFileSync(path.join(O, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  pages.map(s => `  <url><loc>${site}/${s}</loc><lastmod>${V.DATE}</lastmod></url>`).join('\n') + '\n</urlset>\n');
console.log('Built', pages.length, 'pages for', site);
