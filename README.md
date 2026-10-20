# Site público SYSBN

Site institucional estático em HTML, CSS e JavaScript, com apresentação do ControlFinance, catálogo público de planos, contato e páginas legais. Projetos relacionados: [frontend](https://github.com/brn-borges/ControlFinance) e [API](https://github.com/brn-borges/ControlFinanceAPI).

## Requisitos e execução

Node.js **22 ou superior** para os scripts de construção e validação. O site não possui dependências de build no `package.json`.

```bash
git clone https://github.com/brn-borges/SysBNSite.git
cd SysBNSite
npm run build
npm run check
python3 -m http.server 8080 --directory _site
```

Abra `http://localhost:8080`. Os caminhos de assets partem da raiz do domínio; abrir arquivos HTML diretamente não representa o ambiente publicado. Não utilize esse servidor de desenvolvimento como hospedagem pública de produção.

## Organização

| Caminho | Responsabilidade |
| --- | --- |
| `index.html` | Apresentação e planos |
| `contato/`, `feedback/`, `obrigado/`, `privacidade/`, `termos/` | Páginas públicas com URLs preservadas |
| `assets/css/site.css` e `premium.css` | Base, temas e componentes; mantenha a ordem de carregamento |
| `assets/js/site.js` | Navegação, tema, cookies e interações |
| `assets/js/plans.js` | Catálogo, mensal/anual, promoções e seleção do plano |
| `scripts/` e `docs/` | Construção, validação e manutenção |
| `_site/` | Artefato público gerado, não versionado |

O build copia somente a lista explícita de arquivos de `scripts/build-site.mjs`. Inclua novas páginas públicas nessa lista e revise links, sitemap e regras de navegação. `npm run check` verifica o pacote gerado e suas referências locais.

## Integração com planos

O catálogo consulta `GET https://cfapi.sysbn.com.br/auth/planos` com `credentials: omit`, sem JWT ou sessão do usuário. A escolha leva o identificador no parâmetro `plano` do cadastro do ControlFinance. O site apresenta preços, periodicidade, destaques e condições públicas; a API revalida a disponibilidade e as condições antes de aplicar uma contratação.

Nunca coloque no JavaScript credenciais de banco, SMTP, Google, tokens administrativos ou dados privados de assinantes. Recursos de autenticação e administração pertencem ao sistema/API. Consulte [planos públicos](docs/planos-publicos.md).

## Configurações públicas

O site e seus scripts atuais não consomem `.env`. As configurações são versionadas nos arquivos públicos ou definidas na hospedagem:

| Configuração | Local / comportamento |
| --- | --- |
| URL do catálogo | `assets/js/plans.js`: `https://cfapi.sysbn.com.br/auth/planos`. |
| Plano selecionado | Query `plano` no link de cadastro; identificador público revalidado pela API. |
| Tema compartilhado | Cookie `sysbn_theme`, valores `light`/`dark`, domínio `sysbn.com.br`, caminho `/`, duração de um ano, SameSite=Lax e Secure em HTTPS. |
| Preferência local de tema | `localStorage.theme`, com fallback à preferência do dispositivo. |
| Aceite do banner | `localStorage.sysbn_cookie_accepted`: `true` oculta o aviso; não é sessão/autorização. |
| Domínio de publicação | `CNAME`; manter URLs canônicas e sitemap coerentes. |
| Arquivos publicados | Lista explícita de `scripts/build-site.mjs`; saída `_site/`. |
| HTTPS, headers e cache | Configuração da hospedagem/Cloudflare; não são variáveis do JavaScript. |

Ao trocar o domínio, revise também URLs de cadastro/contato e a integração de tema. Cookies de `sysbn.com.br` não são compartilhados com localhost ou outro domínio. Nunca use essas preferências como controle de permissão.

## Publicação

O workflow valida e publica somente `_site/` no GitHub Pages. Documentação, scripts e metadados do repositório não fazem parte do pacote público. A configuração Apache `.htaccess` é uma referência para outros ambientes; GitHub Pages não a interpreta.

Para outra hospedagem, publique o conteúdo de `_site/` e configure HTTPS, redirecionamentos e headers nela. A presença de arquivos de configuração no repositório não comprova que o servidor publicado os aplica.

## Segurança, Cloudflare e manutenção

- Confirme proxy DNS e configuração HTTPS compatível com a hospedagem. Para origem HTTPS própria, utilize certificado válido e Full (strict).
- Regras de cache do site estático não devem ser estendidas indiscriminadamente à API ou a respostas autenticadas.
- Mantenha conteúdo dinâmico do catálogo como texto/elementos, sem inserir HTML arbitrário retornado pela API.
- Revise nos dois temas, em desktop/mobile e com API indisponível. Preços e condições exibidos precisam corresponder à resposta pública atual.
- A Cloudflare não substitui a proteção da VPS que atende à API. A verificação da origem, firewall, SSH e banco é separada da publicação do site.

Referências: [proteger a origem](https://developers.cloudflare.com/fundamentals/security/protect-your-origin-server/) e [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/).

Faça alterações em branch, valide o artefato e abra PR. Merge e publicação seguem o processo autorizado; atualizar o README não altera a configuração da Cloudflare ou do servidor.

## Segurança do site público

O build gera uma política de conteúdo com hashes dos scripts e os ícones usam versão fixa com SRI. Consulte [configuração dos cabeçalhos e validação](docs/security-headers.md) para concluir o reforço no Cloudflare.
