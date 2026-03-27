document.addEventListener('DOMContentLoaded', () => {
    
    // Inicializa os ícones do Lucide
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // --- LÓGICA DE TEMA (CLARO/ESCURO) ---
    const themeToggle = document.getElementById('theme-toggle'); // Você deve adicionar um botão com este ID no HTML
    const currentTheme = localStorage.getItem('theme');

    // Detecta preferência do sistema se não houver escolha salva
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = currentTheme || (systemPrefersDark ? 'dark' : 'light');

    // Função para atualizar o ícone do botão
    const updateThemeIcon = (theme) => {
        if (!themeToggle) return;
        // Se o tema for escuro, mostramos o sol (para mudar para claro)
        // Se o tema for claro, mostramos a lua (para mudar para escuro)
        const iconName = theme === 'dark' ? 'sun' : 'moon';
        const tooltipText = theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro';
        themeToggle.innerHTML = `<i data-lucide="${iconName}"></i>`;
        themeToggle.setAttribute('data-tooltip', tooltipText);
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    // Aplica o tema inicial e o ícone sem transição para evitar o "flash" no load
    document.documentElement.classList.add('no-transition');
    document.documentElement.setAttribute('data-theme', initialTheme);
    updateThemeIcon(initialTheme);
    
    // Força um reflow e remove a classe no próximo frame
    requestAnimationFrame(() => {
        document.documentElement.classList.remove('no-transition');
    });

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            let newTheme = theme === 'dark' ? 'light' : 'dark';
            
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeIcon(newTheme);
        });
    }

    // --- LÓGICA DO MENU HAMBURGER (CORRIGIDA) ---
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    const updateMenuIcon = (isOpen) => {
        if (!menuToggle) return;
        const iconName = isOpen ? 'x' : 'menu';
        menuToggle.innerHTML = `<i data-lucide="${iconName}"></i>`;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    menuToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');
        document.body.classList.toggle('menu-active', isOpen);
        updateMenuIcon(isOpen);
    });

    // Fechar o menu ao clicar em um link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('nav-open')) {
                nav.classList.remove('nav-open');
                document.body.classList.remove('menu-active');
                updateMenuIcon(false);
            }
        });
    });

    // --- LÓGICA DO BANNER DE COOKIES ---
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptButton = document.getElementById('aceitar-cookies');
    const cookieName = 'sysbn_cookie_accepted';

    // 1. Verifica se o cookie já foi aceito
    if (localStorage.getItem(cookieName) === 'true') {
        cookieBanner.style.display = 'none';
    } else {
        cookieBanner.style.display = 'flex'; // Exibe o banner
    }

    // 2. Adiciona o evento de clique ao botão
    acceptButton.addEventListener('click', () => {
        localStorage.setItem(cookieName, 'true');
        cookieBanner.style.opacity = '0';
        setTimeout(() => {
            cookieBanner.style.display = 'none';
        }, 500);
    });

    // --- LÓGICA DE REVELAÇÃO AO ROLAR (SCROLL REVEAL) ---
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Uma vez revelado, paramos de observar este elemento
                observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.15 // O elemento aparece quando 15% dele estiver visível
    });

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));

    // --- LÓGICA DA BARRA DE PROGRESSO ---
    const progressBar = document.getElementById('reading-progress');

    window.addEventListener('scroll', () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (progressBar) {
            progressBar.style.width = scrolled + "%";
        }
    });
});