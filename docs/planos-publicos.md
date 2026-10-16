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

## Mensal e anual

O seletor filtra planos pagos pela periodicidade configurada na API. Os gratuitos aparecem em ambos os períodos. Não são criados planos anuais ou descontos fictícios; ausência de opções pagas no período é informada. Em planos anuais, o preço principal é o total anual e a referência mensal corresponde ao total dividido por 12, arredondado na apresentação. A referência não altera a cobrança. O link mantém o ID do plano anual para pré-seleção no cadastro.

## Recomendação por modalidade

O catálogo pode fornecer recomendado (booleano); a ausência é tratada como sem destaque para compatibilidade. O selo Recomendado e a borda aparecem somente na modalidade correspondente. A indicação é configurada pelo administrador no ControlFinance, sem seleção automática e sem alterar preços ou links de cadastro. Publicar a API com a migração PlanoRecomendado primeiro.


O catálogo apresenta Compromissos, formatos PDF/CSV, relatórios financeiros individuais e limite de clientes do PDV. Recursos indisponíveis ficam ocultos; manual e suporte preservam suas exportações. As promoções vigentes mostram preço normal, promocional, condição da renovação e término em horário de Brasília. A API calcula o preço contratado; o site nunca envia um valor para cobrança. Ofertas expiradas deixam de ter destaque mesmo com a página aberta. Publicar somente após a API de promoções e o front correspondentes.
