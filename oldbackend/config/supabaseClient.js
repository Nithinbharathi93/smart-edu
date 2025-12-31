import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// ⚠️ MAKE SURE THIS MATCHES THE NAME IN YOUR .ENV FILE
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; 

// Debugging: Check if key is loaded (Don't log the whole key for safety)
if (!supabaseKey) {
    console.error("❌ FATAL ERROR: SUPABASE_SERVICE_KEY is missing from .env!");
} else {
    console.log("✅ Supabase Service Key Loaded.");
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // crucial for backend usage
    autoRefreshToken: false,
  }
});

export default supabase;