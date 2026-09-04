// Tema independente da previa. Aplicado antes do CSS para evitar clarão.
(() => {
  const media = matchMedia('(prefers-color-scheme: dark)');
  let preference;
  try { preference = localStorage.getItem('wiki-editor-theme'); } catch {}
  const apply = (theme) => {
    document.documentElement.dataset.editorTheme = theme;
    document.documentElement.style.colorScheme = theme;
    const button = document.getElementById('editor-theme');
    if (button) {
      button.textContent = theme === 'dark' ? 'Modo claro' : 'Modo escuro';
      button.setAttribute('aria-pressed', String(theme === 'dark'));
    }
  };
  apply(preference === 'light' || preference === 'dark' ? preference : media.matches ? 'dark' : 'light');
  document.addEventListener('DOMContentLoaded', () => {
    apply(document.documentElement.dataset.editorTheme);
    document.getElementById('editor-theme').addEventListener('click', () => {
      preference = document.documentElement.dataset.editorTheme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('wiki-editor-theme', preference); } catch {}
      apply(preference);
    });
  });
  media.addEventListener('change', () => { if (!preference) apply(media.matches ? 'dark' : 'light'); });
})();
