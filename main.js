/**
 * sorigrim 2.0 - Technical Premium Engine
 * Benchmarked from DMS Solution
 */

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  initStickyNav();
  setTimeout(initHeroBackground, 100); 
  loadRecommended();
  
  if (document.getElementById('portfolio-list')) {
    loadArchive('all');
    initFilters();
  }
});

/* 1. Sticky Navigation Control */
function initStickyNav() {
  const nav = document.getElementById('global-nav');
  if (!nav) return;

  const handleScroll = () => {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); 
}

/* 2. Page Transition Overlay */
function initPageTransition() {
  const overlay = document.createElement('div');
  overlay.id = 'page-transition';
  document.body.appendChild(overlay);

  window.addEventListener('load', () => {
    overlay.classList.add('hidden');
  });

  document.querySelectorAll('a').forEach(link => {
    const isInternal = link.hostname === window.location.hostname;
    const isNotHash = !link.hash;
    const isNotBlank = link.target !== '_blank';
    const isNotAdmin = !link.pathname.startsWith('/admin/');

    if (isInternal && isNotHash && isNotBlank && isNotAdmin) {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = link.href;
        overlay.classList.remove('hidden');
        setTimeout(() => {
          window.location.href = target;
        }, 500);
      });
    }
  });
}

/* 3. Hero Background (Ken Burns Implementation) */
async function initHeroBackground() {
  const container = document.getElementById('hero-video-container');
  if (!container) return;

  const defaultImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

  try {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error("API Offline");
    
    const settings = await res.json();
    const heroConfig = settings.find(s => s.key === 'landing_hero_video');
    
    const url = (heroConfig && heroConfig.value) ? heroConfig.value : defaultImage;
    const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg)$/) || url.includes('video');

    if (isVideo) {
      container.innerHTML = `<video src="${url}" muted loop autoplay playsinline style="width:100%; height:100%; object-fit:cover; display:block;"></video>`;
      const v = container.querySelector('video');
      v.play().catch(() => {
        document.body.addEventListener('mousedown', () => v.play(), { once: true });
      });
    } else {
      container.innerHTML = `<img src="${url}" alt="Hero Background" style="width:100%; height:100%; object-fit:cover; display:block;" onerror="this.src='${defaultImage}'">`;
    }
  } catch (e) {
    console.warn("Hero load failed, using fallback", e);
    container.innerHTML = `<img src="${defaultImage}" alt="Hero Fallback" style="width:100%; height:100%; object-fit:cover; display:block;">`;
  }
}

/* 4. Portfolio Loaders (DMS Style Card) */
async function loadArchive(category = 'all') {
  const grid = document.getElementById('portfolio-list');
  if (!grid) return;

  try {
    const res = await fetch(`/api/portfolio${category !== 'all' ? `?category=${category}` : ''}`);
    const works = await res.json();
    
    grid.innerHTML = works.map((work, i) => renderTechnicalCard(work, i)).join('');
    triggerReveals();
  } catch (e) { console.error("Archive Error", e); }
}

async function loadRecommended() {
  const grid = document.getElementById('recommended-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/portfolio?recommended=true');
    const works = await res.json();
    
    if (works && works.length > 0) {
      grid.innerHTML = works.slice(0, 6).map((work, i) => renderTechnicalCard(work, i)).join('');
      triggerReveals();
    }
  } catch (e) { console.error("Recommended Error", e); }
}

function renderTechnicalCard(work, index) {
  let thumbUrl = work.image;
  if (!thumbUrl && work.content) {
    const div = document.createElement('div');
    div.innerHTML = work.content;
    const media = div.querySelector('img, video');
    if (media) thumbUrl = media.src;
  }

  const isVideo = thumbUrl && (thumbUrl.toLowerCase().match(/\.(mp4|webm|ogg)$/) || thumbUrl.includes('video'));
  const mediaHtml = isVideo 
    ? `<video src="${thumbUrl}" muted loop autoplay playsinline></video>`
    : `<img src="${thumbUrl || '/api/assets?name=og-image.jpg'}" loading="lazy">`;

  return `
    <div class="archive-card reveal" style="transition-delay: ${index * 0.05}s" onclick="navigate('/portfolio/detail.html?id=${work.id}')">
      <div class="img-box">${mediaHtml}</div>
      <div class="card-meta">
        <span class="tag">${work.category}</span>
        <h3>${work.title}</h3>
      </div>
    </div>
  `;
}

function triggerReveals() {
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
  }, 100);
}

window.navigate = (url) => {
  const overlay = document.getElementById('page-transition');
  if (overlay) overlay.classList.remove('hidden');
  setTimeout(() => { window.location.href = url; }, 500);
};

function initFilters() {
  const buttons = document.querySelectorAll('.filter-nav button');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadArchive(btn.dataset.filter);
    });
  });
}

/**
 * <sg-footer> Web Component (Technical White)
 */
class SorigrimFooter extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  connectedCallback() { this.render(); }
  async fetchSNS() {
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();
      return settings.filter(s => s.type === 'sns');
    } catch (e) { return []; }
  }
  async render() {
    const sns = await this.fetchSNS();
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 8rem 0; background: #F8F9FA; color: #1A1A1A; font-family: sans-serif; border-top: 1px solid #EEE; }
        .container { max-width: 1400px; margin: 0 auto; padding: 0 4rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 4rem; }
        .brand h2 { font-size: 1.5rem; font-weight: 900; color: #0055FF; margin-bottom: 1rem; }
        .brand p { font-size: 0.9rem; color: #666; max-width: 350px; }
        .links { display: flex; gap: 5rem; }
        .group h4 { font-size: 0.8rem; font-weight: 800; margin-bottom: 1.5rem; text-transform: uppercase; }
        .group a { display: block; font-size: 0.9rem; color: #666; text-decoration: none; margin-bottom: 0.8rem; }
        .group a:hover { color: #0055FF; }
        .bottom { width: 100%; margin-top: 6rem; padding-top: 2rem; border-top: 1px solid #EEE; display: flex; justify-content: space-between; font-size: 0.8rem; color: #999; }
      </style>
      <div class="container">
        <div class="brand">
          <h2>sorigrim</h2>
          <p>기술적 정교함으로 프롬프트와 지각 사이의 경계를 정제하는 전문 생성 비전 포트폴리오 플랫폼입니다.</p>
        </div>
        <div class="links">
          <div class="group">
            <h4>Explore</h4>
            <a href="/">홈으로</a>
            <a href="/portfolio/">아카이브</a>
          </div>
          <div class="group">
            <h4>Legal</h4>
            <a href="/legal.html?type=privacy">개인정보처리방침</a>
            <a href="/legal.html?type=terms">이용약관</a>
          </div>
          <div class="group">
            <h4>Social</h4>
            ${sns.map(s => `<a href="${s.value}" target="_blank">${s.key}</a>`).join('')}
          </div>
        </div>
        <div class="bottom">
          <p>&copy; ${new Date().getFullYear()} Sorigrim. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}
customElements.define('sg-footer', SorigrimFooter);
