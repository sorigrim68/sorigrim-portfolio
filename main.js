/**
 * sorigrim 5.0 Core Logic
 * Cinematic, Image-first, Minimal.
 */

document.addEventListener('DOMContentLoaded', () => {
  initGrid();
});

async function initGrid() {
  const grid = document.getElementById('recommended-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/portfolio?recommended=true');
    const works = await res.json();
    
    if (works && works.length > 0) {
      grid.innerHTML = works.slice(0, 9).map(work => `
        <div class="archive-item" onclick="location.href='/portfolio/detail.html?id=${work.id}'">
          <img src="${work.image || ''}" alt="${work.title}" loading="lazy">
        </div>
      `).join('');
    } else {
      // Elegant Placeholder if no data
      grid.innerHTML = Array(9).fill(0).map(() => `
        <div class="archive-item" style="background: rgba(255,255,255,0.02);"></div>
      `).join('');
    }
  } catch (e) {
    console.error("Grid Load Error", e);
  }
}
