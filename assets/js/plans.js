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
        ['pdvClientes', 'Clientes do PDV', true], ['pdvRelatorios', 'Relatórios do PDV'],
        ['compromissos', 'Compromissos'], ['exportacaoPdf', 'Exportação PDF'], ['exportacaoCsv', 'Exportação CSV'],
        ['relatorioExtrato', 'Extrato por conta'], ['relatorioTiposConta', 'Relatório de tipos de conta'],
        ['relatorioCategoria', 'Relatório de categoria'], ['relatorioSubcategoria', 'Relatório de subcategoria'],
        ['relatorioVencimentos', 'Relatório de vencimentos'], ['relatorioPendencias', 'Relatório de pendências'], ['relatorioEstornos', 'Relatório de estornos']
    ];
    const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
    const number = new Intl.NumberFormat('pt-BR');
    const periodControl = document.getElementById('plans-period');
    const periodButtons = periodControl.querySelectorAll('[data-period]');
    let catalog = [];
    let period = 'mensal';
    let loading = false;
    let loadedAt = 0;
    const element = (tag, className, text) => {
        const node = document.createElement(tag);
        node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    };
    const promotion = p => p.promocao && Date.now() >= Date.parse(p.promocao.inicio) && Date.now() < Date.parse(p.promocao.fim) ? p.promocao : null;
    const normalizePlan = p => {
        if (!p || !p.recursos || typeof p.recursos !== 'object' || Array.isArray(p.recursos)) return p;
        const regras = {...p.recursos};
        for (const [key] of resources) if (!regras[key]) {
            const parent = key.startsWith('relatorio') && key !== 'relatorios' ? 'relatorios' : key === 'compromissos' ? 'transacoes' : null;
            if (parent) regras[key] = regras[parent];
            else if (key.startsWith('exportacao')) regras[key] = {modo:'ilimitado',limite:null};
        }
        for (const [key] of resources) if ((key.startsWith('pdv') && key !== 'pdv' && regras.pdv?.modo === 'desabilitado') || (key.startsWith('relatorio') && key !== 'relatorios' && regras.relatorios?.modo === 'desabilitado') || (key === 'exportacaoCsv' && regras.exportacaoPdf?.modo === 'desabilitado')) regras[key]={modo:'desabilitado',limite:null};
        return {...p,recursos:regras};
    };
    const validPlan = p => p && Number.isSafeInteger(p.id) && p.id > 0
        && typeof p.nome === 'string' && p.nome.trim() && p.nome.length <= 200
        && (p.descricao == null || typeof p.descricao === 'string' && p.descricao.length <= 10000)
        && Number.isSafeInteger(p.preco_centavos) && p.preco_centavos >= 0
        && ['mensal', 'anual'].includes(p.periodicidade)
        && (p.recomendado === undefined || typeof p.recomendado === 'boolean')
        && (p.promocao == null || typeof p.promocao === 'object' && !Array.isArray(p.promocao)
            && Number.isSafeInteger(p.promocao.preco_centavos) && p.promocao.preco_centavos > 0 && p.promocao.preco_centavos < p.preco_centavos
            && ['primeira','recorrente'].includes(p.promocao.aplicacao)
            && typeof p.promocao.inicio === 'string' && typeof p.promocao.fim === 'string'
            && Number.isFinite(Date.parse(p.promocao.inicio)) && Date.parse(p.promocao.fim) > Date.parse(p.promocao.inicio))
        && p.recursos && typeof p.recursos === 'object' && !Array.isArray(p.recursos)
        && resources.every(([key, , quantity]) => {
            const rule = p.recursos[key];
            return rule && ['desabilitado', 'limitado', 'ilimitado'].includes(rule.modo)
                && (rule.modo !== 'limitado' || quantity && Number.isSafeInteger(rule.limite) && rule.limite > 0);
        });
    function render(plans) {
        const visible = plans.filter(p => p.preco_centavos === 0 || p.periodicidade === period);
        const cards = visible.map(plan => {
            const offer=promotion(plan);
            const priceCents=offer?.preco_centavos ?? plan.preco_centavos;
            const card = element('article', 'pricing-card public-plan');
            const heading = element('div', 'public-plan-heading');
            if (plan.recomendado === true && plan.periodicidade === period) { card.classList.add('public-plan--recommended'); heading.append(element('span', 'plan-recommended-badge', 'Recomendado')); }
            if(offer)heading.append(element('span','plan-promotion-badge','Em promoção'));
            heading.append(element('span', 'plan-cycle', plan.preco_centavos === 0 ? 'Plano gratuito' : plan.periodicidade === 'anual' ? 'Cobrança anual' : 'Cobrança mensal'));
            heading.append(element('h3', '', plan.nome));
            const price = element('p', 'plan-price', plan.preco_centavos === 0 ? 'Grátis' : money.format(priceCents / 100));
            if (plan.preco_centavos > 0) price.append(element('span', 'plan-price-cycle', plan.periodicidade === 'anual' ? ' / ano' : ' / mês'));
            if(offer)heading.append(element('del','plan-original-price',money.format(plan.preco_centavos/100)));
            heading.append(price);
            if(offer){
                heading.append(element('p','small-text plan-promotion-terms',offer.aplicacao==='primeira' ? 'Somente a primeira cobrança. Renovação por '+money.format(plan.preco_centavos/100)+(plan.periodicidade==='anual'?' por ano.':' por mês.') : 'Preço promocional também nas renovações, enquanto mantido o plano.'));
                heading.append(element('p','small-text plan-promotion-terms','Oferta para novas contratações até '+new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(offer.fim))+' (horário de Brasília).'));
            }
            if (plan.preco_centavos > 0 && plan.periodicidade === 'anual') heading.append(element('p', 'plan-annual-reference', 'Total cobrado por ano · equivalente a ' + money.format(priceCents / 1200) + ' por mês. Não é cobrança mensal.'));
            heading.append(element('p', 'small-text plan-description', plan.descricao || 'Confira os recursos incluídos neste plano.'));
            heading.append(element('span', 'plan-resource-count', resources.filter(([key]) => plan.recursos[key].modo !== 'desabilitado').length + ' recursos disponíveis'));
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
            available.slice(0, 4).forEach(resource => list.append(makeItem(resource)));
            card.append(element('h4', 'plan-resources-title', 'Recursos incluídos'), list);
            if (available.length > 4) {
                const details = element('details', 'plan-more');
                details.append(element('summary', '', 'Ver todos os ' + available.length + ' recursos'));
                const extra = element('ul', 'plan-resources');
                available.slice(4).forEach(resource => extra.append(makeItem(resource)));
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
            footer.append(action, element('small', '', plan.preco_centavos === 0 ? 'Confirme o plano ao criar sua conta.' : 'Plano aplicado no cadastro, válido até o vencimento da cobrança inicial.'));
            card.append(footer);
            return card;
        });
        container.replaceChildren(...cards);
        periodButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.period === period)));
        status.textContent = !plans.length ? 'Nenhum plano público disponível no momento.' : !visible.some(p => p.preco_centavos > 0) ? 'Não há planos pagos ' + (period === 'anual' ? 'anuais' : 'mensais') + ' disponíveis no momento.' : visible.length + (visible.length === 1 ? ' plano disponível' : ' planos disponíveis');
    }
    async function load() {
        if (loading) return;
        loading = true;
        retry.hidden = true;
        periodButtons.forEach(b => b.disabled = true);
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
            if(Array.isArray(body.data))body.data=body.data.map(normalizePlan);
            if (!Array.isArray(body.data) || body.data.length > 1000 || !body.data.every(validPlan)
                || new Set(body.data.map(p => p.id)).size !== body.data.length) throw new Error('Catálogo inválido');
            catalog = body.data.sort((a, b) => (promotion(a)?.preco_centavos ?? a.preco_centavos) - (promotion(b)?.preco_centavos ?? b.preco_centavos) || a.id - b.id);
            if (!loadedAt && !catalog.some(p => p.preco_centavos > 0 && p.periodicidade === 'mensal') && catalog.some(p => p.preco_centavos > 0 && p.periodicidade === 'anual')) period = 'anual';
            periodControl.hidden = !catalog.length;
            render(catalog);
            /* status is derived from the selected period */
            loadedAt = Date.now();
        } catch (_) {
            catalog = [];
            periodControl.hidden = true;
            container.replaceChildren();
            status.textContent = 'Não foi possível consultar os planos agora. Tente novamente ou confira as opções no ControlFinance.';
            retry.hidden = false;
        } finally {
            clearTimeout(timeout);
            loading = false;
            periodButtons.forEach(b => b.disabled = false);
            container.setAttribute('aria-busy', 'false');
        }
    }
    periodButtons.forEach(button => button.addEventListener('click', () => { period = button.dataset.period; render(catalog); }));
    retry.addEventListener('click', load);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && loadedAt && Date.now() - loadedAt >= 300000) load();
    });
    setInterval(() => {if(document.hidden)return;if(loadedAt && Date.now()-loadedAt>=300000)load();else if(catalog.length)render(catalog);},30000);
    load();
});


