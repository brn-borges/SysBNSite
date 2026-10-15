import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, '_site');
// Publish only the known public surface, never repository tooling or documentation.
const publicPaths = ['index.html', '404.html', 'CNAME', 'robots.txt', 'sitemap.xml',
  'google511db44f6a324698.html', 'assets', 'contato', 'feedback', 'obrigado', 'privacidade', 'termos'];
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const entry of publicPaths) await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
console.log('Site público gerado em _site/.');
