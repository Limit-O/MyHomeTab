const editor = document.getElementById('editor');
const fileInput = document.getElementById('fileInput');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusEl = document.getElementById('status');
const languageSelect = document.getElementById('languageSelect');
const resetLanguageBtn = document.getElementById('resetLanguageBtn');

const STORAGE_KEY = 'userHtml';
const MAX_BYTES = 8 * 1024 * 1024;
const LANGUAGE_KEY = 'language';

let statusTimer = null;
function setStatus(text, isError) {
  statusEl.textContent = text || '';
  statusEl.classList.toggle('error', !!isError);
  clearTimeout(statusTimer);
  if (text) statusTimer = setTimeout(() => { statusEl.textContent = ''; }, 3200);
}

function updateLanguage() {
  const messages = chrome.i18n.getMessage;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = messages(key);
    if (text) el.textContent = text;
  });
}

chrome.storage.local.get({ [STORAGE_KEY]: '' }, (data) => {
  editor.value = data[STORAGE_KEY] || '';
});

chrome.storage.local.get({ [LANGUAGE_KEY]: 'zh_CN' }, (data) => {
  languageSelect.value = data[LANGUAGE_KEY] || 'zh_CN';
  updateLanguage();
});

languageSelect.addEventListener('change', () => {
  const lang = languageSelect.value;
  chrome.storage.local.set({ [LANGUAGE_KEY]: lang }, () => {
    updateLanguage();
    setStatus('语言已切换');
  });
});

resetLanguageBtn.addEventListener('click', () => {
  chrome.storage.local.set({ [LANGUAGE_KEY]: 'zh_CN' }, () => {
    languageSelect.value = 'zh_CN';
    updateLanguage();
    setStatus('已重置为默认语言');
  });
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    editor.value = String(reader.result || '');
    setStatus(chrome.i18n.getMessage('statusLoaded', [file.name]));
  };
  reader.onerror = () => setStatus(chrome.i18n.getMessage('statusLoadFailed'), true);
  reader.readAsText(file, 'utf-8');
  fileInput.value = '';
});

saveBtn.addEventListener('click', () => {
  const html = editor.value;
  if (!html.trim()) {
    setStatus(chrome.i18n.getMessage('statusEmpty'), true);
    return;
  }
  if (html.length > MAX_BYTES) {
    setStatus(chrome.i18n.getMessage('statusTooLarge'), true);
    return;
  }
  chrome.storage.local.set({ [STORAGE_KEY]: html }, () => {
    if (chrome.runtime.lastError) {
      setStatus(chrome.i18n.getMessage('statusSaveFailed', [chrome.runtime.lastError.message]), true);
      return;
    }
    setStatus(chrome.i18n.getMessage('statusSaved'));
  });
});

clearBtn.addEventListener('click', () => {
  if (!confirm(chrome.i18n.getMessage('confirmClear'))) return;
  editor.value = '';
  chrome.storage.local.set({ [STORAGE_KEY]: '' }, () => setStatus(chrome.i18n.getMessage('statusCleared')));
});

downloadBtn.addEventListener('click', () => {
  const html = editor.value;
  if (!html.trim()) {
    setStatus(chrome.i18n.getMessage('statusNoContent'), true);
    return;
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = chrome.i18n.getMessage('downloadFilename');
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
