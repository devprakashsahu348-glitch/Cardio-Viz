# Deploying CardioViz (free tier)

1. Upload this folder's contents to a GitHub repo (it can be private).
2. neon.tech: new project, SQL Editor, run `schema.sql`, copy the connection string.
3. vercel.com: Add New > Project > import the repo, framework Other.
4. Environment Variables (see `.env.example`). Required: `DATABASE_URL`, `AUTH_SECRET` (long random text), `ADMIN_PASSWORD`.
   For emails: `GMAIL_USER`, `GMAIL_APP_PASSWORD`. Optional: `NOTIFY_EMAIL`, `SITE_URL`, `GA_ID`, `WHATSAPP_NUMBER`.
5. Deploy, then test: sign up at `/account`, save a prediction in `/app/`, send the contact form, open `/admin`.
6. Emails (verification and reset codes): in your Google Account turn on 2-Step Verification, then create an App Password (Security > 2-Step Verification > App passwords). Without the two Gmail variables accounts are verified automatically and password reset is unavailable.
7. Never commit `.env`. Redeploy after changing any variable.
