import { body, db, setCookie, sign, same, isAdmin, ready } from './_lib.js';
export default async function handler(req, res) {
  if (!ready(res, 'AUTH_SECRET', 'ADMIN_PASSWORD', 'DATABASE_URL')) return;
  const a = req.query.a || '';
  if (a === 'logout') { setCookie(res, 'cv_a', '', 0); return res.json({ ok: true }); }
  if (a === 'login' && req.method === 'POST') {
    if (!same(body(req).password || '', process.env.ADMIN_PASSWORD)) return res.status(401).json({ error: 'Wrong password.' });
    setCookie(res, 'cv_a', sign({ admin: true }, 0.34), 29000); return res.json({ ok: true });
  }
  if (!isAdmin(req)) return res.status(401).json({ error: 'Admin login required.' });
  try {
    const sql = await db();
    const messages = await sql`SELECT id, name, email, message, utm, page, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 200`;
    const c = await sql`SELECT (SELECT count(*) FROM users) AS users, (SELECT count(*) FROM predictions) AS predictions`;
    return res.json({ messages, stats: c[0] });
  } catch { return res.status(500).json({ error: 'Could not load data.' }); }
}
