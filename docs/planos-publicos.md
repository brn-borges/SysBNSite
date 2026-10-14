# Planos públicos do ControlFinance

A página inicial consulta `https://cfapi.sysbn.com.br/auth/planos` com GET, HTTPS e `credentials: omit`. Não configure tokens, cookies de sessão ou chaves administrativas no site.

O contrato esperado é `{ data: [{ id, nome, descricao, preco_centavos, periodicidade, recursos }] }`. A API decide quais planos estão ativos e públicos. O site valida a estrutura e mostra somente recursos habilitados, com seus limites ou indicação de ilimitado. Nomes e descrições são inseridos com `textContent`.

O carregamento tem timeout de 10 segundos. Falhas e respostas inválidas removem os cartões e permitem nova tentativa; catálogo vazio não recebe planos ou preços fictícios. Não há catálogo persistido no navegador. Ao retornar à página depois de cinco minutos, ela consulta novamente.

O botão leva ao cadastro com `?plano=ID`. O cadastro pré-seleciona somente um ID ainda presente no catálogo público atual da API; o usuário pode alterar a escolha. Um ID inexistente, inválido ou indisponível mantém a seleção obrigatória sem escolher outro plano automaticamente. Para usuários existentes, há um link para Minha assinatura. O site não envia preço nem concede recursos; a API revalida a contratação e o pagamento.

## Publicação

1. Disponibilize primeiro a API com a rota `/auth/planos` (PR ControlFinanceAPI #79) e o frontend com cadastro e assinaturas (PR ControlFinance #115).
2. Confira os planos marcados como ativos e públicos no painel administrativo.
3. A configuração CORS da API deve incluir exatamente `https://sysbn.com.br` e, se utilizado, `https://www.sysbn.com.br`. Esses endereços já estão nos padrões da API; se `CORS_ORIGINS` estiver definido, confirme a configuração efetiva.
4. Publique `index.html`, `premium.css` e `plans.js` juntos. Confirme no navegador o carregamento do catálogo e os estados de erro e vazio.

CORS limita a leitura pelo navegador e não torna os dados privados. O endpoint deve retornar apenas informações comerciais públicas e conservar o limite de requisições. A administração de planos continua protegida por autenticação e autorização no backend.
