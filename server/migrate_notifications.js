require('dotenv').config();
const https = require('https');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL.replace('https://','').replace('.supabase.co','');

const SQL = `
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON notifications(user_id, is_read);
`;

const body = JSON.stringify({ query: SQL });
const options = {
  hostname: `${PROJECT_REF}.supabase.co`,
  path: '/rest/v1/rpc/query',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Length': Buffer.byteLength(body),
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201 || res.statusCode === 204) {
      console.log('✅ notifications table created!');
    } else {
      console.log('❌ Could not auto-create. Status:', res.statusCode);
      console.log('\nPlease run this SQL in your Supabase SQL Editor:\n');
      console.log('https://supabase.com/dashboard/project/lasgvbjdsqzfbggehpjg/sql/new\n');
      console.log(SQL);
    }
  });
});
req.on('error', (e) => {
  console.log('\nPlease run this SQL in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/lasgvbjdsqzfbggehpjg/sql/new\n');
  console.log(SQL);
});
req.write(body);
req.end();
