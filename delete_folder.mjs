import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://llseujnjhjrwmzhwfmoq.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteFolder(bucket, folderPath) {
  console.log(`Searching for files in ${bucket}:${folderPath}...`);
  const { data, error } = await supabase.storage.from(bucket).list(folderPath, {
    limit: 1000,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  });

  if (error) {
    console.error(`Error listing files in ${bucket}:`, error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log("No files found.");
    return;
  }

  const filesToRemove = data
    .filter(file => file.name !== '.emptyFolderPlaceholder')
    .map(file => `${folderPath}${file.name}`);

  if (filesToRemove.length === 0) {
    console.log("Only empty placeholders found or nothing to delete.");
    return;
  }

  console.log(`Found ${filesToRemove.length} files. Deleting...`);
  const { data: deleteData, error: deleteError } = await supabase.storage.from(bucket).remove(filesToRemove);

  if (deleteError) {
    console.error("Error deleting files:", deleteError);
  } else {
    console.log(`Successfully deleted ${deleteData.length} files.`);
  }
}

async function main() {
  await deleteFolder('luna-vault', 'vault/67539ee2-a1b0-405d-bbc1-c33dcbd198e6/gallery-phone-backup/');
  await deleteFolder('vault', '67539ee2-a1b0-405d-bbc1-c33dcbd198e6/gallery-phone-backup/');
}

main();
