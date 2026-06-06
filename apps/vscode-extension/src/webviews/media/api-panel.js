// blockus blocks panel — webview script.
// Talks to ApiDataProvider (api-data-panel.ts) over the standard VS Code
// webview message channel.
(function () {
  const vscode = acquireVsCodeApi();

  const BASE_URL = 'https://blockus.lndevui.com';

  /** @type {{unlocked:boolean,total:number,blocks:any[]}} */
  let state = { unlocked: false, total: 0, blocks: [] };
  let query = '';
  let activeCategory = 'all';

  // --- elements --------------------------------------------------------------
  const el = (id) => document.getElementById(id);
  const loadingState = el('loading-state');
  const errorState = el('error-state');
  const errorMessage = el('error-message');
  const emptyState = el('empty-state');
  const grid = el('blocks-grid');
  const categoriesEl = el('categories');
  const apikeyStatus = el('apikey-status');

  // --- helpers ---------------------------------------------------------------
  function show(node, visible) {
    if (node) node.style.display = visible ? '' : 'none';
  }

  function setLoading() {
    show(loadingState, true);
    show(errorState, false);
    show(emptyState, false);
    show(grid, false);
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function uniqueCategories() {
    return Array.from(new Set(state.blocks.map((b) => b.category))).sort();
  }

  function filteredBlocks() {
    const q = query.trim().toLowerCase();
    return state.blocks.filter((b) => {
      if (activeCategory !== 'all' && b.category !== activeCategory) return false;
      if (!q) return true;
      const hay = [b.name, b.category, ...(b.tags || [])].join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  // --- rendering -------------------------------------------------------------
  function renderCategories() {
    const cats = ['all', ...uniqueCategories()];
    categoriesEl.innerHTML = cats
      .map((cat) => {
        const label = cat === 'all' ? 'All' : cat.replace(/-/g, ' ');
        const cls = cat === activeCategory ? 'cat active' : 'cat';
        return `<button class="${cls}" data-cat="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
      })
      .join('');
    categoriesEl.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeCategory = btn.getAttribute('data-cat');
        renderCategories();
        renderBlocks();
      });
    });
  }

  function blockCard(b) {
    const locked = b.isPro && !b.installable;
    const preview = b.previewImage || `${BASE_URL}/preview/${b.id}`;
    const proBadge = b.isPro
      ? `<span class="badge ${locked ? 'locked' : ''}">${locked ? '🔒 ' : ''}Pro</span>`
      : '';
    const action = locked
      ? `<button class="btn locked" data-action="unlock" title="Add your API key to unlock">🔒 Unlock Pro</button>`
      : `<button class="btn install" data-action="install" data-id="${escapeHtml(b.id)}">Install</button>`;

    return `
      <div class="card">
        <button class="preview" data-action="preview" data-id="${escapeHtml(b.id)}" title="Open preview">
          <img loading="lazy" src="${escapeHtml(preview)}" alt="${escapeHtml(b.name)}" onerror="this.style.display='none'" />
          ${proBadge}
        </button>
        <div class="card-body">
          <div class="card-meta">
            <div class="card-name">${escapeHtml(b.name)}</div>
            <div class="card-cat">${escapeHtml(b.category)}</div>
          </div>
        </div>
        <div class="card-actions">
          ${action}
          <button class="btn ghost" data-action="agent" data-id="${escapeHtml(b.id)}" data-name="${escapeHtml(b.name)}" title="Send to IDE agent">Ask agent</button>
        </div>
      </div>`;
  }

  function renderBlocks() {
    const blocks = filteredBlocks();
    apikeyStatus.textContent = state.unlocked ? 'Pro unlocked' : 'Free tier';
    apikeyStatus.className = state.unlocked
      ? 'apikey-status unlocked'
      : 'apikey-status';

    show(loadingState, false);
    show(errorState, false);

    if (blocks.length === 0) {
      show(emptyState, true);
      show(grid, false);
      return;
    }

    show(emptyState, false);
    show(grid, true);
    grid.innerHTML = blocks.map(blockCard).join('');

    grid.querySelectorAll('[data-action]').forEach((node) => {
      node.addEventListener('click', () => {
        const action = node.getAttribute('data-action');
        const id = node.getAttribute('data-id');
        if (action === 'install') {
          vscode.postMessage({ type: 'installBlock', id });
        } else if (action === 'preview') {
          vscode.postMessage({ type: 'previewBlock', id });
        } else if (action === 'agent') {
          vscode.postMessage({
            type: 'sendToAgent',
            id,
            name: node.getAttribute('data-name'),
          });
        } else if (action === 'unlock') {
          el('apikey-input').focus();
        }
      });
    });
  }

  function renderError(message) {
    show(loadingState, false);
    show(grid, false);
    show(emptyState, false);
    show(errorState, true);
    errorMessage.textContent = message || 'Something went wrong.';
  }

  // --- events ----------------------------------------------------------------
  el('refresh-btn').addEventListener('click', () => {
    setLoading();
    vscode.postMessage({ type: 'refresh' });
  });

  el('retry-btn').addEventListener('click', () => {
    setLoading();
    vscode.postMessage({ type: 'refresh' });
  });

  el('get-pro-link').addEventListener('click', (e) => {
    e.preventDefault();
    vscode.postMessage({ type: 'openExternal', url: `${BASE_URL}/pricing` });
  });

  el('apikey-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const apiKey = el('apikey-input').value.trim();
    setLoading();
    vscode.postMessage({ type: 'saveApiKey', apiKey });
  });

  let searchTimer = null;
  el('search-input').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    const value = e.target.value;
    searchTimer = setTimeout(() => {
      query = value;
      renderBlocks();
    }, 250);
  });

  // --- message handling ------------------------------------------------------
  window.addEventListener('message', (event) => {
    const data = event.data;
    switch (data.type) {
      case 'loading':
        if (data.loading) setLoading();
        break;
      case 'catalog':
        state = {
          unlocked: !!data.unlocked,
          total: data.total || 0,
          blocks: Array.isArray(data.blocks) ? data.blocks : [],
        };
        renderCategories();
        renderBlocks();
        break;
      case 'error':
        renderError(data.message);
        break;
    }
  });

  // Kick things off.
  setLoading();
  vscode.postMessage({ type: 'requestInitialData' });
})();
