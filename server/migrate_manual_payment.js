require('dotenv').config();
const { supabase } = require('./config/db');

const migrate = async () => {
  console.log('Adding manual payment columns to orders table...');
  
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS manual_payment_status TEXT DEFAULT NULL;
    `
  });
  
  if (error) {
    console.error('Migration via RPC failed, trying direct SQL...');
    // Try direct approach
    const { error: e1 } = await supabase
      .from('orders')
      .select('payment_method')
      .limit(1);
    
    if (e1 && e1.message.includes('does not exist')) {
      console.log('Column payment_method does not exist yet.');
      console.log('Please run the following SQL in your Supabase Dashboard SQL Editor:');
      console.log(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'razorpay';
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS manual_payment_status TEXT DEFAULT NULL;
      `);
    } else {
      console.log('Columns already exist or accessible.');
    }
  } else {
    console.log('Migration complete!');
  }
  
  process.exit(0);
};

migrate();
