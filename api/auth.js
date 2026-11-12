import { body, db, sign, setCookie, hash, check, user, ready, mail } from './_lib.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, AGE = 14 * 86400;
export default async function handler(req, res) {
  const a = req.query.a || 'me';
  if (a === 'logout') { setCookie(res, 'cv_s', '', 0); return res.json({ ok: true }); }
  if (a === 'me') { const u = user(req); return res.json({ user: u ? { email: u.email, name: u.name } : null }); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!ready(res, 'AUTH_SECRET', 'DATABASE_URL')) return;
  const sql = await db(), b = body(req), email = String(b.email || '').trim().toLowerCase().slice(0, 200), pw = String(b.password || '');
  try {
    if (a === 'delete') {
      const u = user(req); if (!u) return res.status(401).json({ error: 'Log in first.' });
      await sql`DELETE FROM users WHERE id = ${u.uid}`; setCookie(res, 'cv_s', '', 0); return res.json({ ok: true });
    }
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (a === 'register') {
      const name = String(b.name || '').trim().slice(0, 100);
      if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
      if (pw.length < 8 || pw.length > 200) return res.status(400).json({ error: 'Use a password of at least 8 characters.' });
      if (!b.consent) return res.status(400).json({ error: 'Tick the consent box to create an account.' });
      const r = await sql`INSERT INTO users (email, name, pw_hash) VALUES (${email}, ${name}, ${hash(pw)}) RETURNING id`;
      setCookie(res, 'cv_s', sign({ uid: r[0].id, email, name }), AGE);
      await mail(email, 'Welcome to CardioViz', `Hi ${name},\n\nYour CardioViz account is ready. You can save predictions from the demo and review them in your account.\n\nCardioViz is for education and decision support only and is not a diagnosis.\n\nCardioViz`);
      return res.json({ ok: true });
    }
    if (a === 'login') {
      const r = await sql`SELECT id, name, pw_hash FROM users WHERE email = ${email}`;
      if (!r.length || !check(pw, r[0].pw_hash)) return res.status(401).json({ error: 'Wrong email or password.' });
      setCookie(res, 'cv_s', sign({ uid: r[0].id, email, name: r[0].name }), AGE); return res.json({ ok: true });
    }
    return res.status(404).json({ error: 'Unknown action.' });
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });
    console.error('auth failed'); return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}
