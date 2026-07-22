(function () {
  let searchIndex = [];
  let searchInput, searchForm, resultsBox;
  let ready = false;

  const observer = new MutationObserver(tryInit);
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener('DOMContentLoaded', tryInit);
  document.addEventListener('headerLoaded', tryInit);

  let attempts = 0;
  const pollTimer = setInterval(() => {
    attempts++;
    tryInit();
    if (ready || attempts > 100) clearInterval(pollTimer);
  }, 100);

  function tryInit() {
    if (ready) return;
    const input = document.getElementById('search');
    if (!input || !window.PROOTArticlePage) return;

    ready = true;
    observer.disconnect();
    initSearch(input);
  }

  function initSearch(input) {
    searchInput = input;
    searchForm = document.getElementById('searchBox');
    resultsBox = document.getElementById('searchResults');

    buildIndex();

    searchForm.addEventListener('submit', e => e.preventDefault());

    let debounceTimer;
    searchInput.addEventListener('input', e => {
      clearTimeout(debounceTimer);
      const query = e.target.value;
      debounceTimer = setTimeout(() => {
        if (!query.trim()) {
          resultsBox.classList.add('hidden');
          return;
        }
        renderResults(search(query), query);
      }, 200);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim() && resultsBox.innerHTML) {
        resultsBox.classList.remove('hidden');
      }
    });

    document.addEventListener('click', e => {
      if (!searchForm.contains(e.target)) {
        resultsBox.classList.add('hidden');
      }
    });
  }

  function buildIndex() {
    const state = window.PROOTArticlePage.getState();
    const content = state.content || [];
    const index = [];
    let currentSection = null;

    for (const block of content) {
      if (block.nomeS) currentSection = block.nomeS;

      const contentName = block.nomeSS || block.nomeS;
      const isSubsection = Boolean(block.nomeSS);
      const displayLabel = isSubsection ? `${currentSection} / ${contentName}` : contentName;

      const items = Array.isArray(block.conteudo) ? block.conteudo : [block.conteudo];

      for (const item of items) {
        const text = extractText(item);
        if (!text) continue;
        const plain = stripHtml(text);
        index.push({
          section: currentSection,
          subsection: block.nomeSS || null,
          contentName,
          displayLabel,
          text: plain,
          textLower: plain.toLowerCase()
        });
      }
    }
    searchIndex = index;
  }

  function extractText(item) {
    if (!item) return '';
    switch (item.tipo) {
      case 'p': return item.texto;
      case 'callout': return `${item.titulo || item['titulo:'] || ''} ${item.texto}`;
      case 'code': return `${item.titulo} ${item.texto}`;
      case 'tabelaHeaderHor':
      case 'tabelaHeaderVert':
        return item.itens.flat().join(' ');
      default: return item.texto || '';
    }
  }

  function stripHtml(str) {
    return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  function search(query) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const bestByEntry = new Map();

    for (const entry of searchIndex) {
      const score = scoreMatch(entry, q);
      if (score <= 0) continue;

      const existing = bestByEntry.get(entry.contentName);
      if (!existing || score > existing.score) {
        bestByEntry.set(entry.contentName, { ...entry, score });
      }
    }

    return Array.from(bestByEntry.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }

  function scoreMatch(entry, q) {
    let score = 0;
    if (entry.subsection && entry.subsection.toLowerCase().includes(q)) score += 10;
    if (entry.section && entry.section.toLowerCase().includes(q)) score += 8;
    if (entry.textLower.includes(q)) score += 3;
    return score;
  }

  function highlight(text, query) {
    const q = query.trim();
    if (!q) return text;
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'ig'), '<mark>$1</mark>');
  }

  function excerpt(text, query, radius = 60) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text.slice(0, radius * 2) + '…';
    const start = Math.max(0, idx - radius);
    const end = Math.min(text.length, idx + query.length + radius);
    return (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  function renderResults(results, query) {
    resultsBox.innerHTML = '';

    if (results.length === 0) {
      resultsBox.innerHTML = '<div class="searchNoResults">Nenhum resultado encontrado</div>';
      resultsBox.classList.remove('hidden');
      return;
    }

    for (const r of results) {
      const snippet = excerpt(r.text, query);

      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'searchResultItem';
      el.innerHTML = `
        <span class="searchResultLabel">${r.displayLabel}</span>
        <span class="searchResultText">${highlight(snippet, query)}</span>
      `;
      el.addEventListener('click', () => {
        window.PROOTArticlePage.renderSelection(r.contentName, r.displayLabel);
        window.PROOTHamburgerMenu?.close?.();
        resultsBox.classList.add('hidden');
        searchInput.value = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
      resultsBox.appendChild(el);
    }

    resultsBox.classList.remove('hidden');
  }
})();