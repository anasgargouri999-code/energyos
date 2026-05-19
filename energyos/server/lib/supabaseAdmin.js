const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

let supabase;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('Missing Supabase env variables. Using placeholder client for local/demo mode.');
  supabase = createClient('https://placeholder-project.supabase.co', 'placeholder-key');
}

module.exports = supabase;
