#!/usr/bin/env node
// Inspecao somente-leitura dos cabeçalhos efetivamente servidos em HTTPS.
// Não altera Cloudflare, DNS nem conteúdo publicado.
const urls = ['https://sysbn.com.br/', 'https://www.sysbn.com.br/'];
const checks = [
  ['strict-transport-security', v => /(?:^|;)\s*max-age=\d+/i.test(v), 'HSTS com max-age'],
  ['x-content-type-options', v => v.trim().toLowerCase()==='nosniff', 'X-Content-Type-Options: nosniff'],
  ['x-frame-options', v => ['deny','sameorigin'].includes(v.trim().toLowerCase()), 'Protecao contra enquadramento'],
  ['referrer-policy', v => v.trim().length>0, 'Referrer-Policy'],
  ['permissions-policy', v => v.trim().length>0, 'Permissions-Policy'],
];

let failures=0;
for(const url of urls){
  process.stdout.write('\n'+url+'\n');
  try{
    const response=await fetch(url,{method:'HEAD',redirect:'follow',signal:AbortSignal.timeout(12000)});
    if(!response.ok){console.error('FALHA HTTP: '+response.status); failures++; continue;}
    if(new URL(response.url).protocol!=='https:'){console.error('FALHA: redirecionamento fora de HTTPS');failures++;}
    for(const [header,valid,description] of checks){
      const value=response.headers.get(header)||'';
      if(!valid(value)){console.error('FALHA: '+description+' ('+header+')');failures++;}
      else console.log('OK: '+description);
    }
    // CSP via meta nao aparece nos headers. Nao reportar como faltante por HEAD.
    console.log('INFO: CSP via meta exige inspecao do HTML/build.');
  } catch(error){
    failures++;
    console.error('ERRO DE REDE: '+String(error?.message||error));
  }
}
if(failures){console.error('\nVerificacao incompleta: '+failures+' falha(s); conferir DNS/CDN antes de concluir.');process.exitCode=1;}
else console.log('\nCabeçalhos obrigatorios encontrados nos dois hosts.');
