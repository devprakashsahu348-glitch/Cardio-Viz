# Deploying CardioViz (free tier)

1. Upload this folder's contents to a GitHub repo (it can be private).
2. neon.tech: new project, SQL Editor, run `schema.sql`, copy the connection string.
3. vercel.com: Add New > Project > import the repo, framework Other.
4. Environment Variables (see `.env.example`). Required: `DATABASE_URL`, `AUTH_SECRET` (long random text), `ADMIN_PASSWORD`.
   For emails: `GMAIL_USER`, `GMAIL_APP_PASSWORD`. Optional: `NOTIFY_EMAIL`, `SITE_URL`, `GA_ID`, `WHATSAPP_NUMBER`.
5. Deploy, then test: `/signup`, `/login`, `/forgot` (needs the Gmail variables), the reset link, `/dashboard`, the Save button in `/app/`, the contact form and `/admin`.
6. Reset emails: in your Google Account turn on 2-Step Verification, then create an App Password. Without the two Gmail variables, "Forgot password" cannot send emails.
7. Never commit `.env`. Redeploy after changing any variable.
