document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('nav-open');
    });

    // Fechar o menu ao clicar em um link (opcional, mas melhora a experiência)
    nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('nav-open')) {
                nav.classList.remove('nav-open');
            }
        });
    });
});