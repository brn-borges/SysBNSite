import { createHash } from 'node:crypto';

export const lucideUrl = 'https://unpkg.com/lucide@1.59.0/dist/umd/lucide.js';
export const lucideIntegrity = 'sha384-QAgcoyhvnM1xyZCx+kTmGJGxdCGSsxbh0OoHb5cdSAHTONJRjxPUnzOWl1POjytZ';
export function inlineHashes(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, attrs]) => !/\bsrc\s*=/i.test(attrs))
    .map(([, , source]) => "'sha256-" + createHash('sha256').update(source).digest('base64') + "'");
}
export function secureHtml(html) {
  const hashes = [...new Set(inlineHashes(html))];
  const policy = [
    "default-src 'self'", "base-uri 'self'", "object-src 'none'",
    "script-src 'self' " + lucideUrl + ' ' + hashes.join(' '),
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com", "img-src 'self' data: blob:",
    "connect-src 'self' https://cfapi.sysbn.com.br https://forminit.com https://api.forminit.com",
    "form-action 'self' https://forminit.com", "frame-src 'none'",
  ].join('; ');
  const charset = /<meta\s+charset\s*=\s*["'][^"']+["']\s*\/?>/i;
  if (!charset.test(html)) throw new Error('Página sem charset para inserir CSP.');
  return html.replace(charset, match => match +
    '\n    <meta http-equiv="Content-Security-Policy" content="' + policy + '">' +
    '\n    <meta name="referrer" content="strict-origin-when-cross-origin">');
}
export function validateHtmlSecurity(html) {
  if (!/<head[\s>]/i.test(html)) return [];
  const errors = [];
  const policy = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)">/i)?.[1] || '';
  const script = policy.split(';').map(s => s.trim()).find(s => s.startsWith('script-src ')) || '';
  if (!policy || script.includes("'unsafe-inline'") || script.includes("'unsafe-eval'")) errors.push('CSP de scripts ausente ou permissiva');
  for (const hash of inlineHashes(html)) if (!script.split(/\s+/).includes(hash)) errors.push('Script inline sem hash na CSP');
  for (const [, attrs] of html.matchAll(/<script\b([^>]*)>/gi)) {
    const src = attrs.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!src || src.startsWith('/') && !src.startsWith('//')) continue;
    if (src !== lucideUrl || !attrs.includes('integrity="' + lucideIntegrity + '"') || !attrs.includes('crossorigin="anonymous"')) errors.push('Script externo sem versão e integridade aprovadas');
  }
  if (/\son[a-z]+\s*=/i.test(html)) errors.push('Evento inline incompatível com CSP');
  return errors;
}
