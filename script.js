/* ============================================================
 书 签管理 + 高级粒子（无生命周期 / 鼠标排斥 / 点击爆发）                    *
 ============================================================ */

// ---------- 粒子背景 ----------
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let mouseX = -1000, mouseY = -1000;

const MAX_PARTICLES = 500;           // 最大粒子数
const MIN_BG_PARTICLES = 30;         // 最少背景粒子数
const REPULSION_RADIUS = 180;
const REPULSION_FORCE = 0.18;

// ---------- 画布尺寸 ----------
function resizeCanvas() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ---------- 粒子类（无生命周期） ----------
class Particle {
    constructor(x, y, size, speed) {
        this.x = x !== undefined ? x : Math.random() * width;
        this.y = y !== undefined ? y : Math.random() * height;
        this.size = size || (Math.random() * 2.5 + 0.8);
        this.vx = (Math.random() - 0.5) * (speed || 0.2);
        this.vy = (Math.random() - 0.5) * (speed || 0.2);
        this.opacity = Math.random() * 0.4 + 0.15;
    }

    update() {
        // 鼠标排斥
        const dx = mouseX - this.x;
        const dy = mouseY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSION_RADIUS && dist > 1) {
            const force = REPULSION_FORCE * (1 - dist / REPULSION_RADIUS);
            this.vx -= (dx / dist) * force;
            this.vy -= (dy / dist) * force;
        }

        const maxSpeed = 1.8;
        const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (spd > maxSpeed) {
            this.vx = (this.vx / spd) * maxSpeed;
            this.vy = (this.vy / spd) * maxSpeed;
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) { this.x = 0; this.vx *= -0.5; }
        if (this.x > width) { this.x = width; this.vx *= -0.5; }
        if (this.y < 0) { this.y = 0; this.vy *= -0.5; }
        if (this.y > height) { this.y = height; this.vy *= -0.5; }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${this.opacity})`;
        ctx.fill();
    }
}

// ---------- 生成粒子（自动淘汰最老粒子） ----------
function spawnParticles(count, x, y, size, speed) {
    // 如果当前粒子数 + count 超过上限，先移除最老的粒子
    const total = particles.length;
    if (total + count > MAX_PARTICLES) {
        const removeCount = total + count - MAX_PARTICLES;
        particles.splice(0, removeCount); // 移除最老的
    }

    for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break;
        let px = x !== undefined ? x + (Math.random() - 0.5) * 40 : Math.random() * width;
        let py = y !== undefined ? y + (Math.random() - 0.5) * 40 : Math.random() * height;
        let pSize = size || (Math.random() * 2.5 + 0.8);
        let pSpeed = speed || (Math.random() * 0.2 + 0.05);
        particles.push(new Particle(px, py, pSize, pSpeed));
    }
}

// ---------- 初始化背景 ----------
function initBackground() {
    particles = [];
    spawnParticles(40, undefined, undefined, 2.2, 0.15);
}
initBackground();

// ---------- 绘制连线 ----------
function drawLines() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 100) {
                const alpha = 0.06 * (1 - dist / 100);
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(180, 200, 255, ${alpha})`;
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

// ---------- 动画循环 ----------
function animate() {
    ctx.clearRect(0, 0, width, height);

    // 保持最少背景粒子数（如果被淘汰导致不足，则补充）
    if (particles.length < MIN_BG_PARTICLES) {
        const need = MIN_BG_PARTICLES - particles.length;
        spawnParticles(need, undefined, undefined, 2.0, 0.15);
    }

    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.update();
        p.draw();
    }

    drawLines();
    requestAnimationFrame(animate);
}
animate();

// ---------- 鼠标事件 ----------
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

document.addEventListener('mouseleave', () => {
    mouseX = -1000;
    mouseY = -1000;
});

// ---------- 点击生成粒子（永不失效） ----------
document.addEventListener('click', (e) => {
    const target = e.target;
    if (target.closest('.bookmark-item') ||
        target.closest('.add-toggle') ||
        target.closest('.add-btn') ||
        target.closest('input') ||
        target.closest('button')) {
        return;
        }
        const cx = e.clientX;
    const cy = e.clientY;
    // 生成两组不同大小的粒子
    spawnParticles(20, cx, cy, 2.2, 0.3);
    spawnParticles(10, cx, cy, 1.4, 0.5);
});

// ---------- 书签管理（保持不变） ----------
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
        try { return JSON.parse(stored); } catch (_) {}
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
        grid.innerHTML = `<div class="empty-bookmarks">✦ 暂无书签，添加一个吧 ✦</div>`;
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

    if (isOpen) {
        isOpen = false;
        panel.classList.remove('open');
        toggleIcon.classList.remove('open');
    }
}

// 折叠面板控制
const toggleBtn = document.getElementById('toggleAddBtn');
const panel = document.getElementById('addPanel');
const toggleIcon = document.getElementById('toggleIcon');
let isOpen = false;

toggleBtn.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('open', isOpen);
    toggleIcon.classList.toggle('open', isOpen);
});

document.getElementById('addBookmarkBtn').addEventListener('click', addBookmark);
document.getElementById('newBookmarkName').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBookmark();
});
document.getElementById('newBookmarkUrl').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBookmark();
});

renderBookmarks();
