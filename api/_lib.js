import crypto from 'node:crypto';
const secret = () => process.env.AUTH_SECRET || '';
const mac = p => crypto.createHmac('sha256', secret()).update(p).digest('base64url');
export const sign = (o, days = 14) => { const p = Buffer.from(JSON.stringify({ ...o, exp: Date.now() + days * 864e5 })).toString('base64url'); return p + '.' + mac(p); };
export function verify(t) {
  if (!t || !secret()) return null;
  const [p, s] = t.split('.'); if (!p || !s) return null;
  const a = Buffer.from(s), b = Buffer.from(mac(p));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { const o = JSON.parse(Buffer.from(p, 'base64url')); return o.exp > Date.now() ? o : null; } catch { return null; }
}
export const getCookie = (req, n) => ((req.headers.cookie || '').split('; ').find(c => c.startsWith(n + '=')) || '').slice(n.length + 1);
export const setCookie = (res, n, v, age) => res.setHeader('Set-Cookie', `${n}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${age}`);
export const body = req => { let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } } return b || {}; };
export const hash = pw => { const s = crypto.randomBytes(16).toString('hex'); return s + ':' + crypto.scryptSync(pw, s, 64).toString('hex'); };
export const check = (pw, h) => { const [s, k] = String(h).split(':'); if (!s || !k) return false; const d = crypto.scryptSync(pw, s, 64), e = Buffer.from(k, 'hex'); return d.length === e.length && crypto.timingSafeEqual(d, e); };
export const same = (a, b) => { const x = crypto.createHash('sha256').update(String(a)).digest(), y = crypto.createHash('sha256').update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };
export const db = async () => { const { neon } = await import('@neondatabase/serverless'); return neon(process.env.DATABASE_URL); };
export const user = req => { const o = verify(getCookie(req, 'cv_s')); return o && o.uid ? o : null; };
export const isAdmin = req => { const o = verify(getCookie(req, 'cv_a')); return !!(o && o.admin); };
export const ready = (res, ...need) => { const m = need.filter(k => !process.env[k]); if (m.length) { res.status(500).json({ error: 'Server is not configured.' }); return false; } return true; };
export async function mail(to, subject, text) {
  if (!process.env.BREVO_API_KEY || !process.env.SENDER_EMAIL) return;
  try { await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ sender: { name: 'CardioViz', email: process.env.SENDER_EMAIL }, to: [{ email: to }], subject, textContent: text }) }); } catch { /* email is best effort */ }
}
