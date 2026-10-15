import { readdir, readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../_site/', import.meta.url));
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(target); else files.push(target);
  }
}
await walk(root);
const errors = [];
for (const file of files.filter(f => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  for (const [, raw] of html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(raw)) continue;
    const relative = decodeURIComponent(raw.split(/[?#]/)[0]);
    let target = path.resolve(raw.startsWith('/') ? root : path.dirname(file), relative.replace(/^\//, ''));
    if (target !== path.resolve(root) && !target.startsWith(root)) { errors.push(`Caminho fora do site em ${path.relative(root, file)}`); continue; }
    try {
      if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
      await stat(target);
    } catch { errors.push(`${path.relative(root, file)}: recurso ausente ${raw}`); }
  }
}
for (const file of files) if (/(^|\/)(?:docs|scripts|node_modules|\.git|\.github)(\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:pem|key|sql|map)$/i.test(path.relative(root, file))) errors.push(`Arquivo não público no pacote: ${path.relative(root, file)}`);
if (errors.length) throw new Error(errors.join('\n'));
console.log(`Validação concluída: ${files.length} arquivos públicos e referências locais das páginas conferidos.`);
