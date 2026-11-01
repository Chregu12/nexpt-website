(() => {
  document.querySelectorAll('[data-workflow-showcase]').forEach(showcase => {
    const tabs = [...showcase.querySelectorAll('[data-workflow-tab]')];
    const panels = [...showcase.querySelectorAll('[data-workflow-panel]')];
    const captionTitle = showcase.querySelector('[data-workflow-caption-title]');
    const captionCopy = showcase.querySelector('[data-workflow-caption-copy]');
    if (!tabs.length || !panels.length || !captionTitle || !captionCopy) return;

    const selectTab = (tab, moveFocus = false) => {
      const key = tab.dataset.workflowTab;
      const panel = panels.find(item => item.dataset.workflowPanel === key);
      if (!panel) return;
      tabs.forEach(item => {
        const active = item === tab;
        item.setAttribute('aria-selected', String(active));
        item.tabIndex = active ? 0 : -1;
      });
      panels.forEach(item => { item.hidden = item !== panel; });
      showcase.dataset.wfActive = key;
      captionTitle.textContent = panel.dataset.captionTitle || '';
      captionCopy.textContent = panel.dataset.captionCopy || '';
      if (moveFocus) tab.focus();
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectTab(tab));
      tab.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        selectTab(tabs[next], true);
      });
    });

    selectTab(tabs.find(tab => tab.getAttribute('aria-selected') === 'true') || tabs[0]);
    showcase.classList.add('wf-ready');
  });
})();
