import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOT_DIR = path.join(__dirname, 'temporary screenshots');

console.log('\n=== Screenshot Cleanup ===\n');
console.log(`Directory: ${SCREENSHOT_DIR}\n`);

try {
  const files = fs.readdirSync(SCREENSHOT_DIR);
  const pngFiles = files.filter(f => f.endsWith('.png'));

  if (pngFiles.length === 0) {
    console.log('No PNG screenshots found to clean up.');
  } else {
    console.log(`Found ${pngFiles.length} screenshot(s):\n`);

    pngFiles.forEach(file => {
      const filepath = path.join(SCREENSHOT_DIR, file);
      const stats = fs.statSync(filepath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  - ${file} (${sizeKB} KB)`);
    });

    console.log('\nDeleting all screenshots...\n');

    let deleted = 0;
    pngFiles.forEach(file => {
      const filepath = path.join(SCREENSHOT_DIR, file);
      fs.unlinkSync(filepath);
      console.log(`  [DELETED] ${file}`);
      deleted++;
    });

    console.log(`\nCleanup complete. ${deleted} file(s) deleted.`);
  }
} catch (error) {
  console.error('Error during cleanup:', error.message);
}

console.log('\n');
