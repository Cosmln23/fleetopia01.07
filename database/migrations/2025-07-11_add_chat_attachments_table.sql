CREATE TABLE chat_attachments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  filename TEXT NOT NULL,
  s3_key TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
); 