CREATE TABLE chat_attachments (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  filename TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
); 