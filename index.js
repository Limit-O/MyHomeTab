/* ---------- 默认界面：时钟 / 日期 ---------- */
const clockEl = document.getElementById('clock');
const dateEl = document.getElementById('date');

function pad(n) {
  return String(n).padStart(2, '0');
}

function tick() {
  const d = new Date();
  clockEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
  const weeks = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  dateEl.textContent =
    d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日 · ' + weeks[d.getDay()];
}
tick();
setInterval(tick, 1000);

/* ---------- 搜索引擎切换 ---------- */
const ENGINES = {
  bing:   'https://www.bing.com/search?q=',
  baidu:  'https://www.baidu.com/s?wd=',
  google: 'https://www.google.com/search?q='
};

let currentEngine = 'bing';

function updateEngineTabs() {
  document.querySelectorAll('.engine').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.engine === currentEngine);
  });
}

document.getElementById('engines').addEventListener('click', (e) => {
  const btn = e.target.closest('.engine');
  if (!btn) return;
  currentEngine = btn.dataset.engine;
  updateEngineTabs();
  document.getElementById('q').focus();
});

document.getElementById('searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = document.getElementById('q').value.trim();
  if (!q) return;
  const base = ENGINES[currentEngine] || ENGINES.bing;
  location.href = base + encodeURIComponent(q);
});

/* ---------- 自定义 HTML 渲染 ---------- */
const frame = document.getElementById('frame');
const defaultView = document.getElementById('default');

let sandboxReady = false;
let pendingHtml = null;

function applyHtml(html) {
  const hasHtml = !!(html && html.trim());

  defaultView.hidden = hasHtml;
  frame.hidden = !hasHtml;
  if (!hasHtml) return;

  if (sandboxReady) {
    frame.contentWindow.postMessage({ type: 'render', html }, '*');
  } else {
    pendingHtml = html;
  }
}

window.addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow) return;
  const data = e.data;
  if (!data || data.type !== 'ready') return;

  sandboxReady = true;
  if (pendingHtml !== null) {
    frame.contentWindow.postMessage({ type: 'render', html: pendingHtml }, '*');
    pendingHtml = null;
  }
});

chrome.storage.local.get({ userHtml: '' }, (data) => {
  applyHtml(data.userHtml);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.userHtml) return;
  applyHtml(changes.userHtml.newValue || '');
});
