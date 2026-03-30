/**
 * SORIGRIM 2.0 - Technical Premium Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initPageTransition();
  initStickyNav();
  setTimeout(initHeroBackground, 100); 
  loadRecommendedByBoard();
  trackVisit();
  loadSiteTexts();
  
  if (document.getElementById('portfolio-list')) {
    const urlParams = new URLSearchParams(window.location.search);
    loadArchiveInternal(urlParams.get('category') || 'all');
  }
});

// --- URL 자동 링크 변환 (Linkify) ---
window.linkify = function(text) {
  const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
  return text.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
};

// --- 사이트 문구 동적 로드 ---
async function loadSiteTexts() {
  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    const getVal = (key) => settings.find(s => s.key === key)?.value;

    const hTitle = getVal('site_hero_title');
    const hSub = getVal('site_hero_sub');
    if (hTitle && document.querySelector('#hero h1')) document.querySelector('#hero h1').innerHTML = hTitle.replace(/\n/g, '<br>');
    if (hSub && document.querySelector('#hero p')) document.querySelector('#hero p').innerHTML = hSub.replace(/\n/g, '<br>');

    const rTitle = getVal('site_rec_title');
    const rDesc = getVal('site_rec_desc');
    if (rTitle && document.querySelector('#recommended .section-title')) document.querySelector('#recommended .section-title').innerText = rTitle;
    if (rDesc && document.querySelector('#recommended .section-desc')) document.querySelector('#recommended .section-desc').innerText = rDesc;

    const aTitle = getVal('site_archive_title');
    if (aTitle && document.querySelector('.archive-header .section-title')) document.querySelector('.archive-header .section-title').innerText = aTitle;

  } catch (e) { console.error("Site Text Load Error", e); }
}

function initTheme() {
  const savedTheme = localStorage.getItem('sg-theme');
  if (savedTheme === 'dark') document.body.classList.add('dark-mode');
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

window.loadArchiveInternal = async function(category = 'all', page = 1, limit = 12) {
  const grid = document.getElementById('portfolio-list');
  if (!grid) return;
  
  // Show skeleton during load
  grid.innerHTML = Array(8).fill('<div class="archive-card skeleton" style="height:400px; border-radius:8px;"></div>').join('');
  
  try {
    const url = new URL('/api/portfolio', window.location.origin);
    if (category !== 'all') url.searchParams.set('category', category);
    url.searchParams.set('page', page);
    url.searchParams.set('limit', limit);
    
    const res = await fetch(url.toString());
    const works = await res.json();
    
    if (works.length === 0 && page === 1) {
      grid.innerHTML = '<p style="text-align:center; padding: 5rem 0; width:100%; color:var(--text-muted);">등록된 작품이 없습니다.</p>';
      return;
    }
    
    grid.innerHTML = works.map((work, i) => window.renderTechnicalCard(work, i)).join('');
    setTimeout(() => document.querySelectorAll('.reveal').forEach(el => el.classList.add('active')), 100);
  } catch (e) { 
    console.error(e); 
    grid.innerHTML = '<p style="text-align:center; padding: 5rem 0; width:100%; color:var(--text-muted);">데이터를 불러오는 중 오류가 발생했습니다.</p>';
  }
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
    let sns = [];
    let footerDesc = "AI 시각 예술과 프롬프트 엔지니어링의 정수를 담은 개인 포트폴리오입니다.";
    
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const settings = await res.json();
        sns = settings.filter(s => s.type === 'sns') || [];
        footerDesc = settings.find(s => s.key === 'site_footer_desc')?.value || footerDesc;
      }
    } catch (e) { console.error("Footer fetch error", e); }

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 6rem 0; background: #F8F9FA; color: #111111; font-family: sans-serif; border-top: 1px solid #EEEEEE; }
        .container { max-width: 1400px; margin: 0 auto; padding: 0 4rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4rem; }
        .brand h2 { font-size: 1.5rem; font-weight: 900; color: #0055FF; margin-bottom: 1rem; text-transform: uppercase; }
        .links { display: flex; gap: 5rem; }
        .group h4 { font-size: 0.8rem; font-weight: 800; margin-bottom: 1.5rem; text-transform: uppercase; }
        .group a { display: block; font-size: 0.9rem; color: #666; text-decoration: none; margin-bottom: 0.8rem; }
        .bottom { width: 100%; margin-top: 4rem; padding-top: 2rem; border-top: 1px solid #EEEEEE; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
        .admin-access-btn {
          font-size: 0.75rem; font-weight: 900; color: #0055FF; text-decoration: none; 
          border: 2px solid #0055FF; padding: 8px 20px; border-radius: 6px; 
          transition: 0.3s; background: white; text-transform: uppercase;
        }
        .admin-access-btn:hover { background: #0055FF; color: white; }
        @media (max-width: 768px) { .container { padding: 0 1.5rem; } .links { gap: 2rem; } }
      </style>
      <div class="container">
        <div class="brand"><h2>SORIGRIM</h2><p style="max-width:300px; font-size:0.9rem;">${footerDesc}</p></div>
        <div class="links">
          <div class="group">
            <h4>Explore</h4>
            <a href="/">홈으로</a>
            <a href="/portfolio/">아카이브</a>
            <a href="/about.html">About</a>
            <a href="/admin/dashboard.html" style="margin-top:2rem; opacity:0.5; font-size:0.7rem; font-weight:800; color:var(--primary);">ADMIN ACCESS</a>
          </div>
          <div class="group"><h4>Social</h4>${sns.map(s => `<a href="${s.value}" target="_blank">${s.key}</a>`).join('')}</div>
        </div>
        <div class="bottom">
          <p>&copy; ${new Date().getFullYear()} SORIGRIM. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}
customElements.define('sg-footer', SorigrimFooter);
