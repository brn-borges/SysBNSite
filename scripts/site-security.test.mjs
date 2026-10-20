import { test } from 'node:test';
import assert from 'node:assert/strict';
import { secureHtml, validateHtmlSecurity, lucideUrl, lucideIntegrity } from './site-security.mjs';
const html = '<html><head><meta charset="utf-8"><script>window.theme = "dark";</script></head><body>' +
  '<script src="' + lucideUrl + '" integrity="' + lucideIntegrity + '" crossorigin="anonymous"></script></body></html>';
test('build allows existing inline code by hash and rejects a later injected script', () => {
  const result = secureHtml(html);
  assert.deepEqual(validateHtmlSecurity(result), []);
  assert(!result.match(/script-src[^;]+/)[0].includes("'unsafe-inline'"));
  assert(validateHtmlSecurity(result.replace('</body>', '<script>alert(1)</script></body>')).includes('Script inline sem hash na CSP'));
});
test('external scripts require the pinned URL, integrity and CORS', () => {
  for (const result of [secureHtml(html).replace('src="' + lucideUrl + '"', 'src="https://unpkg.com/lucide@latest"'),
    secureHtml(html).replace(lucideIntegrity, 'sha384-invalid'),
    secureHtml(html).replace('crossorigin="anonymous"', '')]) {
    assert(validateHtmlSecurity(result).includes('Script externo sem versão e integridade aprovadas'));
  }
});
test('public API and form endpoints remain allowed while plugins and frames are denied', () => {
  const result = secureHtml(html);
  for (const value of ["object-src 'none'", "frame-src 'none'", 'https://cfapi.sysbn.com.br', "form-action 'self' https://forminit.com"]) assert(result.includes(value));
});
