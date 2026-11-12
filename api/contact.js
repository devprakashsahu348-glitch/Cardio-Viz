import { neon } from '@neondatabase/serverless';

const bad = (res, msg) => res.status(400).json({ error: msg });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  let b = req.body;
  try { if (typeof b === 'string') b = JSON.parse(b || '{}'); } catch { return bad(res, 'Invalid request.'); }
  b = b || {};
  if (b.website) return res.status(200).json({ ok: true }); // honeypot
  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().slice(0, 200);
  const message = String(b.message || '').trim().slice(0, 4000);
  if (name.length < 2) return bad(res, 'Enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(res, 'Enter a valid email address.');
  if (message.length < 10) return bad(res, 'Write at least 10 characters in your message.');
  if (!b.consent) return bad(res, 'Tick the consent box to continue.');
  if (!process.env.DATABASE_URL) return res.status(500).json({ error: 'Server is not configured.' });
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`INSERT INTO contact_messages (name, email, message, utm, page)
              VALUES (${name}, ${email}, ${message}, ${JSON.stringify(b.utm || {})}::jsonb, ${String(b.page || '').slice(0, 200)})`;
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact insert failed');
    return res.status(500).json({ error: 'Could not save your message. Email us instead.' });
  }
}
