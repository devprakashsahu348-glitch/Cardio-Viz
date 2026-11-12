import { body, db, sign, verify, setCookie, hash, check, fp, user, ready, mail } from './_lib.js';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, AGE = 14 * 86400;
const mailOn = () => !!(process.env.BREVO_API_KEY && process.env.SENDER_EMAIL);
const base = req => (process.env.SITE_URL || `https://${req.headers.host}`).replace(/\/$/, '');
const sendVerify = (req, email, name, uid) => mail(email, 'Verify your CardioViz email',
  `Hi ${name},\n\nConfirm your email to finish creating your account:\n${base(req)}/account#verify=${sign({ p: 'v', uid }, 2)}\n\nThe link works for 2 days. If you did not sign up, ignore this email.\n\nCardioViz`);
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
    if (a === 'verify') {
      const o = verify(b.token);
      if (!o || o.p !== 'v') return res.status(400).json({ error: 'This verification link is invalid or has expired. Request a new one below.' });
      const r = await sql`UPDATE users SET email_verified = true WHERE id = ${o.uid} RETURNING email, name`;
      if (!r.length) return res.status(400).json({ error: 'Account not found.' });
      setCookie(res, 'cv_s', sign({ uid: o.uid, email: r[0].email, name: r[0].name }), AGE); return res.json({ ok: true });
    }
    if (a === 'reset') {
      const o = verify(b.token);
      if (!o || o.p !== 'r') return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
      if (pw.length < 8 || pw.length > 200) return res.status(400).json({ error: 'Use a password of at least 8 characters.' });
      const r = await sql`SELECT pw_hash FROM users WHERE id = ${o.uid}`;
      if (!r.length || fp(r[0].pw_hash) !== o.f) return res.status(400).json({ error: 'This reset link was already used or has expired. Request a new one.' });
      await sql`UPDATE users SET pw_hash = ${hash(pw)}, email_verified = true WHERE id = ${o.uid}`; return res.json({ ok: true });
    }
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (a === 'forgot') {
      const r = await sql`SELECT id, name, pw_hash FROM users WHERE email = ${email}`;
      if (r.length) await mail(email, 'Reset your CardioViz password', `Hi ${r[0].name},\n\nChoose a new password here:\n${base(req)}/account#reset=${sign({ p: 'r', uid: r[0].id, f: fp(r[0].pw_hash) }, 0.0417)}\n\nThe link works for 1 hour and only once. If you did not ask for this, ignore this email; your password is unchanged.\n\nCardioViz`);
      return res.json({ ok: true });
    }
    if (a === 'resend') {
      const r = await sql`SELECT id, name, email_verified FROM users WHERE email = ${email}`;
      if (r.length && !r[0].email_verified) await sendVerify(req, email, r[0].name, r[0].id);
      return res.json({ ok: true });
    }
    if (a === 'register') {
      const name = String(b.name || '').trim().slice(0, 100);
      if (name.length < 2) return res.status(400).json({ error: 'Enter your name.' });
      if (pw.length < 8 || pw.length > 200) return res.status(400).json({ error: 'Use a password of at least 8 characters.' });
      if (!b.consent) return res.status(400).json({ error: 'Tick the consent box to create an account.' });
      const r = await sql`INSERT INTO users (email, name, pw_hash, email_verified) VALUES (${email}, ${name}, ${hash(pw)}, ${!mailOn()}) RETURNING id`;
      if (mailOn()) { await sendVerify(req, email, name, r[0].id); return res.json({ ok: true, verify: true }); }
      setCookie(res, 'cv_s', sign({ uid: r[0].id, email, name }), AGE); return res.json({ ok: true });
    }
    if (a === 'login') {
      const r = await sql`SELECT id, name, pw_hash, email_verified FROM users WHERE email = ${email}`;
      if (!r.length || !check(pw, r[0].pw_hash)) return res.status(401).json({ error: 'Wrong email or password.' });
      if (!r[0].email_verified) return res.status(403).json({ error: 'Verify your email first. Use "Resend verification email" below.' });
      setCookie(res, 'cv_s', sign({ uid: r[0].id, email, name: r[0].name }), AGE); return res.json({ ok: true });
    }
    return res.status(404).json({ error: 'Unknown action.' });
  } catch (e) {
    if (e && e.code === '23505') return res.status(409).json({ error: 'An account with this email already exists. Log in instead.' });
    console.error('auth failed'); return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
}
