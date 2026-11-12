# Deploying CardioViz (free tier)

1. Upload this folder's contents to a GitHub repo (it can be private).
2. neon.tech: new project, SQL Editor, run `schema.sql`, copy the connection string.
3. vercel.com: Add New > Project > import the repo, framework Other.
4. Environment Variables (see `.env.example`). Required: `DATABASE_URL`, `AUTH_SECRET` (long random text), `ADMIN_PASSWORD`.
   Optional: `BREVO_API_KEY` + `SENDER_EMAIL` (automatic emails), `NOTIFY_EMAIL`, `SITE_URL`, `GA_ID`, `WHATSAPP_NUMBER`.
5. Deploy, then test: sign up at `/account`, save a prediction in `/app/`, send the contact form, open `/admin`.
6. Emails: create a free Brevo account, verify your sender address, create an API key. Without it the site works but sends no emails.
7. Never commit `.env`. Redeploy after changing any variable.
