/**
 * sorigrim 1.0 - Cinematic Content Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  initPageTransition();
  // Ensure hero background is initialized
  setTimeout(initHeroBackground, 100); 
  loadRecommended();
  if (document.getElementById('portfolio-list')) {
    loadArchive('all');
    initFilters();
  }
});

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
        }, 800);
      });
    }
  });
}

async function initHeroBackground() {
  const container = document.getElementById('hero-video-container');
  if (!container) return;

  const fallbackImage = "/api/assets?name=og-image.jpg";

  try {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    const heroConfig = settings.find(s => s.key === 'landing_hero_video');
    
    const url = (heroConfig && heroConfig.value) ? heroConfig.value : fallbackImage;
    const isVideo = url.toLowerCase().match(/\.(mp4|webm|ogg)$/) || url.includes('video');

    if (isVideo) {
      container.innerHTML = `
        <video src="${url}" muted loop autoplay playsinline 
               style="width:100%; height:100%; object-fit:cover; display:block;">
        </video>
      `;
      const videoEl = container.querySelector('video');
      videoEl.play().catch(() => {
        document.body.addEventListener('mousedown', () => videoEl.play(), { once: true });
      });
    } else {
      container.innerHTML = `
        <img src="${url}" style="width:100%; height:100%; object-fit:cover; display:block;">
      `;
    }

  } catch (e) {
    console.error("Hero Load Error", e);
    container.innerHTML = `<img src="${fallbackImage}" style="width:100%; height:100%; object-fit:cover; display:block;">`;
  }
}

async function loadArchive(category = 'all') {
  const grid = document.getElementById('portfolio-list');
  if (!grid) return;

  try {
    const res = await fetch(`/api/portfolio${category !== 'all' ? `?category=${category}` : ''}`);
    const works = await res.json();
    
    grid.innerHTML = works.map((work, i) => {
      let thumbUrl = work.image;
      if (!thumbUrl && work.content) {
        const div = document.createElement('div');
        div.innerHTML = work.content;
        const media = div.querySelector('img, video');
        if (media) thumbUrl = media.src;
      }

      const isVideo = thumbUrl && (thumbUrl.toLowerCase().match(/\.(mp4|webm|ogg)$/) || thumbUrl.includes('video') || thumbUrl.includes('.mp4'));
      const mediaHtml = isVideo 
        ? `<video src="${thumbUrl}" muted loop autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>`
        : `<img src="${thumbUrl || ''}" alt="${work.title}" loading="lazy">`;

      return `
        <div class="archive-card reveal" style="transition-delay: ${i * 0.05}s" onclick="navigate('/portfolio/detail.html?id=${work.id}')">
          <div class="img-box">
            ${mediaHtml}
          </div>
          <div class="card-meta">
            <span class="tag">${work.category}</span>
            <h3>${work.title}</h3>
          </div>
        </div>
      `;
    }).join('');
    
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('active'));
    }, 100);

  } catch (e) {
    console.error("Archive Error", e);
  }
}

// Global navigate helper for dynamic elements
window.navigate = (url) => {
  const overlay = document.getElementById('page-transition');
  if (overlay) overlay.classList.remove('hidden');
  setTimeout(() => {
    window.location.href = url;
  }, 600);
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

async function loadRecommended() {
  const grid = document.getElementById('recommended-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/portfolio?recommended=true');
    const works = await res.json();
    
    if (works && works.length > 0) {
      grid.innerHTML = works.slice(0, 6).map((work, i) => {
        let thumbUrl = work.image;
        if (!thumbUrl && work.content) {
          const div = document.createElement('div');
          div.innerHTML = work.content;
          const media = div.querySelector('img, video');
          if (media) thumbUrl = media.src;
        }

        const isVideo = thumbUrl && (thumbUrl.toLowerCase().match(/\.(mp4|webm|ogg)$/) || thumbUrl.includes('video') || thumbUrl.includes('.mp4'));
        const mediaHtml = isVideo 
          ? `<video src="${thumbUrl}" muted loop autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>`
          : `<img src="${thumbUrl || ''}" alt="${work.title}" loading="lazy">`;

        return `
          <div class="archive-card reveal" style="transition-delay: ${i * 0.05}s" onclick="navigate('/portfolio/detail.html?id=${work.id}')">
            <div class="img-box">
              ${mediaHtml}
            </div>
            <div class="card-meta">
              <span class="tag">${work.category}</span>
              <h3>${work.title}</h3>
            </div>
          </div>
        `;
      }).join('');
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  } catch (e) {
    console.error("Recommended Grid Error", e);
  }
}

/**
 * <sg-footer> Web Component
 * A minimalist, cinematic footer with unified Connect section and regulatory info.
 */
class SorigrimFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  async fetchSNS() {
    try {
      const res = await fetch('/api/settings');
      const settings = await res.json();
      return settings.filter(s => s.type === 'sns');
    } catch (e) { return []; }
  }

  async render() {
    const year = new Date().getFullYear();
    const sns = await this.fetchSNS();
    
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 6rem 0;
          background: #F8F9FA;
          color: #1A1A1A;
          font-family: "Pretendard Variable", sans-serif;
          border-top: 1px solid #E9ECEF;
        }
        .container { 
          max-width: 1400px; 
          margin: 0 auto; 
          padding: 0 4rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 4rem;
        }
        
        .brand-section { flex: 1; min-width: 300px; }
        .brand-section h2 { 
          font-size: 1.5rem; font-weight: 900; color: #0055FF; 
          margin-bottom: 1.5rem; letter-spacing: -0.02em;
        }
        .brand-section p { 
          font-size: 0.9rem; color: #666; line-height: 1.8; 
          max-width: 400px;
        }

        .links-section { display: flex; gap: 6rem; }
        .link-group h4 { 
          font-size: 0.75rem; font-weight: 800; color: #1A1A1A; 
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 1.5rem;
        }
        .link-group a { 
          display: block; font-size: 0.85rem; color: #666; 
          text-decoration: none; margin-bottom: 0.8rem; transition: 0.2s;
        }
        .link-group a:hover { color: #0055FF; }

        .footer-bottom {
          width: 100%; margin-top: 6rem; padding-top: 2rem;
          border-top: 1px solid #E9ECEF;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.8rem; color: #999;
        }
        .sns-icons { display: flex; gap: 1.5rem; }
        .sns-icons a { opacity: 0.5; transition: 0.3s; }
        .sns-icons a:hover { opacity: 1; transform: translateY(-3px); }
        .sns-icons img { width: 20px; height: 20px; }

        @media (max-width: 768px) {
          .container { padding: 0 2rem; flex-direction: column; gap: 3rem; }
          .links-section { gap: 3rem; width: 100%; justify-content: space-between; }
          .footer-bottom { flex-direction: column; align-items: flex-start; gap: 2rem; }
        }
      </style>
      <div class="container">
        <div class="brand-section">
          <h2>sorigrim</h2>
          <p>프롬프트와 지각 사이의 경계를 기술적 정교함으로 정제하는 전문 생성 비전 포트폴리오 플랫폼입니다.</p>
        </div>

        <div class="links-section">
          <div class="link-group">
            <h4>탐색</h4>
            <a href="/">메인 홈</a>
            <a href="/portfolio/">아카이브</a>
          </div>
          <div class="link-group">
            <h4>법적 고지</h4>
            <a href="/legal.html?type=privacy">개인정보처리방침</a>
            <a href="/legal.html?type=terms">이용약관</a>
          </div>
          <div class="link-group">
            <h4>소셜</h4>
            ${sns.map(s => `<a href="${s.value}" target="_blank">${s.key}</a>`).join('')}
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; ${year} Sorigrim. All rights reserved.</p>
          <div class="sns-icons">
            ${sns.map(s => `
              <a href="${s.value}" target="_blank">
                <img src="${s.icon || ''}" alt="${s.key}" style="filter: grayscale(1) invert(0);">
              </a>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('sg-footer')) {
  customElements.define('sg-footer', SorigrimFooter);
}
