# CardioViz website (full stack, free tier)

Static site + one serverless API (`/api/contact`) + Neon Postgres. Hosted on Vercel Hobby. No React, no Vite, no source maps.
Owner: Dev Prakash Sahu. Contact: devprakashsahu348@gmail.com.

## Launch in 8 steps
1. Create a GitHub repo, upload the contents of this folder (not the folder itself), commit.
2. neon.tech: create a free project, open the SQL Editor, run `schema.sql`, copy the connection string.
3. The demo is already in `public/app/index.html`. Replace it with your own version if you have one.
4. vercel.com: Add New > Project > import the repo. Framework preset: Other. Leave build settings (they come from `vercel.json`).
5. Environment Variables (copy from `.env.example`): `DATABASE_URL` (required). Optional: `SITE_URL`, `GA_ID`, `WHATSAPP_NUMBER`, `DEMO_URL`.
6. Deploy. Open the site, submit the contact form, then check `SELECT * FROM contact_messages;` in Neon.
7. Domain: Vercel > Settings > Domains > add yours, set `SITE_URL` to it, redeploy (HTTPS is automatic).
8. Search Console: add the domain, submit `/sitemap.xml`.

## Optional features switch on by env vars
- `GA_ID`: Google Analytics loads only after a visitor accepts cookies.
- `WHATSAPP_NUMBER` (country code + number, digits only): the floating button opens WhatsApp. Without it, it opens email.
- `DEMO_URL`: send "Open demo" elsewhere instead of `/app/`.

## Notes
- Fonts load from Google Fonts. Remove the two `fonts.*` links in `scripts/layout.html` to self-host.
- Neon free tier has automatic point-in-time restore (short window). For real backups run `pg_dump` monthly.
- Have the legal pages reviewed by a lawyer before taking payments.
