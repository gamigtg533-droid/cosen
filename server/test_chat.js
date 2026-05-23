require('dotenv').config({ path: '.env' });
const { supabase } = require('./config/db.js');

async function testChat() {
  console.log('Testing chat DB...');
  const { data: convos, error: cErr } = await supabase.from('conversations').select('*').limit(2);
  if (cErr) console.error('Convo Error:', cErr);
  else console.log('Conversations:', convos);

  const { data: dms, error: dmErr } = await supabase.from('direct_messages').select('*').limit(2);
  if (dmErr) console.error('DM Error:', dmErr);
  else console.log('DMs:', dms);

  const { data: msgs, error: mErr } = await supabase.from('messages').select('*').limit(2);
  if (mErr) console.error('Messages Error:', mErr);
  else console.log('Messages:', msgs);
}
testChat();
