/**
 * sorigrim 1.0 - Cinematic Content Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  loadRecommended();
});

async function loadRecommended() {
  const grid = document.getElementById('recommended-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/portfolio?recommended=true');
    const works = await res.json();
    
    if (works && works.length > 0) {
      grid.innerHTML = works.slice(0, 9).map((work, i) => `
        <div class="archive-item reveal" style="transition-delay: ${i * 0.1}s" onclick="location.href='/portfolio/detail.html?id=${work.id}'">
          <img src="${work.image || ''}" alt="${work.title}" loading="lazy">
        </div>
      `).join('');
    } else {
      // Elegant minimalist placeholders
      grid.innerHTML = Array(9).fill(0).map((_, i) => `
        <div class="archive-item reveal" style="background: rgba(255,255,255,0.02); transition-delay: ${i * 0.1}s"></div>
      `).join('');
    }
    
    // Re-trigger observer for new items
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('active');
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  } catch (e) {
    console.error("Archive Grid Error", e);
  }
}
