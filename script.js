// --- LÓGICA DO BANNER DE COOKIES ---
document.addEventListener('DOMContentLoaded', () => {
    // Código existente do menu toggle...

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
        // Salva o estado de aceitação no armazenamento local
        localStorage.setItem(cookieName, 'true');
        // Oculta o banner com um fade out suave (opcional)
        cookieBanner.style.opacity = '0';
        setTimeout(() => {
            cookieBanner.style.display = 'none';
        }, 500); // Aguarda 500ms para o fade
    });
});