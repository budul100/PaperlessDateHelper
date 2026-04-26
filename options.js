const checkbox = document.getElementById('flipDates');
const labelInput = document.getElementById('suggestionLabel');

// Load saved settings
browser.storage.sync.get({ flipDates: false, suggestionLabel: 'Vorschläge:' }).then(result => {
  checkbox.checked = result.flipDates;
  labelInput.value = result.suggestionLabel;
});

// Save on change
checkbox.addEventListener('change', () => {
  browser.storage.sync.set({ flipDates: checkbox.checked });
});

labelInput.addEventListener('input', () => {
  browser.storage.sync.set({ suggestionLabel: labelInput.value });
});
