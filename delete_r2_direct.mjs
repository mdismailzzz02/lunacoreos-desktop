import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const endpoint = process.env.VITE_R2_ENDPOINT || process.env.R2_ENDPOINT;
  const accessKeyId = process.env.VITE_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.VITE_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.VITE_R2_BUCKET_NAME || process.env.R2_BUCKET_NAME || 'luna-vault';

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    console.error("Missing R2 credentials in .env");
    process.exit(1);
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: endpoint,
    credentials: {
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey
    },
    forcePathStyle: true // Prevents DNS errors with custom R2 domains
  });

  const prefix = 'vault/67539ee2-a1b0-405d-bbc1-c33dcbd198e6/gallery-phone-backup/';
  console.log(`Scanning R2 bucket '${bucket}' for prefix '${prefix}'...`);

  let isTruncated = true;
  let continuationToken = undefined;
  let deletedCount = 0;

  while (isTruncated) {
    const listCommand = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix,
      ContinuationToken: continuationToken
    });

    try {
      const response = await client.send(listCommand);
      const objects = response.Contents || [];

      if (objects.length > 0) {
        console.log(`Found ${objects.length} objects in this page. Deleting...`);
        for (const obj of objects) {
          if (obj.Key) {
            await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: obj.Key }));
            deletedCount++;
          }
        }
      } else {
        console.log("No objects found.");
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    } catch (err) {
      console.error("Error communicating with R2:", err);
      break;
    }
  }

  console.log(`Finished! Total deleted: ${deletedCount}`);
}

run();
