# Site público SYSBN

Site estático em HTML, CSS e JavaScript, sem dependências de build. Requer Node.js 22 ou superior para os scripts de publicação.

## Organização

- `index.html`: página inicial.
- `contato/`, `feedback/`, `obrigado/`, `privacidade/`, `termos/`: páginas públicas, com URLs preservadas.
- `assets/css/site.css`: estilos base; `premium.css`: tema e componentes visuais. A ordem dos links é intencional.
- `assets/js/site.js`: navegação, tema, cookies e interações; `plans.js`: catálogo público e seleção de planos.
- `assets/`: identidade visual e favicon. Os endereços existentes dos ícones foram preservados.
- `scripts/`: construção e validação; `docs/`: documentação de manutenção.
- `_site/`: artefato público gerado; não versionado.

## Validar e visualizar

Execute `npm run build` e depois `npm run check`. Para visualizar, sirva `_site/` por HTTP, por exemplo com `python3 -m http.server 8080 --directory _site`. Os caminhos de assets partem da raiz do domínio; abrir HTML diretamente por file:// não representa o ambiente de publicação.

O build mantém somente a lista explícita de páginas/arquivos públicos em `scripts/build-site.mjs`. Ao adicionar uma página pública, inclua-a nessa lista e atualize o sitemap quando apropriado. Não coloque segredos em assets: seu conteúdo é público.

## Publicação

O workflow valida e envia somente `_site/` ao GitHub Pages. Documentação, ferramentas e metadados do repositório não são enviados. A configuração Apache `.htaccess` permanece no repositório como referência de hospedagem; GitHub Pages não a interpreta. Para outro servidor, publique o conteúdo de `_site/` e configure redirecionamentos/headers nele.

O catálogo de planos continua consultando somente a rota pública da API, sem credenciais de sessão. A seleção do plano permanece no parâmetro `plano` do cadastro.
