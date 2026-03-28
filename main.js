/**
 * sorigrim 2.0 - Technical Premium Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  initStickyNav();
  // Execute hero initialization immediately
  initHeroBackground(); 
  loadRecommended();
  
  if (document.getElementById('portfolio-list')) {
    loadArchive('all');
    initFilters();
  }
});

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

/**
 * DMS Solution 기술 벤치마킹: 
 * 특정 게시글의 썸네일을 메인 히어로 이미지로 완벽하게 연동합니다.
 */
async function initHeroBackground() {
  const container = document.getElementById('hero-video-container');
  if (!container) return;

  const defaultImage = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

  try {
    // 썸네일 로직과 동일하게 특정 카테고리나 히어로 설정을 조회
    const res = await fetch('/api/portfolio?is_hero=true');
    const heroPost = await res.json();
    
    const url = (heroPost && heroPost.image) ? heroPost.image : defaultImage;
    const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg)$/) || url.includes('video');

    if (isVideo) {
      container.innerHTML = `<video src="${url}" muted loop autoplay playsinline style="width:100%; height:100%; object-fit:cover; display:block;"></video>`;
      const v = container.querySelector('video');
      v.play().catch(() => {
        document.body.addEventListener('mousedown', () => v.play(), { once: true });
      });
    } else {
      // 검증된 썸네일과 동일한 HTML 주입 방식
      container.innerHTML = `<div class="hero-bg-image" style="background-image: url('${url}'); width:100%; height:100%; background-size:cover; background-position:center; animation: ken-burns 25s ease-in-out infinite alternate;"></div>`;
    }
  } catch (e) {
    console.warn("Hero fetch failed, using fallback", e);
    container.innerHTML = `<div class="hero-bg-image" style="background-image: url('${defaultImage}'); width:100%; height:100%; background-size:cover; background-position:center;"></div>`;
  }
}

async function loadArchive(category = 'all') {
  const grid = document.getElementById('portfolio-list');
  if (!grid) return;
  try {
    const res = await fetch(`/api/portfolio${category !== 'all' ? `?category=${category}` : ''}`);
    const works = await res.json();
    grid.innerHTML = works.map((work, i) => renderTechnicalCard(work, i)).join('');
    triggerReveals();
  } catch (e) { console.error(e); }
}

async function loadRecommended() {
  const grid = document.getElementById('recommended-grid');
  if (!grid) return;
  try {
    // 최신순으로 상위 9개의 작품을 가져옵니다.
    const res = await fetch('/api/portfolio');
    const works = await res.json();
    if (works && works.length > 0) {
      grid.innerHTML = works.slice(0, 9).map((work, i) => renderTechnicalCard(work, i)).join('');
      triggerReveals();
    }
  } catch (e) { console.error("Recommended Load Error", e); }
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
        .brand h2 { font-size: 1.5rem; font-weight: 900; color: #0055FF; margin-bottom: 1rem; text-transform: uppercase; }
        .brand p { font-size: 0.9rem; color: #666; max-width: 350px; }
        .links { display: flex; gap: 5rem; }
        .group h4 { font-size: 0.8rem; font-weight: 800; margin-bottom: 1.5rem; text-transform: uppercase; }
        .group a { display: block; font-size: 0.9rem; color: #666; text-decoration: none; margin-bottom: 0.8rem; }
        .group a:hover { color: #0055FF; }
        .bottom { width: 100%; margin-top: 6rem; padding-top: 2rem; border-top: 1px solid #EEE; display: flex; justify-content: space-between; font-size: 0.8rem; color: #999; text-transform: uppercase; }
      </style>
      <div class="container">
        <div class="brand">
          <h2>SORIGRIM</h2>
          <p>프롬프트와 알고리즘으로 시각적 미학을 탐구하는 AI 아티스트의 개인 포트폴리오 공간입니다.</p>
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
          <p>&copy; ${new Date().getFullYear()} SORIGRIM. All rights reserved.</p>
        </div>
      </div>
    `;
  }
}
customElements.define('sg-footer', SorigrimFooter);
