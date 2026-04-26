/**
 * Paperless Date Helper
 * - Copies date suggestions to custom date fields (pngx-input-date) that have none.
 * - Also considers the value already present in each date input field on render.
 * - Optionally adds alternative date interpretations (dd/mm vs mm/dd ambiguity),
 *   controlled via the extension's options page.
 */
(function () {
  'use strict';

  const processedSmall = new WeakSet();
  const processedCustom = new WeakSet();

  function parseDate(str) {
    const m = str.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!m) return null; // FIX: was `if (m)`
    const dd = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const yyyy = parseInt(m[3], 10);
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return null;
    return { dd, mm, yyyy };
  }

  function formatDate(dd, mm, yyyy) {
    return `${String(dd).padStart(2, '0')}.${String(mm).padStart(2, '0')}.${yyyy}`;
  }

  function getAlternatives(dateStr, flipEnabled) {
    const d = parseDate(dateStr);
    if (!d) return []; // FIX: was `if (d)`
    const results = [dateStr];
    if (flipEnabled && d.dd <= 12 && d.dd !== d.mm) { // FIX: was `d.dd == d.mm`
      results.push(formatDate(d.mm, d.dd, d.yyyy));
    }
    return results;
  }

  const nativeInputSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value'
  ).set;

  function setAngularValue(input, value) {
    nativeInputSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function createPill(dateStr, input) {
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = dateStr;
    a.style.marginRight = '4px';
    a.dataset.paperlessHelper = 'true';
    a.addEventListener('click', (e) => {
      e.preventDefault();
      setAngularValue(input, dateStr);
    });
    return a;
  }

  function appendPills(container, dates, input) {
    dates.forEach(d => {
      container.appendChild(createPill(d, input));
      container.appendChild(document.createTextNode('\u00a0 '));
    });
  }

  function processPage(flipEnabled, suggestionLabel) {
    // Step 1: Augment existing suggestion blocks.
    document.querySelectorAll('small').forEach(small => {
      if (processedSmall.has(small)) return;
      const span = small.querySelector('span');
      if (!span || span.textContent.trim() !== suggestionLabel) return; // FIX: was missing span check + inverted
      const colMd9 = small.closest('.col-md-9');
      if (!colMd9) return; // FIX: was `if (colMd9)`
      const input = colMd9.querySelector('input[ngbdatepicker]');
      if (!input) return; // FIX: was `if (input)`
      processedSmall.add(small);

      // Collect all unique dates; Set prevents duplicates from input.value matching existing pills
      const dates = new Set();
      small.querySelectorAll('a').forEach(a => {
        getAlternatives(a.textContent.trim(), flipEnabled).forEach(d => dates.add(d));
      });
      getAlternatives(input.value.trim(), flipEnabled).forEach(d => dates.add(d));

      // Remove existing pills and rebuild
      small.querySelectorAll('a').forEach(a => {
        if (a.nextSibling?.nodeType === 3) a.nextSibling.remove();
        a.remove();
      });
      appendPills(small, [...dates], input);
    });

    // Step 2: Collect all known dates from processed suggestion blocks.
    const globalDates = new Set();
    document.querySelectorAll('small').forEach(small => {
      const span = small.querySelector('span');
      if (!span || span.textContent.trim() !== suggestionLabel) return; // FIX: was inverted + missing span check
      small.querySelectorAll('a[data-paperless-helper]').forEach(a => {
        const text = a.textContent.trim();
        if (parseDate(text)) globalDates.add(text);
      });
    });

    // Step 3: Inject into custom date fields without a suggestion block.
    document.querySelectorAll('pngx-input-date').forEach(component => {
      if (processedCustom.has(component)) return;
      const colMd9 = component.querySelector('.col-md-9');
      if (!colMd9) return; // FIX: was `if (colMd9)`
      const hasBlock = [...colMd9.querySelectorAll('small')].some(s => {
        const sp = s.querySelector('span');
        return sp && sp.textContent.trim() === suggestionLabel;
      });
      if (hasBlock) return;
      const input = colMd9.querySelector('input[ngbdatepicker]');
      if (!input) return; // FIX: was `if (input)`

      // Start from globalDates; Set automatically deduplicates input.value if already present
      const dates = new Set(globalDates);
      getAlternatives(input.value.trim(), flipEnabled).forEach(d => dates.add(d));
      if (dates.size === 0) return;

      processedCustom.add(component);
      const small = document.createElement('small');
      const label = document.createElement('span');
      label.textContent = suggestionLabel;
      small.appendChild(label);
      small.appendChild(document.createTextNode('\u00a0 '));
      appendPills(small, [...dates], input);
      colMd9.appendChild(small);
    });
  }

  // Load settings once, then start observer
  browser.storage.sync.get({ flipDates: false, suggestionLabel: 'Vorschläge:' }).then(result => {
    const flipEnabled = result.flipDates;
    const suggestionLabel = result.suggestionLabel;
    const observer = new MutationObserver(() => processPage(flipEnabled, suggestionLabel));
    observer.observe(document.body, { childList: true, subtree: true });
    processPage(flipEnabled, suggestionLabel);
  });
})();
