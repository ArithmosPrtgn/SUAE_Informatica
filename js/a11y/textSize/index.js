(function () {
  const STORAGE_KEY = 'siteTextScale';
  const DEFAULT_SCALE = 1;

  const root = document.documentElement;

  function loadScale() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = parseFloat(saved);
    return Number.isFinite(parsed) ? parsed : DEFAULT_SCALE;
  }

  function saveScale(scale) {
    try {
      localStorage.setItem(STORAGE_KEY, String(scale));
    } catch (e) {
      console.warn('Could not save text size preference:', e);
    }
  }

  function applyScale(scale) {
    root.style.setProperty('--text-scale', scale);
    
    const range = document.getElementById('textSize');
    if (range) {
      range.value = scale;
    }
  }

  applyScale(loadScale());

  document.addEventListener('input', function (event) {
    if (event.target && event.target.id === 'textSize') {
      const scale = parseFloat(event.target.value);
      applyScale(scale);
      saveScale(scale);
    }
  });
})();