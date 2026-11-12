import crypto from 'node:crypto';
import { body, db, sign, setCookie, hash, check, user, ready, mail, mailOn } from './_lib.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, AGE = 14 * 86400;
const strong = p => p.length >= 8 && Buffer.byteLength(p) <= 72 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);
const PWMSG = 'Password must be 8 to 72 characters with an uppercase letter, a lowercase letter and a number.';
const ipOf = req => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const base = req => (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');
const tooMany = async (sql, kind, key, max, mins) => (await sql`SELECT count(*)::int AS n FROM attempts WHERE kind = ${kind} AND k = ${key} AND created_at > now() - make_interval(mins => ${mins}::int)`)[0].n >= max;
const hit = (sql, kind, key) => sql`INSERT INTO attempts (kind, k) VALUES (${kind}, ${key})`;
let dummy;
export default async function handler(req, res) {
  const a = req.query.a || 'me';
  if (a === 'logout') { setCookie(res, 'cv_s', '', 0); return res.json({ ok: true }); }
  if (a === 'me') { const u = user(req); return res.json({ user: u ? { email: u.email, name: u.name } : null }); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!ready(res, 'AUTH_SECRET', 'DATABASE_URL')) return;
  const sql = await db(), b = body(req), ip = ipOf(req), pw = String(b.password || '');
  const email = String(b.email || '').trim().toLowerCase().slice(0, 200);
  try {
    if (a === 'delete') {
      const u = user(req); if (!u) return res.status(401).json({ error: 'Log in first.' });
      await sql`DELETE FROM users WHERE id = ${u.uid}`; setCookie(res, 'cv_s', '', 0); return res.json({ ok: true });
    }
    if (a === 'register') {
      const name = String(b.name || '').trim().slice(0, 100);
      if (name.length < 2) return res.status(400).json({ error: 'Enter your full name.' });
      if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      if (!strong(pw)) return res.status(400).json({ error: PWMSG });
      if (pw !== String(b.confirm || '')) return res.status(400).json({ error: 'The two passwords do not match.' });
      if (!b.consent) return res.status(400).json({ error: 'Tick the box to accept the terms and privacy policy.' });
      if (await tooMany(sql, 'signup', ip, 10, 60)) return res.status(429).json({ error: 'Too many sign-ups from this network. Try again later.' });
      await hit(sql, 'signup', ip);
      await sql`INSERT INTO users (email, name, pw_hash) VALUES (${email}, ${name}, ${await hash(pw)})`;
      return res.json({ ok: true });
    }
    if (a === 'login') {
      if (!EMAIL.test(email) || !pw) return res.status(400).json({ error: 'Enter your email and password.' });
      if ((await tooMany(sql, 'login', email, 5, 15)) || (await tooMany(sql, 'loginip', ip, 30, 15))) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
      const r = await sql`SELECT id, name, pw_hash FROM users WHERE email = ${email}`;
      dummy ||= await hash('not-a-real-password');
      const ok = await check(pw, r.length ? r[0].pw_hash : dummy);
      if (!r.length || !ok) { await hit(sql, 'login', email); await hit(sql, 'loginip', ip); return res.status(401).json({ error: 'Wrong email or password.' }); }
      await sql`DELETE FROM attempts WHERE kind = 'login' AND k = ${email}`;
      setCookie(res, 'cv_s', sign({ uid: r[0].id, email, name: r[0].name }), AGE); return res.json({ ok: true });
    }
    if (a === 'forgot') {
      if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
      if (!mailOn()) return res.status(503).json({ error: 'Password reset email is not available yet.' });
      if ((await tooMany(sql, 'forgot', email, 3, 60)) || (await tooMany(sql, 'forgotip', ip, 10, 60))) return res.status(429).json({ error: 'Too many requests. Try again in an hour.' });
      await hit(sql, 'forgot', email); await hit(sql, 'forgotip', ip);
      const r = await sql`SELECT id, name FROM users WHERE email = ${email}`;
      if (r.length) {
        const token = crypto.randomBytes(32).toString('hex');
        await sql`DELETE FROM reset_tokens WHERE user_id = ${r[0].id}`;
        await sql`INSERT INTO reset_tokens (token_hash, user_id, expires_at) VALUES (${sha(token)}, ${r[0].id}, now() + interval '30 minutes')`;
        await mail(email, 'Reset your CardioViz password', `Hi ${r[0].name},\n\nChoose a new password with this link:\n${base(req)}/reset#t=${token}\n\nThe link works for 30 minutes and only once. If you did not ask for this, ignore this email; your password is unchanged.\n\nCardioViz`);
      }
      return res.json({ ok: true });
    }
    if (a === 'reset') {
      if (!strong(pw)) return res.status(400).json({ error: PWMSG });
      if (pw !== String(b.confirm || '')) return res.status(400).json({ error: 'The two passwords do not match.' });
      const t = String(b.token || '');
      if (!/^[a-f0-9]{64}$/.test(t)) return res.status(400).json({ error: 'This reset link is invalid.' });
      const r = await sql`UPDATE reset_tokens SET used_at = now() WHERE token_hash = ${sha(t)} AND used_at IS NULL AND expires_at > now() RETURNING user_id`;
      if (!r.length) return res.status(400).json({ error: 'This reset link is invalid, expired or already used. Request a new one.' });
      await sql`UPDATE users SET pw_hash = ${await hash(pw)} WHERE id = ${r[0].user_id}`;
      await sql`DELETE FROM reset_tokens WHERE user_id = ${r[0].user_id}`;
      return res.json({ ok: true });
    }
    return res.status(404).json({ error: 'Unknown action.' });
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });
    console.error('auth failed'); return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}
