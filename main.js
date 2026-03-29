/**
 * SORIGRIM 2.0 - Technical Premium Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme(); // 테마 초기화
  initPageTransition();
  initStickyNav();
  setTimeout(initHeroBackground, 100); 
  loadRecommendedByBoard();
  trackVisit();
  
  if (document.getElementById('portfolio-list')) {
    const urlParams = new URLSearchParams(window.location.search);
    loadArchiveInternal(urlParams.get('category') || 'all');
  }
});

// --- 테마 관리 (다크모드) ---
function initTheme() {
  const savedTheme = localStorage.getItem('sg-theme');
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');
  
  // 테마 토글 버튼 주입 (네비게이션 우측)
  const navLinks = document.querySelector('.nav-links');
  if (navLinks && !document.querySelector('.theme-toggle')) {
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.innerHTML = savedTheme === 'dark' ? '☀️' : '🌙';
    toggle.onclick = () => {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('sg-theme', isDark ? 'dark' : 'light');
      toggle.innerHTML = isDark ? '☀️' : '🌙';
    };
    navLinks.appendChild(toggle);
  }
}

function initStickyNav() {
  const nav = document.getElementById('global-nav');
  if (!nav) return;
  const handleScroll = () => {
    if (window.scrollY > 80) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); 
}

function initPageTransition() {
  const overlay = document.createElement('div');
  overlay.id = 'page-transition';
  document.body.appendChild(overlay);
  window.addEventListener('load', () => overlay.classList.add('hidden'));
  document.querySelectorAll('a').forEach(link => {
    if (link.hostname === window.location.hostname && !link.hash && link.target !== '_blank' && !link.pathname.startsWith('/admin/')) {
      link.addEventListener('click', e => {
        e.preventDefault();
        overlay.classList.remove('hidden');
        setTimeout(() => { window.location.href = link.href; }, 500);
      });
    }
  });
}

async function initHeroBackground() {
  const container = document.getElementById('hero-video-container');
  if (!container) return;
  const defaultImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";
  try {
    const res = await fetch('/api/portfolio?is_hero=true');
    const heroPost = await res.json();
    const url = (heroPost && heroPost.image) ? heroPost.image : defaultImage;
    const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg)$/) || url.includes('video');
    if (isVideo) {
      container.innerHTML = `<video src="${url}" muted loop autoplay playsinline style="width:100%; height:100%; object-fit:cover; display:block;"></video>`;
    } else {
      container.innerHTML = `<div class="hero-bg-image" style="background-image: url('${url}'); width:100%; height:100%; background-size:cover; background-position:center; animation: ken-burns 25s ease-in-out infinite alternate;"></div>`;
    }
  } catch (e) {
    container.innerHTML = `<div class="hero-bg-image" style="background-image: url('${defaultImage}'); width:100%; height:100%; background-size:cover; background-position:center;"></div>`;
  }
}

window.loadArchiveInternal = async function(category = 'all') {
  const grid = document.getElementById('portfolio-list');
  if (!grid) return;
  grid.innerHTML = Array(8).fill('<div class="archive-card skeleton" style="height:400px; border-radius:8px;"></div>').join('');
  try {
    const res = await fetch(`/api/portfolio${category !== 'all' ? `?category=${category}` : ''}`);
    const works = await res.json();
    grid.innerHTML = works.map((work, i) => window.renderTechnicalCard(work, i)).join('');
    setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('active')), 100);
  } catch (e) { console.error(e); }
};

async function loadRecommendedByBoard() {
  const container = document.getElementById('recommended-grid');
  if (!container) return;
  try {
    const catRes = await fetch('/api/categories'); const categories = await catRes.json();
    const postRes = await fetch('/api/portfolio'); const allPosts = await postRes.json();
    let finalHtml = '';
    categories.forEach(cat => {
      const boardPosts = allPosts.filter(p => p.category === cat.name);
      if (boardPosts.length === 0) return; 
      const sortedPosts = boardPosts.sort((a, b) => (b.is_recommended - a.is_recommended) || (b.id - a.id));
      const top4 = sortedPosts.slice(0, 4);
      finalHtml += `
        <div class="board-section" style="margin-bottom: 6rem; width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2rem; border-bottom:1px solid var(--border); padding-bottom:1rem;">
            <h3 class="reveal" style="font-size:1.5rem; font-weight:900; color:var(--text-main); text-transform:uppercase;">${cat.name}.</h3>
            <a href="/portfolio/index.html?category=${encodeURIComponent(cat.name)}" style="font-size:0.8rem; font-weight:800; color:var(--primary); text-decoration:none;">VIEW ALL →</a>
          </div>
          <div class="grid-archive">${top4.map((work, i) => window.renderTechnicalCard(work, i)).join('')}</div>
        </div>
      `;
    });
    container.innerHTML = finalHtml;
    setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('active')), 100);
  } catch (e) { console.error(e); }
}

window.renderTechnicalCard = function(work, index) {
  let thumbUrl = work.image;
  if (!thumbUrl && work.content) {
    const div = document.createElement('div'); div.innerHTML = work.content;
    const media = div.querySelector('img, video'); if (media) thumbUrl = media.src;
  }
  const isVideo = thumbUrl && (thumbUrl.toLowerCase().match(/\.(mp4|webm|ogg)$/) || thumbUrl.includes('video'));
  const mediaHtml = isVideo 
    ? `<video src="${thumbUrl}" muted loop autoplay playsinline></video>`
    : `<img src="${thumbUrl || '/api/assets?name=og-image.jpg'}" loading="lazy">`;

  return `
    <div class="archive-card reveal" style="transition-delay: ${index * 0.05}s" onclick="navigate('/portfolio/detail.html?id=${work.id}')">
      <div class="img-box">${mediaHtml}</div>
      <div class="card-meta">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span class="tag">${work.category}</span>
          <div style="display:flex; gap:0.8rem; font-size:0.65rem; font-weight:800; color:#AAA;">
            <span>👁 ${work.views || 0}</span>
            <span>❤️ ${work.likes || 0}</span>
          </div>
        </div>
        <h3>${work.title}</h3>
      </div>
    </div>
  `;
}

window.navigate = (url) => {
  const overlay = document.getElementById('page-transition');
  if (overlay) overlay.classList.remove('hidden');
  setTimeout(() => { window.location.href = url; }, 500);
};

// --- Engagement & Analytics ---
async function trackVisit() {
  try { fetch('/api/stats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ page: window.location.pathname, referrer: document.referrer }) }); } catch (e) {}
}

window.likePost = async (id) => {
  try {
    const res = await fetch(`/api/portfolio?id=${id}&action=like`, { method: 'POST' });
    if (res.ok) return true;
  } catch (e) { return false; }
};

class SorigrimFooter extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  connectedCallback() { this.render(); }
  async render() {
    const res = await fetch('/api/settings'); const settings = await res.json();
    const sns = settings.filter(s => s.type === 'sns');
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 8rem 0; background: var(--bg-light); color: var(--text-main); font-family: sans-serif; border-top: 1px solid var(--border); }
        .container { max-width: 1400px; margin: 0 auto; padding: 0 4rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4rem; }
        .brand h2 { font-size: 1.5rem; font-weight: 900; color: #0055FF; margin-bottom: 1rem; text-transform: uppercase; }
        .links { display: flex; gap: 5rem; }
        .group h4 { font-size: 0.8rem; font-weight: 800; margin-bottom: 1.5rem; text-transform: uppercase; }
        .group a { display: block; font-size: 0.9rem; color: #666; text-decoration: none; margin-bottom: 0.8rem; }
        .bottom { width: 100%; margin-top: 6rem; padding-top: 2rem; border-top: 1px solid var(--border); font-size: 0.8rem; color: #999; }
      </style>
      <div class="container">
        <div class="brand"><h2>SORIGRIM</h2><p style="max-width:300px; font-size:0.9rem;">AI 시각 예술과 프롬프트 엔지니어링의 정수를 담은 개인 포트폴리오입니다.</p></div>
        <div class="links">
          <div class="group"><h4>Explore</h4><a href="/">홈으로</a><a href="/portfolio/">아카이브</a><a href="/about.html">About</a></div>
          <div class="group"><h4>Social</h4>${sns.map(s => `<a href="${s.value}" target="_blank">${s.key}</a>`).join('')}</div>
        </div>
        <div class="bottom"><p>&copy; ${new Date().getFullYear()} SORIGRIM. All rights reserved.</p></div>
      </div>
    `;
  }
}
customElements.define('sg-footer', SorigrimFooter);
