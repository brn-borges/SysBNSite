(() => {
  'use strict';
  const frontend = document.getElementById('frontend-status');
  const api = document.getElementById('api-status');
  const refresh = document.getElementById('service-status-refresh');
  const updated = document.getElementById('service-status-updated');
  if (!frontend || !api || !refresh || !updated) return;
  const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 15000;
  const labels = { checking: 'Verificando…', up: 'Disponível', down: 'Indisponível', unknown: 'Não foi possível verificar' };
  let busy = false;
  function render(element, state) { element.dataset.state = state; element.textContent = labels[state]; }
  function probeFrontend() {
    return new Promise(resolve => {
      const image = new Image();
      const finish = state => { clearTimeout(timeout); image.onload = image.onerror = null; resolve(state); };
      const timeout = setTimeout(() => { finish('unknown'); image.src = ''; }, REQUEST_TIMEOUT_MS);
      image.onload = () => finish(image.naturalWidth > 0 ? 'up' : 'unknown');
      image.onerror = () => finish('unknown');
      image.src = `https://controlfinance.sysbn.com.br/assets/images/logos/logo-icon.png?status=${Date.now()}`;
    });
  }
  async function probeApi() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`https://cfapi.sysbn.com.br/health?check=${Date.now()}`, { signal: controller.signal, cache: 'no-store', credentials: 'omit' });
      if (response.status >= 500) return 'down';
      if (!response.ok) return 'unknown';
      const health = await response.json();
      if (health?.status === 'ok' && health?.services?.database === 'up') return 'up';
      if (health?.status === 'error' || health?.services?.database === 'down') return 'down';
      return 'unknown';
    } catch (_) { return 'unknown'; }
    finally { clearTimeout(timeout); }
  }
  async function check() {
    if (busy || document.hidden) return;
    busy = true; refresh.disabled = true;
    render(frontend, 'checking'); render(api, 'checking');
    if (navigator.onLine === false) {
      render(frontend, 'unknown'); render(api, 'unknown');
      updated.textContent = 'Sem conexão com a internet. Reconecte para verificar os serviços.';
    } else {
      await Promise.all([
        probeFrontend().then(state => render(frontend, state)),
        probeApi().then(state => render(api, state)),
      ]);
      updated.textContent = `Última verificação: ${new Date().toLocaleString('pt-BR')}.`;
    }
    busy = false; refresh.disabled = false;
  }
  refresh.addEventListener('click', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) check(); });
  window.addEventListener('online', check);
  window.addEventListener('offline', check);
  setInterval(check, REFRESH_INTERVAL_MS);
  check();
})();
