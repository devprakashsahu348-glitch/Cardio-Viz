import { body, db, user, ready } from './_lib.js';
export default async function handler(req, res) {
  const u = user(req); if (!u) return res.status(401).json({ error: 'Log in to use saved predictions.' });
  if (!ready(res, 'DATABASE_URL')) return;
  const sql = await db();
  try {
    if (req.method === 'GET') {
      const items = await sql`SELECT id, probs, created_at FROM predictions WHERE user_id = ${u.uid} ORDER BY created_at DESC LIMIT 50`;
      return res.json({ items });
    }
    if (req.method === 'POST') {
      const b = body(req), x = b.inputs, p = b.probs || {};
      if (!Array.isArray(x) || x.length !== 16 || !x.every(n => typeof n === 'number' && isFinite(n))) return res.status(400).json({ error: 'Invalid inputs.' });
      const probs = {}; for (const t of ['CAD', 'LAD', 'LCX', 'RCA']) { const v = Number(p[t]); if (!(v >= 0 && v <= 1)) return res.status(400).json({ error: 'Invalid results.' }); probs[t] = v; }
      await sql`INSERT INTO predictions (user_id, inputs, probs) VALUES (${u.uid}, ${JSON.stringify(x)}::jsonb, ${JSON.stringify(probs)}::jsonb)`;
      return res.json({ ok: true });
    }
    if (req.method === 'DELETE') {
      await sql`DELETE FROM predictions WHERE id = ${Number(req.query.id) || 0} AND user_id = ${u.uid}`; return res.json({ ok: true });
    }
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch { console.error('predictions failed'); return res.status(500).json({ error: 'Something went wrong. Try again.' }); }
}
