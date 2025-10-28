document.addEventListener('DOMContentLoaded', () => {
    
    // --- LÓGICA DO MENU HAMBURGER (CORRIGIDA) ---
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('nav-open');
    });

    // Fechar o menu ao clicar em um link
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('nav-open')) {
                nav.classList.remove('nav-open');
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
});