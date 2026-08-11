(() => {
  const form = document.querySelector('#writer-form');
  if (!form) return;

  const fields = {
    title: document.querySelector('#post-title'),
    mood: document.querySelector('#post-mood'),
    tags: document.querySelector('#post-tags'),
    body: document.querySelector('#post-body'),
  };
  const status = document.querySelector('#draft-status');
  const count = document.querySelector('#char-count');
  const draftKey = 'zuka-blog-post-draft-v1';
  let saveTimer;

  const updateCount = () => { count.textContent = `${fields.body.value.length}文字`; };
  const saveDraft = () => {
    localStorage.setItem(draftKey, JSON.stringify(Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value]))));
    status.textContent = '下書きを保存しました。';
  };

  try {
    const draft = JSON.parse(localStorage.getItem(draftKey) || '{}');
    Object.entries(fields).forEach(([key, input]) => { if (draft[key]) input.value = draft[key]; });
  } catch (_) {
    localStorage.removeItem(draftKey);
  }
  updateCount();

  form.addEventListener('input', () => {
    updateCount();
    status.textContent = '保存中…';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 450);
  });

  document.querySelectorAll('[data-format]').forEach((button) => {
    button.addEventListener('click', () => {
      const textarea = fields.body;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selected = textarea.value.slice(start, end);
      const formats = {
        heading: [`## ${selected || '見出し'}`, 3],
        list: [`- ${selected || '項目'}`, 2],
        bold: [`**${selected || '太字'}**`, 2],
        quote: [`> ${selected || '引用'}`, 2],
      };
      const [insert, offset] = formats[button.dataset.format];
      textarea.setRangeText(insert, start, end, 'end');
      if (!selected) textarea.setSelectionRange(start + offset, start + insert.length - (button.dataset.format === 'bold' ? 2 : 0));
      textarea.focus();
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  document.querySelector('#clear-draft').addEventListener('click', () => {
    if (!window.confirm('この端末に保存した下書きを削除しますか？')) return;
    form.reset();
    localStorage.removeItem(draftKey);
    updateCount();
    status.textContent = '下書きを削除しました。';
    fields.title.focus();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const params = new URLSearchParams({
      template: 'new-post.yml',
      title: `[記事] ${fields.title.value.trim()}`,
      article_title: fields.title.value.trim(),
      mood: fields.mood.value.trim(),
      tags: fields.tags.value.trim(),
      article_body: fields.body.value.trim(),
    });
    let target = `https://github.com/zuka-0123/zuka-0123.github.io/issues/new?${params}`;

    if (target.length > 7000) {
      try {
        await navigator.clipboard.writeText(fields.body.value.trim());
        params.set('article_body', '本文が長いためコピー済みです。この欄を選び、貼り付けてください。');
        target = `https://github.com/zuka-0123/zuka-0123.github.io/issues/new?${params}`;
        window.alert('長い本文をコピーしました。次の画面の「本文」欄を選んで貼り付けてください。');
      } catch (_) {
        window.alert('文章が長いため、本文を一度コピーしてから公開してください。');
        fields.body.focus();
        return;
      }
    }

    saveDraft();
    window.location.href = target;
  });

  let installPrompt;
  const installButton = document.querySelector('#install-app');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    installPrompt = null;
    installButton.hidden = true;
  });
})();

