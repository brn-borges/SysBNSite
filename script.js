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
    const initialTheme = ['dark', 'light'].includes(currentTheme) ? currentTheme : (systemPrefersDark ? 'dark' : 'light');

    // Função para atualizar o ícone do botão
    const updateThemeIcon = (theme) => {
        if (!themeToggle) return;
        // Se o tema for escuro, mostramos o sol (para mudar para claro)
        // Se o tema for claro, mostramos a lua (para mudar para escuro)
        const iconName = theme === 'dark' ? 'sun' : 'moon';
        const tooltipText = theme === 'dark' ? 'Ativar Modo Claro' : 'Ativar Modo Escuro';
        themeToggle.innerHTML = `<i data-lucide="${iconName}"></i>`;
        themeToggle.setAttribute('data-tooltip', tooltipText);
        themeToggle.setAttribute('aria-label', tooltipText);
        themeToggle.setAttribute('title', tooltipText);
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
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    };

    menuToggle?.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('nav-open');
        document.body.classList.toggle('menu-active', isOpen);
        updateMenuIcon(isOpen);
    });

    // Fechar o menu ao clicar em um link
    nav?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('nav-open')) {
                nav.classList.remove('nav-open');
                document.body.classList.remove('menu-active');
                updateMenuIcon(false);
            }
        });
    });

    const closeMenu = () => {
        nav?.classList.remove('nav-open');
        document.body.classList.remove('menu-active');
        updateMenuIcon(false);
    };
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && nav?.classList.contains('nav-open')) {
            closeMenu();
            menuToggle?.focus();
        }
    });
    document.addEventListener('click', event => {
        if (nav?.classList.contains('nav-open') && !event.composedPath().includes(nav) && !event.composedPath().includes(menuToggle)) closeMenu();
    });
    window.addEventListener('resize', () => { if (innerWidth > 900) closeMenu(); });

    // --- LÓGICA DO BANNER DE COOKIES ---
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptButton = document.getElementById('aceitar-cookies');
    const cookieName = 'sysbn_cookie_accepted';

    // 1. Verifica se o cookie já foi aceito
    if (localStorage.getItem(cookieName) === 'true') {
        cookieBanner.style.display = 'none';
        document.body.classList.add('cookies-accepted');
    } else {
        cookieBanner.style.display = 'flex'; // Exibe o banner
        document.body.classList.remove('cookies-accepted');
    }

    // 2. Adiciona o evento de clique ao botão
    acceptButton.addEventListener('click', () => {
        localStorage.setItem(cookieName, 'true');
        document.body.classList.add('cookies-accepted');
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
        const scrolled = height > 0 ? Math.min(100, (winScroll / height) * 100) : 0;
        if (progressBar) {
            progressBar.style.width = scrolled + "%";
        }
    });

    // --- LÓGICA CONDICIONAL DO CAMPO DE UPLOAD ---
    const tipoSelect = document.getElementById('tipo');
    const uploadGroup = document.getElementById('upload-group');
    const fileInput = document.getElementById('screenshot');
    const fileNameDisplay = document.getElementById('file-name-display');
    const fileNameText = fileNameDisplay ? fileNameDisplay.querySelector('.file-name-text') : null;
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removePreviewBtn = document.getElementById('remove-preview');

    const resetFileDisplay = () => {
        if (fileNameDisplay) fileNameDisplay.style.display = 'none';
        if (fileNameText) fileNameText.textContent = '';
        if (imagePreviewContainer) imagePreviewContainer.style.display = 'none';
        if (imagePreview) imagePreview.src = '';
        if (fileInput) fileInput.value = '';
    };

    if (fileInput && fileNameDisplay && fileNameText) {
        fileInput.addEventListener('change', function() {
            if (this.files && this.files.length > 0) {
                const file = this.files[0];
                const allowedTypes = ['image/jpeg', 'image/png'];

                if (!allowedTypes.includes(file.type)) {
                    showToast('Formato de arquivo inválido. Apenas JPG e PNG são permitidos.', true);
                    resetFileDisplay();
                    return;
                }

                fileNameText.textContent = `Arquivo selecionado: ${file.name}`;
                fileNameDisplay.style.display = 'flex';

                // Lógica de Pré-visualização
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(this.files[0]);

                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                resetFileDisplay();
            }
        });
    }

    if (removePreviewBtn) {
        removePreviewBtn.addEventListener('click', (e) => {
            e.preventDefault();
            resetFileDisplay();
        });
    }

    if (tipoSelect && uploadGroup) {
        tipoSelect.addEventListener('change', function() {
            if (this.value === 'bug') {
                uploadGroup.classList.add('field-visible');
            } else {
                uploadGroup.classList.remove('field-visible');
                resetFileDisplay();
            }
        });
    }

    // --- LÓGICA DE CARREGAMENTO NO ENVIO ---
    const contactForm = document.querySelector('.contact-form');
    const submitBtn = document.getElementById('submit-btn');

    // Função para mostrar a notificação (Toast)
    window.showToast = (message, isError = false) => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        if (isError) toast.style.borderLeftColor = '#ef4444'; // Vermelho para erro
        toast.setAttribute('role', isError ? 'alert' : 'status');
        const icon = document.createElement('i');
        icon.setAttribute('data-lucide', isError ? 'alert-circle' : 'check-circle');
        icon.setAttribute('aria-hidden', 'true');
        icon.style.color = isError ? '#ef4444' : 'var(--color-primary)';
        const text = document.createElement('span');
        text.textContent = message;
        toast.append(icon, text);

        container.appendChild(toast);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        // Remove o toast após 4 segundos
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 500);
        }, 4000);
    };

    if (contactForm && submitBtn) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Impede o recarregamento da página para mostrar o toast
            
            // Adiciona a classe que dispara as animações CSS de validação
            contactForm.classList.add('was-validated');

            // Verifica se o formulário é válido segundo as regras do HTML5
            if (!contactForm.checkValidity()) {
                e.stopPropagation();
                
                // Adiciona a animação de shake
                contactForm.classList.add('shake');
                
                // Remove a classe após a animação terminar para poder disparar novamente
                contactForm.addEventListener('animationend', () => {
                    contactForm.classList.remove('shake');
                }, { once: true });

                showToast('Por favor, corrija os campos marcados em vermelho.', true);
                return;
            }

            submitBtn.classList.add('loading');
            contactForm.setAttribute('aria-busy', 'true');

            // Validação de tamanho de arquivo (Limite: 5MB)
            const fileInput = document.getElementById('screenshot');
            if (fileInput && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                const allowedTypes = ['image/jpeg', 'image/png'];

                if (!allowedTypes.includes(file.type)) {
                    showToast('Apenas arquivos JPG e PNG são permitidos.', true);
                    submitBtn.classList.remove('loading');
                    contactForm.setAttribute('aria-busy', 'false');
                    return;
                }

                const maxSize = 5 * 1024 * 1024; // 5MB em bytes
                if (file.size > maxSize) {
                    showToast('O arquivo é muito grande. O limite máximo é de 5MB.', true);
                    submitBtn.classList.remove('loading');
                    contactForm.setAttribute('aria-busy', 'false');
                    return; // Interrompe o envio
                }
            }

            const formData = new FormData(contactForm);
            
            // Adiciona um assunto amigável usando o prefixo fi-subject do Forminit
            if (!formData.has('fi-subject')) {
                formData.append('fi-subject', `Novo contato: ${formData.get('fi-select-assunto')} - ${formData.get('fi-sender-fullName')}`);
            }

            // Desativa todos os campos para evitar edições ou cliques duplos durante o envio
            const formFields = contactForm.querySelectorAll('input, select, textarea, button');
            formFields.forEach(field => field.disabled = true);

            // Lógica de Upload com XMLHttpRequest para monitorar progresso
            const xhr = new XMLHttpRequest();
            const progressContainer = document.getElementById('upload-progress-container');
            const progressFill = document.getElementById('upload-progress-fill');

            if (progressContainer) {
                progressContainer.style.display = 'block';
                if (progressFill) progressFill.style.width = '0%';
            }

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    if (progressFill) progressFill.style.width = percentComplete + '%';
                }
            });

            xhr.onload = () => {
                submitBtn.classList.remove('loading');
                    contactForm.setAttribute('aria-busy', 'false');
                formFields.forEach(field => field.disabled = false); // Reativa os campos
                if (progressContainer) progressContainer.style.display = 'none';

                if (xhr.status >= 200 && xhr.status < 300) {
                    showToast('Mensagem enviada com sucesso! Entraremos em contato em breve.');
                    contactForm.reset(); // Limpa o formulário
                    contactForm.classList.remove('was-validated'); // Remove o estado de validação visual
                    resetFileDisplay();
                    
                    // Redireciona para a página de agradecimento após 2 segundos
                    setTimeout(() => {
                        const redirectUrl = contactForm.querySelector('input[name="fi-redirect-url"]').value;
                        window.location.href = redirectUrl;
                    }, 2000);

                    if (uploadGroup) {
                        uploadGroup.classList.remove('field-visible');
                        uploadGroup.style.display = 'none';
                    }
                } else {
                    let errorMsg = 'Erro ao processar envio.';
                    try {
                        const data = JSON.parse(xhr.responseText);
                        errorMsg = data.errors ? data.errors.map(err => err.message).join(', ') : (data.message || errorMsg);
                    } catch (parseError) {
                        errorMsg = xhr.responseText || `Erro ${xhr.status}`;
                    }
                    showToast('Ops! ' + errorMsg, true);
                }
            };

            xhr.onerror = () => {
                submitBtn.classList.remove('loading');
                    contactForm.setAttribute('aria-busy', 'false');
                formFields.forEach(field => field.disabled = false); // Reativa os campos
                if (progressContainer) progressContainer.style.display = 'none';
                showToast('Erro de conexão. Verifique sua internet.', true);
            };

            xhr.open('POST', contactForm.action);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.send(formData);
        });
    }
});
