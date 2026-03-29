/**
 * SORIGRIM 2.0 - Technical Premium Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  initStickyNav();
  setTimeout(initHeroBackground, 100); 
  loadRecommendedByBoard(); // 게시판별 추천 로드
  trackVisit(); // 방문 통계 트래킹
  
  if (document.getElementById('portfolio-list')) {
    // 초기 로딩 (전체보기)
    loadArchiveInternal('all');
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
      const v = container.querySelector('video');
      v.play().catch(() => {
        document.body.addEventListener('mousedown', () => v.play(), { once: true });
      });
    } else {
      container.innerHTML = `<div class="hero-bg-image" style="background-image: url('${url}'); width:100%; height:100%; background-size:cover; background-position:center; animation: ken-burns 25s ease-in-out infinite alternate;"></div>`;
    }
  } catch (e) {
    container.innerHTML = `<div class="hero-bg-image" style="background-image: url('${defaultImage}'); width:100%; height:100%; background-size:cover; background-position:center;"></div>`;
  }
}

// --- 핵심: 전역에서 접근 가능한 아카이브 로드 함수 ---
window.loadArchiveInternal = async function(category = 'all') {
  const grid = document.getElementById('portfolio-list');
  if (!grid) return;
  
  try {
    const url = `/api/portfolio${category !== 'all' ? `?category=${category}` : ''}`;
    const res = await fetch(url);
    const works = await res.json();
    
    grid.innerHTML = works.map((work, i) => renderTechnicalCard(work, i)).join('');
    
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }, 100);
  } catch (e) {
    console.error("Archive Load Error", e);
  }
};

/**
 * 게시판별로 글을 가져와서 추천글이 있으면 추천글 위주로, 없으면 최신글 위주로 4개씩 노출
 */
async function loadRecommendedByBoard() {
  const container = document.getElementById('recommended-grid');
  if (!container) return;

  try {
    // 1. 모든 카테고리 가져오기
    const catRes = await fetch('/api/categories');
    const categories = await catRes.json();

    // 2. 모든 글 가져오기 (메모리상에서 분류하는 것이 여러번 API 호출보다 효율적일 수 있음)
    const postRes = await fetch('/api/portfolio');
    const allPosts = await postRes.json();

    let finalHtml = '';

    categories.forEach(cat => {
      // 해당 카테고리의 글들 필터링
      const boardPosts = allPosts.filter(p => p.category === cat.name);
      
      if (boardPosts.length === 0) return; // 글이 없으면 노출 안함

      // 정렬 로직: 추천글(is_recommended=1) 우선, 그 다음 최신순(id DESC)
      const sortedPosts = boardPosts.sort((a, b) => {
        if (b.is_recommended !== a.is_recommended) return b.is_recommended - a.is_recommended;
        return b.id - a.id;
      });

      // 최대 4개 선택
      const top4 = sortedPosts.slice(0, 4);

      // 섹션 렌더링
      finalHtml += `
        <div class="board-section" style="margin-bottom: 6rem; width: 100%;">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:2rem; border-bottom:1px solid var(--border); padding-bottom:1rem;">
            <h3 class="reveal" style="font-size:1.5rem; font-weight:900; color:var(--text-main); text-transform:uppercase; letter-spacing:-0.02em;">${cat.name}.</h3>
            <a href="/portfolio/index.html?category=${encodeURIComponent(cat.name)}" style="font-size:0.8rem; font-weight:800; color:var(--primary); text-decoration:none;">VIEW ALL →</a>
          </div>
          <div class="grid-archive">
            ${top4.map((work, i) => renderTechnicalCard(work, i)).join('')}
          </div>
        </div>
      `;
    });

    container.innerHTML = finalHtml;
    container.classList.remove('grid-archive'); // 이제 하위에서 그리드를 가짐
    
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }, 100);

  } catch (e) {
    console.error("Recommended Board Load Error", e);
  }
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
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
          <span class="tag">${work.category}</span>
          ${work.is_recommended ? '<span style="font-size:0.6rem; font-weight:900; color:#28a745; background:#e8f5e9; padding:2px 6px; border-radius:4px;">FEATURED</span>' : ''}
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

// --- 방문 통계 트래킹 ---
async function trackVisit() {
  try {
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        page: window.location.pathname,
        referrer: document.referrer 
      })
    });
  } catch (e) {}
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
        .links { display: flex; gap: 5rem; flex-wrap: wrap; }
        .group h4 { font-size: 0.8rem; font-weight: 800; margin-bottom: 1.5rem; text-transform: uppercase; }
        .group a { display: block; font-size: 0.9rem; color: #666; text-decoration: none; margin-bottom: 0.8rem; }
        .group a:hover { color: #0055FF; }
        .bottom { width: 100%; margin-top: 6rem; padding-top: 2rem; border-top: 1px solid #EEE; display: flex; justify-content: space-between; font-size: 0.8rem; color: #999; text-transform: uppercase; flex-wrap: wrap; gap: 1rem; }
        
        @media (max-width: 768px) {
          :host { padding: 4rem 0; }
          .container { padding: 0 1.5rem; gap: 3rem; }
          .links { gap: 3rem; }
          .bottom { margin-top: 3rem; }
        }
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
