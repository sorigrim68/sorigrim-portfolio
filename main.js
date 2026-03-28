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
          padding: 10rem 4rem 4rem;
          background: var(--sori-bg, #050505);
          color: var(--sori-fg, #fff);
          font-family: "Pretendard Variable", sans-serif;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .container { max-width: 1400px; margin: 0 auto; }
        
        /* Connect Section */
        .connect-section {
          display: flex; justify-content: space-between; align-items: flex-start;
          margin-bottom: 8rem; border-bottom: 1px solid rgba(255,255,255,0.03);
          padding-bottom: 8rem;
        }
        .connect-header h2 {
          font-family: "Cormorant Garamond", serif; font-size: 3.5rem; font-style: italic;
          font-weight: 700; margin-bottom: 1.5rem; opacity: 0.9;
        }
        .sns-grid { display: flex; gap: 3rem; }
        .sns-item { text-align: center; text-decoration: none; color: inherit; opacity: 0.4; transition: 0.4s; }
        .sns-item:hover { opacity: 1; transform: translateY(-5px); }
        .sns-item img { width: 32px; height: 32px; filter: invert(1); margin-bottom: 1rem; }
        .sns-item span { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; }

        /* Bottom Area */
        .footer-bottom {
          display: flex; justify-content: space-between; align-items: flex-end;
          font-size: 0.65rem; color: var(--sori-muted);
        }
        .brand-area h3 { font-family: "Cormorant Garamond", serif; font-size: 2rem; font-style: italic; margin-bottom: 0.5rem; color: white; }
        .regulatory { display: flex; gap: 2rem; opacity: 0.3; }
        .regulatory a { color: inherit; text-decoration: none; transition: 0.3s; }
        .regulatory a:hover { opacity: 1; }

        @media (max-width: 768px) {
          :host { padding: 6rem 2rem 3rem; }
          .connect-section { flex-direction: column; gap: 4rem; }
          .footer-bottom { flex-direction: column; align-items: flex-start; gap: 3rem; }
        }
      </style>
      <div class="container">
        <section class="connect-section">
          <div class="connect-header">
            <h2>Connect.</h2>
            <p style="font-size: 0.8rem; opacity: 0.4; letter-spacing: 0.1em;">Refining boundaries together.</p>
          </div>
          <div class="sns-grid">
            ${sns.map(s => `
              <a href="${s.value}" target="_blank" class="sns-item">
                <img src="${s.icon || ''}" alt="${s.key}">
                <span>${s.key}</span>
              </a>
            `).join('')}
          </div>
        </section>

        <div class="footer-bottom">
          <div class="brand-area">
            <h3>sorigrim</h3>
            <p>&copy; ${year} Sorigrim. All rights reserved.</p>
          </div>
          <div class="regulatory">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Regulatory Notice</a>
          </div>
        </div>
      </div>
    `;
  }
}

if (!customElements.get('sg-footer')) {
  customElements.define('sg-footer', SorigrimFooter);
}
