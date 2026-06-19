import { cp, mkdir, rm } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

await Promise.all([
  cp(path.join(root, 'index.html'), path.join(publicDir, 'index.html')),
  cp(path.join(root, 'src'), path.join(publicDir, 'src'), { recursive: true }),
  cp(path.join(root, 'dist'), path.join(publicDir, 'dist'), { recursive: true })
]);

console.log('Prepared Vercel static output in public/');
