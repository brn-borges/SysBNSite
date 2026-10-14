// Catálogo público: nenhuma sessão ou credencial é enviada à API.
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('public-plans');
    if (!container) return;
    const status = document.getElementById('plans-status');
    const retry = document.getElementById('plans-retry');
    const resources = [
        ['compartilhamentos', 'Compartilhamentos', true], ['contas', 'Contas', true],
        ['cartoes', 'Cartões', true], ['categorias', 'Categorias', true],
        ['subcategorias', 'Subcategorias', true], ['tiposConta', 'Tipos de conta', true],
        ['orcamentos', 'Orçamentos', true], ['agendamentos', 'Agendamentos ativos', true],
        ['vencimentos', 'Vencimentos'], ['transacoes', 'Transações'], ['saldos', 'Saldos'],
        ['relatorios', 'Relatórios'], ['importacaoOfx', 'Importação OFX'], ['pdv', 'PDV'],
        ['pdvProdutos', 'Produtos do PDV', true], ['pdvChavesPix', 'Chaves Pix do PDV', true],
        ['pdvClientes', 'Clientes do PDV'], ['pdvRelatorios', 'Relatórios do PDV']
    ];
    const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const number = new Intl.NumberFormat('pt-BR');
    let loading = false;
    let loadedAt = 0;
    const element = (tag, className, text) => {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const validPlan = p => p && Number.isSafeInteger(p.id) && p.id > 0
        && typeof p.nome === 'string' && p.nome.trim() && p.nome.length <= 200
        && (p.descricao == null || typeof p.descricao === 'string' && p.descricao.length <= 10000)
        && Number.isSafeInteger(p.preco_centavos) && p.preco_centavos >= 0
        && ['mensal', 'anual'].includes(p.periodicidade)
        && p.recursos && typeof p.recursos === 'object' && !Array.isArray(p.recursos)
        && resources.every(([key, , quantity]) => {
            const rule = p.recursos[key];
            return rule && ['desabilitado', 'limitado', 'ilimitado'].includes(rule.modo)
                && (rule.modo !== 'limitado' || quantity && Number.isSafeInteger(rule.limite) && rule.limite > 0);
        });
    function render(plans) {
        const cards = plans.map(plan => {
            const card = element('article', 'pricing-card public-plan');
            const heading = element('div', 'public-plan-heading');
            heading.append(element('span', 'plan-cycle', plan.preco_centavos === 0 ? 'Plano gratuito' : plan.periodicidade === 'anual' ? 'Cobrança anual' : 'Cobrança mensal'));
            heading.append(element('h3', '', plan.nome));
            const price = element('p', 'plan-price', plan.preco_centavos === 0 ? 'Grátis' : money.format(plan.preco_centavos / 100));
            if (plan.preco_centavos > 0) price.append(element('span', 'plan-price-cycle', plan.periodicidade === 'anual' ? ' / ano' : ' / mês'));
            heading.append(price, element('p', 'small-text plan-description', plan.descricao || 'Confira os recursos incluídos neste plano.'));
            card.append(heading);
            const list = element('ul', 'plan-resources');
            const available = resources.filter(([key]) => plan.recursos[key].modo !== 'desabilitado');
            const makeItem = ([key, label, quantity]) => {
                const rule = plan.recursos[key];
                const item = element('li', '');
                item.append(element('span', '', label));
                item.append(element('strong', '', quantity ? rule.modo === 'ilimitado' ? 'Ilimitado' : 'Até ' + number.format(rule.limite) : 'Incluído'));
                return item;
            };
            available.slice(0, 6).forEach(resource => list.append(makeItem(resource)));
            card.append(element('h4', 'plan-resources-title', 'Recursos incluídos'), list);
            if (available.length > 6) {
                const details = element('details', 'plan-more');
                details.append(element('summary', '', 'Ver todos os ' + available.length + ' recursos'));
                const extra = element('ul', 'plan-resources');
                available.slice(6).forEach(resource => extra.append(makeItem(resource)));
                details.append(extra);
                card.append(details);
            }
            if (!list.children.length) list.append(element('li', '', 'Nenhum recurso adicional disponível.'));
            const action = element('a', 'btn-cta primary', 'Escolher plano');
            const cadastro = new URL('https://controlfinance.sysbn.com.br/authentication/register');
            cadastro.searchParams.set('plano', String(plan.id));
            action.href = cadastro.href;
            action.setAttribute('aria-label', 'Escolher o plano ' + plan.nome + ' no cadastro do ControlFinance');
            const footer = element('div', 'plan-card-footer');
            footer.append(action, element('small', '', plan.preco_centavos === 0 ? 'Confirme o plano ao criar sua conta.' : 'Liberação após confirmação do pagamento.'));
            card.append(footer);
            return card;
        });
        container.replaceChildren(...cards);
    }
    async function load() {
        if (loading) return;
        loading = true;
        retry.hidden = true;
        status.textContent = 'Carregando planos disponíveis…';
        container.setAttribute('aria-busy', 'true');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        try {
            const response = await fetch('https://cfapi.sysbn.com.br/auth/planos', {
                method: 'GET', credentials: 'omit', headers: { Accept: 'application/json' },
                cache: 'no-store', redirect: 'error', signal: controller.signal
            });
            if (!response.ok) throw new Error('Consulta indisponível');
            const body = await response.json();
            if (!Array.isArray(body.data) || body.data.length > 1000 || !body.data.every(validPlan)
                || new Set(body.data.map(p => p.id)).size !== body.data.length) throw new Error('Catálogo inválido');
            render(body.data.sort((a, b) => a.preco_centavos - b.preco_centavos || a.id - b.id));
            status.textContent = body.data.length ? body.data.length + (body.data.length === 1 ? ' plano disponível' : ' planos disponíveis') : 'Nenhum plano público disponível no momento. Consulte novamente mais tarde.';
            loadedAt = Date.now();
        } catch (_) {
            container.replaceChildren();
            status.textContent = 'Não foi possível consultar os planos agora. Tente novamente ou confira as opções no ControlFinance.';
            retry.hidden = false;
        } finally {
            clearTimeout(timeout);
            loading = false;
            container.setAttribute('aria-busy', 'false');
        }
    }
    retry.addEventListener('click', load);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && loadedAt && Date.now() - loadedAt >= 300000) load();
    });
    load();
});
