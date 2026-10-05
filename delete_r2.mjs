import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://llseujnjhjrwmzhwfmoq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

async function deletePrefix() {
  const prefix = 'vault/67539ee2-a1b0-405d-bbc1-c33dcbd198e6/gallery-phone-backup/';
  console.log(`Sending request to R2 Edge Function to delete prefix: ${prefix}`);
  
  const url = `${supabaseUrl}/functions/v1/r2-presign?op=delete_prefix&prefix=${encodeURIComponent(prefix)}`;
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (!res.ok) {
      console.error(`HTTP error! status: ${res.status}`);
      const text = await res.text();
      console.error(text);
      return;
    }
    
    const data = await res.json();
    console.log("Success:", data);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

deletePrefix();
