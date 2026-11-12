import crypto from 'node:crypto';
import { body, db, sign, setCookie, hash, check, same, user, ready, mail } from './_lib.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, AGE = 14 * 86400;
const mailOn = () => !!(process.env.BREVO_API_KEY && process.env.SENDER_EMAIL);
const dig = (email, purpose, code) => crypto.createHash('sha256').update(`${process.env.AUTH_SECRET}|${email}|${purpose}|${code}`).digest('hex');
async function sendOtp(sql, email, name, purpose) {
  const recent = await sql`SELECT 1 FROM otps WHERE email = ${email} AND purpose = ${purpose} AND created_at > now() - interval '60 seconds'`;
  if (recent.length) return false;
  const code = String(crypto.randomInt(100000, 1000000));
  await sql`INSERT INTO otps (email, purpose, code_hash, expires_at) VALUES (${email}, ${purpose}, ${dig(email, purpose, code)}, now() + interval '10 minutes')
            ON CONFLICT (email, purpose) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0, created_at = now()`;
  await mail(email, purpose === 'reset' ? 'Your CardioViz password reset code' : 'Your CardioViz verification code',
    `Hi ${name},\n\nYour code is ${code}\n\nIt works for 10 minutes. If you did not ask for it, ignore this email.\n\nCardioViz`);
  return true;
}
async function checkOtp(sql, email, purpose, code) {
  const r = await sql`SELECT code_hash, attempts FROM otps WHERE email = ${email} AND purpose = ${purpose} AND expires_at > now()`;
  if (!r.length || r[0].attempts >= 5) return false;
  if (!same(r[0].code_hash, dig(email, purpose, String(code || '').trim()))) {
    await sql`UPDATE otps SET attempts = attempts + 1 WHERE email = ${email} AND purpose = ${purpose}`; return false;
  }
  await sql`DELETE FROM otps WHERE email = ${email} AND purpose = ${purpose}`; return true;
}
export default async function handler(req, res) {
  const a = req.query.a || 'me';
  if (a === 'logout') { setCookie(res, 'cv_s', '', 0); return res.json({ ok: true }); }
  if (a === 'me') { const u = user(req); return res.json({ user: u ? { email: u.email, name: u.name } : null }); }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!ready(res, 'AUTH_SECRET', 'DATABASE_URL')) return;
  const sql = await db(), b = body(req), email = String(b.email || '').trim().toLowerCase().slice(0, 200), pw = String(b.password || '');
  const BAD = 'That code is wrong or has expired. Request a new one.';
  try {
    if (a === 'delete') {
      const u = user(req); if (!u) return res.status(401).json({ error: 'Log in first.' });
      await sql`DELETE FROM users WHERE id = ${u.uid}`; setCookie(res, 'cv_s', '', 0); return res.json({ ok: true });
    }
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (a === 'verify') {
      if (!(await checkOtp(sql, email, 'verify', b.code))) return res.status(400).json({ error: BAD });
      const r = await sql`UPDATE users SET email_verified = true WHERE email = ${email} RETURNING id, name`;
      if (!r.length) return res.status(400).json({ error: BAD });
      setCookie(res, 'cv_s', sign({ uid: r[0].id, email, name: r[0].name }), AGE); return res.json({ ok: true });
    }
    if (a === 'reset') {
      if (pw.length < 8 || pw.length > 200) return res.status(400).json({ error: 'Use a password of at least 8 characters.' });
      if (!(await checkOtp(sql, email, 'reset', b.code))) return res.status(400).json({ error: BAD });
      await sql`UPDATE users SET pw_hash = ${hash(pw)}, email_verified = true WHERE email = ${email}`; return res.json({ ok: true });
    }
    if (a === 'forgot' || a === 'resend') {
      if (!mailOn()) return res.status(503).json({ error: 'Email codes are not available yet.' });
      const r = await sql`SELECT name, email_verified FROM users WHERE email = ${email}`;
      if (r.length && (a === 'forgot' || !r[0].email_verified)) {
        if (!(await sendOtp(sql, email, r[0].name, a === 'forgot' ? 'reset' : 'verify'))) return res.status(429).json({ error: 'Wait a minute before asking for another code.' });
      }
      return res.json({ ok: true });
    }
    if (a === 'register') {
      const name = String(b.name || '').trim().slice(0, 100);
      if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
      if (pw.length < 8 || pw.length > 200) return res.status(400).json({ error: 'Use a password of at least 8 characters.' });
      if (!b.consent) return res.status(400).json({ error: 'Tick the consent box to create an account.' });
      const r = await sql`INSERT INTO users (email, name, pw_hash, email_verified) VALUES (${email}, ${name}, ${hash(pw)}, ${!mailOn()}) RETURNING id`;
      if (mailOn()) { await sendOtp(sql, email, name, 'verify'); return res.json({ ok: true, verify: true }); }
      setCookie(res, 'cv_s', sign({ uid: r[0].id, email, name }), AGE); return res.json({ ok: true });
    }
    if (a === 'login') {
      const r = await sql`SELECT id, name, pw_hash, email_verified FROM users WHERE email = ${email}`;
      if (!r.length || !check(pw, r[0].pw_hash)) return res.status(401).json({ error: 'Wrong email or password.' });
      if (!r[0].email_verified) return res.status(403).json({ error: 'Verify your email first. Use "Resend verification code" below.' });
      setCookie(res, 'cv_s', sign({ uid: r[0].id, email, name: r[0].name }), AGE); return res.json({ ok: true });
    }
    return res.status(404).json({ error: 'Unknown action.' });
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });
    console.error('auth failed'); return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}
