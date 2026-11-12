CREATE TABLE IF NOT EXISTS contact_messages (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  message    TEXT NOT NULL,
  utm        JSONB NOT NULL DEFAULT '{}',
  page       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
