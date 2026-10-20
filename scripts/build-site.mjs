import { secureHtml } from './site-security.mjs';
import { cp, mkdir, rm, readdir, readFile, writeFile } from 'node:fs/promises';
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
async function protectPages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await protectPages(file);
    else if (entry.name.endsWith('.html')) {
      const html = await readFile(file, 'utf8');
      if (/<head[\s>]/i.test(html)) await writeFile(file, secureHtml(html));
    }
  }
}
await protectPages(output);
console.log('Site público gerado em _site/ com política de conteúdo.');
