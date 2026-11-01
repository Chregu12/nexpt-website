(() => {
  const dialog = document.querySelector('#site-search');
  if (!dialog) return;
  const input = dialog.querySelector('input');
  const results = dialog.querySelector('#search-results');
  const status = dialog.querySelector('[data-search-status]');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss').toLocaleLowerCase('de');
  let pages, loading, opener;
  const render = () => {
    if (!pages) return;
    const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    const matches = pages.map(page => {
      const title = normalize(page.title), text = normalize(page.text);
      return { ...page, score: terms.every(term => (title + ' ' + text).includes(term)) ? terms.reduce((score, term) => score + (title.includes(term) ? 3 : 1), 0) : -1 };
    }).filter(page => page.score >= 0).sort((a, b) => b.score - a.score);
    results.replaceChildren();
    for (const page of matches) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      const title = document.createElement('strong');
      const excerpt = document.createElement('span');
      link.href = page.url;
      title.textContent = page.title;
      const matchStart = terms.length ? Math.max(0, normalize(page.text).indexOf(terms[0]) - 45) : 0;
      const position = matchStart ? page.text.lastIndexOf(' ', matchStart) + 1 : 0;
      excerpt.textContent = (position ? '… ' : '') + page.text.slice(position, position + 155) + ' …';
      link.append(title, excerpt); item.append(link); results.append(item);
    }
    status.textContent = !terms.length ? 'Alle Themen auf einen Blick' : matches.length ? `${matches.length} ${matches.length === 1 ? 'Seite gefunden' : 'Seiten gefunden'}` : 'Keine passende Seite gefunden. Versuche einen anderen Begriff.';
  };
  document.querySelectorAll('[data-search-open]').forEach(button => button.addEventListener('click', async () => {
    opener = button;
    document.dispatchEvent(new Event('nexpt:searchopen'));
    document.dispatchEvent(new Event('nexpt:modalopen'));
    dialog.showModal(); input.focus();
    if (!pages) {
      status.textContent = 'Suche wird geladen …';
      try {
        loading ||= fetch(dialog.dataset.searchIndex).then(response => { if (!response.ok) throw new Error('Search unavailable'); return response.json(); });
        pages = await loading;
      } catch {
        loading = null;
        status.textContent = 'Die Suche ist gerade nicht verfügbar. Nutze diese direkten Einstiege.';
        return;
      }
    }
    render();
  }));
  input.addEventListener('input', render);
  input.addEventListener('keydown', event => {
    if (event.key === 'Enter') { event.preventDefault(); results.querySelector('a')?.click(); }
  });
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  let backdropDown = false;
  const outside = event => {
    const box = dialog.getBoundingClientRect();
    return event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  };
  dialog.addEventListener('pointerdown', event => { backdropDown = event.target === dialog && outside(event); });
  dialog.addEventListener('click', event => { if (backdropDown && event.target === dialog && outside(event)) dialog.close(); backdropDown = false; });
})();
