(function () {
  if (window.siteTheme) {
    window.siteTheme.apply(document);
    return;
  }
  var key = 'haruka-theme';
  var valid = function (value) { return ['light', 'dark', 'system'].includes(value); };
  var preference = 'system';
  try { var stored = localStorage.getItem(key); if (valid(stored)) preference = stored; } catch (_) {}
  var system = window.matchMedia('(prefers-color-scheme: dark)');
  var apply = function (doc) {
    var theme = preference === 'system' ? (system.matches ? 'dark' : 'light') : preference;
    doc.documentElement.dataset.theme = theme;
    doc.documentElement.dataset.themePreference = preference;
    var meta = doc.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#1e1e1b' : '#faf7f2');
    doc.querySelectorAll('[data-theme-select]').forEach(function (select) { select.value = preference; });
  };
  window.siteTheme = { apply: apply };
  apply(document);
  system.addEventListener('change', function () { if (preference === 'system') apply(document); });
  document.addEventListener('change', function (event) {
    var select = event.target;
    if (!(select instanceof HTMLSelectElement) || !select.hasAttribute('data-theme-select') || !valid(select.value)) return;
    preference = select.value;
    try { localStorage.setItem(key, preference); } catch (_) {}
    apply(document);
  });
  window.addEventListener('storage', function (event) {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue) ? event.newValue : 'system';
    apply(document);
  });
  document.addEventListener('astro:before-swap', function (event) { apply(event.newDocument); });
  document.addEventListener('astro:page-load', function () { apply(document); });
  document.addEventListener('DOMContentLoaded', function () { apply(document); }, { once: true });
})();
