import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

async function runMigration() {
  try {
    console.log('Starting migration process...');

    // 1. Run Prisma migrations
    console.log('Running database migrations...');
    await execAsync('npx prisma migrate deploy');

    // 2. Scrape Ning content
    console.log('Scraping Ning content...');
    await execAsync('ts-node scripts/scrape-ning.ts');

    // 3. Import scraped content
    console.log('Importing scraped content...');
    await execAsync('ts-node scripts/migrate-ning.ts');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration(); 