// Catálogo público: nenhuma sessão ou credencial é enviada à API.
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('public-plans');
    if (!container) return;
    const status = document.getElementById('plans-status');
    const retry = document.getElementById('plans-retry');
    const comparison = document.getElementById('plans-comparison');
    const comparisonContent = document.getElementById('plans-comparison-content');
    const differencesOnly = document.getElementById('plans-differences-only');
    const compareToolbar = document.getElementById('plans-compare-toolbar');
    const compareSelection = document.getElementById('plans-compare-selection');
    const compareChips = document.getElementById('plans-compare-chips');
    const compareClear = document.getElementById('plans-compare-clear');
    const compareOpen = document.getElementById('plans-compare-open');
    const compareClose = document.getElementById('plans-compare-close');
    const compareDone = document.getElementById('plans-compare-done');
    const comparisonDialog = comparison.querySelector('.plans-comparison-dialog');
    // Modal precisa estar fora da seção animada: transform na seção cria
    // um containing block para position:fixed e prende o backdrop à seção.
    document.body.appendChild(comparison);
    const selectedPlanIds = new Set();
    let returnFocus = null;
    const carouselControls = document.getElementById('plans-carousel-controls');
    const carouselPosition = document.getElementById('plans-carousel-position');
    const carouselPrev = document.getElementById('plans-carousel-prev');
    const carouselNext = document.getElementById('plans-carousel-next');
    const carouselDots = document.getElementById('plans-carousel-dots');
    let carouselVisible = false;
    let carouselUpdateFrame = 0;
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
    // Tabela derivada exclusivamente do catálogo público e do período selecionado.
    // Não usa preços/limites fixos nem interpreta um recurso desabilitado como incluído.
    const planPrice = plan => {
        const cents = promotion(plan)?.preco_centavos ?? plan.preco_centavos;
        return plan.preco_centavos === 0 ? 'Grátis' : money.format(cents / 100) + (plan.periodicidade === 'anual' ? ' / ano' : ' / mês');
    };
    const resourceLabel = (plan, key, quantity) => {
        const rule = plan.recursos[key];
        if (!rule || rule.modo === 'desabilitado') return 'Não incluído';
        if (rule.modo === 'ilimitado') return quantity ? 'Ilimitado' : 'Incluído';
        return quantity ? 'Até ' + number.format(rule.limite) : 'Incluído';
    };
    function renderComparison(visible) {
        const chosen = visible.filter(plan => selectedPlanIds.has(plan.id));
        comparisonContent.replaceChildren();
        if (chosen.length < 2) return;
        visible = chosen;
        const rows = resources.map(([key, label, quantity]) => ({
            label, values: visible.map(plan => resourceLabel(plan, key, quantity))
        })).filter(row => !differencesOnly.checked || new Set(row.values).size > 1);
        const table = element('table', 'plans-compare-table');
        const caption = element('caption', 'plans-compare-caption', 'Comparação de recursos entre os planos disponíveis');
        const thead = element('thead', '');
        const names = element('tr', '');
        names.append(element('th', 'plans-compare-feature', 'Recurso'));
        for (const plan of visible) {
            const heading = element('th', '', '');
            heading.scope = 'col';
            heading.append(element('strong', '', plan.nome));
            if (plan.recomendado === true && plan.periodicidade === period) {
                heading.append(element('span', 'plans-compare-recommended', 'Recomendado'));
            }
            heading.append(element('small', '', planPrice(plan)));
            names.append(heading);
        }
        thead.append(names);
        const tbody = element('tbody', '');
        for (const row of rows) {
            const tr = element('tr', '');
            const th = element('th', 'plans-compare-feature', row.label);
            th.scope = 'row';
            tr.append(th);
            row.values.forEach(value => {
                const td = element('td', value === 'Não incluído' ? 'plans-compare-unavailable' : '');
                td.textContent = value;
                tr.append(td);
            });
            tbody.append(tr);
        }
        if (!rows.length) {
            const tr = element('tr', '');
            const td = element('td', 'plans-compare-empty', 'Nenhuma diferença entre os recursos dos planos selecionados.');
            td.colSpan = visible.length + 1;
            tr.append(td);
            tbody.append(tr);
        }
        table.append(caption, thead, tbody);
        comparisonContent.append(table);
    }
    const visiblePlans = () => catalog.filter(p => p.preco_centavos === 0 || p.periodicidade === period);
    const closeComparison = () => {
        if (comparison.hidden) return;
        comparison.hidden = true;
        document.body.classList.remove('plans-modal-open');
        if (returnFocus && returnFocus.isConnected) returnFocus.focus();
    };
    const syncSelection = () => {
        const visible = visiblePlans();
        const chosen = visible.filter(p => selectedPlanIds.has(p.id));
        compareToolbar.hidden = visible.length < 2;
        compareSelection.textContent = chosen.length === 0
            ? 'Marque de 2 a 3 planos nos cartões para comparar.'
            : chosen.length === 1 ? 'Selecione mais um plano para comparar.'
            : chosen.length + ' planos selecionados · pronto para comparar';
        compareChips.replaceChildren(...chosen.map(plan => element('span', 'plans-compare-chip', plan.nome)));
        compareOpen.disabled = chosen.length < 2;
        compareClear.disabled = chosen.length === 0;
        container.querySelectorAll('[data-compare-plan]').forEach(input => {
            const checked = selectedPlanIds.has(Number(input.dataset.comparePlan));
            input.checked = checked;
            input.disabled = !checked && chosen.length >= 3;
        });
        if (!comparison.hidden) renderComparison(visible);
    };
    const openComparison = () => {
        if (compareOpen.disabled) return;
        returnFocus = document.activeElement;
        renderComparison(visiblePlans());
        comparison.hidden = false;
        document.body.classList.add('plans-modal-open');
        comparisonDialog.focus();
    };
    compareOpen.addEventListener('click', openComparison);
    compareClear.addEventListener('click', () => { selectedPlanIds.clear(); syncSelection(); });
    compareClose.addEventListener('click', closeComparison);
    compareDone.addEventListener('click', closeComparison);
    comparison.querySelector('[data-close-comparison]').addEventListener('click', closeComparison);
    // Quando a roda do mouse está sobre o cabeçalho/ações, rola a tabela.
    // Sobre a tabela, a rolagem permanece nativa. Nunca transfere scroll à página.
    comparisonDialog.addEventListener('wheel', event => {
        if (event.ctrlKey || event.target.closest('.plans-comparison-scroll')) return;
        if (!event.deltaY && !event.deltaX) return;
        event.preventDefault();
        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? comparisonContent.clientHeight : 1;
        comparisonContent.scrollTop += event.deltaY * unit;
        comparisonContent.scrollLeft += event.deltaX * unit;
    }, { passive: false });
    comparison.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); closeComparison(); return; }
        if (event.key !== 'Tab') return;
        const focusable = [...comparisonDialog.querySelectorAll('button:not(:disabled),input:not(:disabled),[tabindex="0"]')].filter(el => el.getClientRects().length);
        if (!focusable.length) return;
        if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable[focusable.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === focusable[focusable.length - 1]) { event.preventDefault(); focusable[0].focus(); }
    });
    // Os cartões continuam todos no DOM e em ordem; no carrossel há
    // rolagem nativa com snap, sem autoplay e sem ocultar recursos.
    const carouselIndex = () => {
        const cards = [...container.querySelectorAll('.public-plan')];
        if (!cards.length) return 0;
        const left = container.scrollLeft;
        let index = 0;
        let smallest = Infinity;
        cards.forEach((card, i) => {
            const distance = Math.abs(card.offsetLeft - cards[0].offsetLeft - left);
            if (distance < smallest) { smallest = distance; index = i; }
        });
        return index;
    };
    const syncCarousel = () => {
        if (!carouselVisible) return;
        const cards = [...container.querySelectorAll('.public-plan')];
        const index = carouselIndex();
        carouselPosition.textContent = 'Plano ' + (index + 1) + ' de ' + cards.length;
        carouselPrev.disabled = container.scrollLeft <= 2;
        carouselNext.disabled = container.scrollLeft >= container.scrollWidth - container.clientWidth - 2;
        [...carouselDots.children].forEach((dot, i) => {
            dot.setAttribute('aria-current', i === index ? 'true' : 'false');
            dot.title = 'Ver plano ' + (i + 1);
        });
    };
    const goToCard = index => {
        const cards = container.querySelectorAll('.public-plan');
        if (!cards.length) return;
        const target = cards[Math.max(0, Math.min(index, cards.length - 1))];
        container.scrollTo({
            left: target.offsetLeft - cards[0].offsetLeft,
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
        });
    };
    const resetCarousel = count => {
        carouselVisible = count > 3;
        container.classList.toggle('plans-carousel-active', carouselVisible);
        carouselControls.hidden = !carouselVisible;
        carouselDots.hidden = !carouselVisible;
        carouselDots.replaceChildren();
        container.scrollLeft = 0;
        if (!carouselVisible) return;
        for (let i = 0; i < count; i++) {
            const dot = element('button', 'plans-carousel-dot');
            dot.type = 'button';
            dot.setAttribute('aria-label', 'Ver plano ' + (i + 1));
            dot.addEventListener('click', () => goToCard(i));
            carouselDots.append(dot);
        }
        syncCarousel();
    };
    carouselPrev.addEventListener('click', () => goToCard(carouselIndex() - 1));
    carouselNext.addEventListener('click', () => goToCard(carouselIndex() + 1));
    container.addEventListener('scroll', () => {
        if (!carouselVisible || carouselUpdateFrame) return;
        carouselUpdateFrame = requestAnimationFrame(() => { carouselUpdateFrame = 0; syncCarousel(); });
    }, { passive: true });
    window.addEventListener('resize', () => { if (carouselVisible) syncCarousel(); });
    function render(plans) {
        const visible = plans.filter(p => p.preco_centavos === 0 || p.periodicidade === period);
        const cards = visible.map(plan => {
            const offer=promotion(plan);
            const priceCents=offer?.preco_centavos ?? plan.preco_centavos;
            const card = element('article', 'pricing-card public-plan');
            const heading = element('div', 'public-plan-heading');
            const badges = element('div', 'public-plan-badges');
            if (plan.recomendado === true && plan.periodicidade === period) { card.classList.add('public-plan--recommended'); badges.append(element('span', 'plan-recommended-badge', 'Recomendado')); }
            if(offer)badges.append(element('span','plan-promotion-badge','Em promoção'));
            badges.append(element('span', 'plan-cycle', plan.preco_centavos === 0 ? 'Plano gratuito' : plan.periodicidade === 'anual' ? 'Cobrança anual' : 'Cobrança mensal'));
            heading.append(badges);
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
            const action = element('a', 'btn-cta primary', plan.preco_centavos === 0 ? 'Começar grátis' : 'Escolher plano');
            const cadastro = new URL('https://controlfinance.sysbn.com.br/authentication/register');
            cadastro.searchParams.set('plano', String(plan.id));
            action.href = cadastro.href;
            action.setAttribute('aria-label', 'Escolher o plano ' + plan.nome + ' no cadastro do ControlFinance');
            const footer = element('div', 'plan-card-footer');
            footer.append(action, element('small', '', plan.preco_centavos === 0 ? 'Confirme o plano ao criar sua conta.' : 'Plano aplicado no cadastro, válido até o vencimento da cobrança inicial.'));
            card.append(footer);
            const select = element('label', 'plan-compare-select');
            const checkbox = element('input', '');
            checkbox.type = 'checkbox';
            checkbox.dataset.comparePlan = String(plan.id);
            checkbox.setAttribute('aria-label', 'Selecionar ' + plan.nome + ' para comparação');
            checkbox.checked = selectedPlanIds.has(plan.id);
            checkbox.addEventListener('change', () => {
                if (checkbox.checked && selectedPlanIds.size < 3) selectedPlanIds.add(plan.id);
                else if (!checkbox.checked) selectedPlanIds.delete(plan.id);
                syncSelection();
            });
            select.append(checkbox, element('span', '', 'Adicionar à comparação'));
            card.append(select);
            return card;
        });
        container.replaceChildren(...cards);
        resetCarousel(visible.length);
        for (const id of [...selectedPlanIds]) if (!visible.some(p => p.id === id)) selectedPlanIds.delete(id);
        syncSelection();
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
            resetCarousel(0);
            closeComparison();
            selectedPlanIds.clear();
            compareToolbar.hidden = true;
            comparisonContent.replaceChildren();
            status.textContent = 'Não foi possível consultar os planos agora. Tente novamente ou confira as opções no ControlFinance.';
            retry.hidden = false;
        } finally {
            clearTimeout(timeout);
            loading = false;
            periodButtons.forEach(b => b.disabled = false);
            container.setAttribute('aria-busy', 'false');
        }
    }
    periodButtons.forEach(button => button.addEventListener('click', () => {
        if (period === button.dataset.period) return;
        closeComparison();
        selectedPlanIds.clear();
        period = button.dataset.period;
        render(catalog);
    }));
    differencesOnly.addEventListener('change', () => { if (!comparison.hidden) renderComparison(visiblePlans()); });
    retry.addEventListener('click', load);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && loadedAt && Date.now() - loadedAt >= 300000) load();
    });
    setInterval(() => {if(document.hidden)return;if(loadedAt && Date.now()-loadedAt>=300000)load();else if(catalog.length)render(catalog);},30000);
    load();
});


