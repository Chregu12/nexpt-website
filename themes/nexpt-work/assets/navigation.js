(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  header.classList.add('nav-ready');
  const nav = header.querySelector('.nav');
  const toggle = header.querySelector('.mobile-nav-toggle');
  const menus = [...nav.querySelectorAll('details')];
  const closeMenus = except => menus.forEach(menu => { if (menu !== except) menu.open = false; });
  const closeMobile = () => { header.removeAttribute('data-nav-open'); toggle.setAttribute('aria-expanded', 'false'); };
  menus.forEach(menu => menu.addEventListener('toggle', () => { if (menu.open) closeMenus(menu); }));
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    if (open) header.setAttribute('data-nav-open', 'true'); else { closeMobile(); closeMenus(); }
  });
  nav.querySelectorAll('a').forEach(link => {
    const url = new URL(link.href);
    if (!url.hash && url.pathname.replace(/\/$/, '') === location.pathname.replace(/\/$/, '')) {
      link.setAttribute('aria-current', 'page');
      link.closest('details')?.classList.add('is-current');
    }
    link.addEventListener('click', () => { closeMenus(); closeMobile(); });
  });
  header.addEventListener('focusout', event => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) { closeMenus(); closeMobile(); }
  });
  document.addEventListener('click', event => { if (!header.contains(event.target)) { closeMenus(); closeMobile(); } });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const open = menus.find(menu => menu.open);
    if (open) { closeMenus(); open.querySelector('summary').focus(); }
    else if (toggle.getAttribute('aria-expanded') === 'true') { closeMobile(); toggle.focus(); }
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', () => { closeMenus(); closeMobile(); });

  // Product context changes the information card; opening the dropdown stays click/keyboard controlled.
  const productsMenu = nav.querySelector('.products-disclosure');
  const feature = productsMenu?.querySelector('[data-product-feature]');
  const productLinks = productsMenu ? [...productsMenu.querySelectorAll('.nav-product[data-menu-product]')] : [];
  if (feature && productLinks.length) {
    const descriptions = {
      work: {
        product: 'Nexpt Work',
        title: 'Arbeit im gemeinsamen Zusammenhang',
        description: 'Eigene Begriffe und passende Abläufe für jedes Team. Das gemeinsame Arbeitsmodell soll Ziele, Zuständigkeiten und Fortschritt verständlich verbinden.',
        target: 'funktionen/'
      },
      hr: {
        product: 'Nexpt HR',
        title: 'Personalprozesse aus zwei Perspektiven',
        description: 'Ein Portal für HR, ein persönlicher Bereich für Mitarbeitende. Organisation, Freigaben und Anliegen behalten ihren nachvollziehbaren Ablauf.',
        target: 'hr/#hr-portale'
      },
      outline: {
        product: 'Nexpt Outline',
        title: 'Wissen, das mit der Arbeit verbunden bleibt',
        description: 'Dokumente in Sammlungen ordnen, gemeinsam pflegen und mit Arbeit verknüpfen. So bleiben Entscheidungen und Anleitungen im passenden Kontext.',
        target: 'outline/#outline-views'
      }
    };
    const workLink = productLinks.find(link => link.dataset.menuProduct === 'work');
    const base = workLink?.href || feature.href;
    const title = feature.querySelector('[data-feature-title]');
    const product = feature.querySelector('[data-feature-product]');
    const description = feature.querySelector('[data-feature-description]');
    const symbol = feature.querySelector('[data-feature-symbol]');
    const announcement = productsMenu.querySelector('[data-feature-announcement]');
    let activeProduct;
    const selectProduct = (key, announce = false) => {
      const context = descriptions[key];
      if (!context || key === activeProduct) return;
      activeProduct = key;
      feature.dataset.product = key;
      feature.href = new URL(context.target, base).href;
      title.textContent = context.title;
      product.textContent = context.product;
      description.textContent = context.description;
      symbol.className = 'product-symbol mega-feature-symbol symbol-' + key;
      feature.querySelectorAll('[data-context-icon]').forEach(icon => { icon.toggleAttribute('hidden', icon.dataset.contextIcon !== key); });
      productLinks.forEach(link => { link.dataset.contextSelected = String(link.dataset.menuProduct === key); });
      if (announce && announcement) announcement.textContent = context.product + ': ' + context.title + '.';
    };
    const selectFromEvent = event => {
      const option = event.target.closest('[data-menu-product]');
      if (option && productsMenu.contains(option)) selectProduct(option.dataset.menuProduct, event.type === 'focusin');
    };
    productsMenu.addEventListener('pointerover', selectFromEvent);
    productsMenu.addEventListener('focusin', selectFromEvent);
    productsMenu.addEventListener('click', selectFromEvent);
    const routeProduct = productLinks
      .map(link => ({ key: link.dataset.menuProduct, path: new URL(link.href).pathname.replace(/\/$/, '') }))
      .filter(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
      .sort((a, b) => b.path.length - a.path.length)[0]?.key || 'work';
    selectProduct(routeProduct);
  }

})();
