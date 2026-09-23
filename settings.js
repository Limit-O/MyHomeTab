const editor = document.getElementById('editor');
const fileInput = document.getElementById('fileInput');
const saveBtn = document.getElementById('saveBtn');
const clearBtn = document.getElementById('clearBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusEl = document.getElementById('status');

const STORAGE_KEY = 'userHtml';
const MAX_BYTES = 8 * 1024 * 1024;

let statusTimer = null;
function setStatus(text, isError) {
  statusEl.textContent = text || '';
  statusEl.classList.toggle('error', !!isError);
  clearTimeout(statusTimer);
  if (text) statusTimer = setTimeout(() => { statusEl.textContent = ''; }, 3200);
}

chrome.storage.local.get({ [STORAGE_KEY]: '' }, (data) => {
  editor.value = data[STORAGE_KEY] || '';
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    editor.value = String(reader.result || '');
    setStatus('已载入 ' + file.name + '，点击「保存」生效');
  };
  reader.onerror = () => setStatus('读取文件失败', true);
  reader.readAsText(file, 'utf-8');
  fileInput.value = '';
});

saveBtn.addEventListener('click', () => {
  const html = editor.value;
  if (!html.trim()) {
    setStatus('内容为空，若要使用默认界面请点击「恢复默认界面」', true);
    return;
  }
  if (html.length > MAX_BYTES) {
    setStatus('内容超过 8MB，请精简后再保存', true);
    return;
  }
  chrome.storage.local.set({ [STORAGE_KEY]: html }, () => {
    if (chrome.runtime.lastError) {
      setStatus('保存失败：' + chrome.runtime.lastError.message, true);
      return;
    }
    setStatus('已保存 ✓ 打开新标签页看看效果');
  });
});

clearBtn.addEventListener('click', () => {
  if (!confirm('恢复默认界面？当前自定义内容将被清空。')) return;
  editor.value = '';
  chrome.storage.local.set({ [STORAGE_KEY]: '' }, () => setStatus('已恢复默认界面'));
});

downloadBtn.addEventListener('click', () => {
  const html = editor.value;
  if (!html.trim()) {
    setStatus('当前没有内容可导出', true);
    return;
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'myhometab.html';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
