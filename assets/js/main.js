(() => {
  const button = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');

  if (button && nav) {
    button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
      button.querySelector('.sr-only').textContent = open ? 'メニューを開く' : 'メニューを閉じる';
    });
  }

  const input = document.querySelector('#archive-search');
  const items = [...document.querySelectorAll('[data-archive-item]')];
  const status = document.querySelector('#search-status');

  if (input && items.length) {
    input.addEventListener('input', () => {
      const query = input.value.trim().toLocaleLowerCase('ja');
      let visible = 0;

      items.forEach((item) => {
        const match = !query || item.dataset.search.toLocaleLowerCase('ja').includes(query);
        item.hidden = !match;
        if (match) visible += 1;
      });

      document.querySelectorAll('[data-year-group]').forEach((group) => {
        group.hidden = !group.querySelector('[data-archive-item]:not([hidden])');
      });

      status.textContent = query ? `${visible}件の記事が見つかりました` : '';
    });
  }

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
  }
})();
