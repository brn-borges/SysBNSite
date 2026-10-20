# Proteção do site público

O GitHub Pages publica o diretório `_site/` gerado por `npm run build`.
O build insere uma CSP em cada página com `head` antes dos scripts.
Os scripts inline existentes (tema, ano, dados estruturados e animação de agradecimento)
recebem hashes SHA-256 calculados a partir do conteúdo exato. Novos scripts inline
injetados não são permitidos automaticamente no site publicado.

O Lucide usa a versão 1.59.0, URL explícita, SRI SHA-384 e CORS anônimo.
A atualização da biblioteca deve revisar tanto a URL quanto o hash em todas as
páginas e em `scripts/site-security.mjs`. O build/check não consulta a rede.

A política mantém imagens locais/data/blob, estilos inline já usados, fontes
Google, catálogo público na API e envio de feedback ao Forminit.
Não libera eval nem scripts inline sem hash. Não altere o HTML depois do build,
pois os hashes precisam corresponder aos bytes dos scripts publicados.

```bash
npm run build
npm run check
```

A validação confere hashes, scripts externos e referências locais e impede que
documentação, ferramentas e segredos entrem no pacote público.

## Cabeçalhos HTTP no Cloudflare

GitHub Pages não aplica cabeçalhos personalizados por arquivos `_headers` ou
`.htaccess`. A CSP via meta não implementa `frame-ancestors`, HSTS ou
X-Content-Type-Options. Esses reforços precisam ser aplicados no provedor.

Se os hosts estiverem com proxy Cloudflare ativo, crie uma regra de transformação
de cabeçalhos de resposta, restrita a:

```text
http.host in {"sysbn.com.br" "www.sysbn.com.br"}
```

Use **Definir/Set** (não adicionar duplicatas):

| Cabeçalho | Valor |
| --- | --- |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() |
| Strict-Transport-Security | max-age=31536000 |

HSTS deve ser ativado somente com HTTPS funcionando nos dois hosts. Não se inclui
`includeSubDomains` ou preload nesta orientação. Com DNS sem proxy, as regras
Cloudflare não se aplicam; configure os cabeçalhos no serviço que entrega o site.
Este PR não altera DNS, Cloudflare ou hospedagem.

Não aplique uma CSP genérica de scripts por cabeçalho sem considerar os hashes
do build: políticas por cabeçalho e meta são aplicadas em conjunto e podem
bloquear tema, catálogo, ícones ou formulários.

## Conferência após publicar

Confira `curl -I https://sysbn.com.br/` para os cabeçalhos HTTP e DevTools > Console
para violações da CSP. A CSP via meta aparece no HTML, não no `curl -I`.
Verifique home, menu/tema, planos, feedback com anexo e agradecimento.
Os testes locais não substituem um envio real autorizado ao serviço de formulários.

Referências: https://developers.cloudflare.com/rules/transform/response-header-modification/
e https://www.w3.org/TR/SRI/
