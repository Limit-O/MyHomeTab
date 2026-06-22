/* ============================================================
 s cript.js — 全部 JavaScript 逻辑      *
 ============================================================ */

/* ============================================================
 1 . 搜索逻辑 (Bing)                    *
 ============================================================ */
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href =
            `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
        }
    }
});

searchInput.addEventListener('focus', function() {
    this.select();
});

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
});

/* ============================================================
 2 . 折叠面板                           *
 ============================================================ */
const toggleBtn = document.getElementById('toggleAddBtn');
const panel = document.getElementById('addPanel');
const toggleIcon = document.getElementById('toggleIcon');
let isOpen = false;

toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    toggleIcon.classList.toggle('open', isOpen);
});

/* ============================================================
 3 . 书签管理 (localStorage)            *
 ============================================================ */
const STORAGE_KEY = 'myhometab_bookmarks';

const defaultBookmarks = [
    { name: 'GitHub', url: 'https://github.com' },
{ name: 'Google', url: 'https://www.google.com' },
{ name: 'Twitter', url: 'https://twitter.com' },
{ name: '知乎', url: 'https://zhihu.com' },
];

function getBookmarks() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (_) { /* ignore */ }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultBookmarks));
    return defaultBookmarks;
}

function saveBookmarks(bookmarks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

function renderBookmarks() {
    const bookmarks = getBookmarks();
    const grid = document.getElementById('bookmarksGrid');

    if (bookmarks.length === 0) {
        grid.innerHTML =
        `<div class="empty-bookmarks">✦ 暂无书签，添加一个吧 ✦</div>`;
        return;
    }

    grid.innerHTML = bookmarks.map((item, index) => {
        const icon = item.name.charAt(0).toUpperCase() || '🔗';
        return `
        <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="bookmark-item">
        <span class="bookmark-icon">${icon}</span>
        <span class="bookmark-name">${item.name}</span>
        <button class="delete-btn" data-index="${index}" title="删除书签">
        <i class="fas fa-times"></i>
        </button>
        </a>
        `;
    }).join('');

    grid.querySelectorAll('.delete-btn').forEach((btn) => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const index = parseInt(this.dataset.index);
            deleteBookmark(index);
        });
    });
}

function deleteBookmark(index) {
    const bookmarks = getBookmarks();
    if (index >= 0 && index < bookmarks.length) {
        bookmarks.splice(index, 1);
        saveBookmarks(bookmarks);
        renderBookmarks();
    }
}

function addBookmark() {
    const nameInput = document.getElementById('newBookmarkName');
    const urlInput = document.getElementById('newBookmarkUrl');
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();

    if (!name || !url) {
        alert('请填写名称和网址');
        return;
    }

    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    const bookmarks = getBookmarks();
    if (bookmarks.some((b) => b.url.toLowerCase() === url.toLowerCase())) {
        alert('该网址已存在');
        return;
    }

    bookmarks.push({ name, url });
    saveBookmarks(bookmarks);
    renderBookmarks();

    nameInput.value = '';
    urlInput.value = '';
    nameInput.focus();

    // 添加后自动折叠
    if (isOpen) {
        isOpen = false;
        panel.classList.remove('open');
        toggleIcon.classList.remove('open');
    }
}

// 初始化渲染
renderBookmarks();

// 绑定添加事件
document.getElementById('addBookmarkBtn').addEventListener('click', addBookmark);
document.getElementById('newBookmarkName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBookmark();
});
document.getElementById('newBookmarkUrl').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBookmark();
});

console.log('💡 快捷键: Ctrl+K 快速聚焦搜索');
