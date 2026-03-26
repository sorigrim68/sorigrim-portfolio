/**
 * Sorigrim 1.0 Admin Logic
 * Handles Dashboard and Editor without complex auth for now.
 */

document.addEventListener('DOMContentLoaded', () => {
  const adminList = document.getElementById('admin-list');
  const snsAdminList = document.getElementById('sns-admin-list');
  const editorForm = document.getElementById('editor-form');
  const snsForm = document.getElementById('sns-form');

  if (adminList) loadPortfolio();
  if (snsAdminList) loadSNS();
  if (snsForm) initSNSForm();
  if (editorForm) initEditor();
});

async function loadPortfolio() {
  const list = document.getElementById('admin-list');
  try {
    const res = await fetch('/api/portfolio');
    const data = await res.json();
    list.innerHTML = data.map(item => `
      <tr>
        <td><img src="${item.image}" style="width: 50px; height: 50px; object-fit: cover; opacity: 0.6;"></td>
        <td>${item.title}</td>
        <td style="font-size: 0.7rem; font-weight: 800; color: var(--sori-accent);">${item.category}</td>
        <td class="admin-actions">
          <a href="editor.html?id=${item.id}">Edit</a>
          <button class="del-btn" onclick="deleteItem(${item.id})">Delete</button>
        </td>
      </tr>
    `).join('');
  } catch (e) { list.innerHTML = '<tr><td colspan="4">Error loading archive.</td></tr>'; }
}

async function loadSNS() {
  const list = document.getElementById('sns-admin-list');
  try {
    const res = await fetch('/api/settings');
    const data = await res.json();
    list.innerHTML = data.map(item => `
      <tr>
        <td style="font-weight: 800; font-size: 0.7rem;">${item.key}</td>
        <td style="opacity: 0.5; font-size: 0.8rem;">${item.value}</td>
        <td class="admin-actions"><button class="del-btn" onclick="deleteSNS(${item.id})">Remove</button></td>
      </tr>
    `).join('');
  } catch (e) { }
}

function initSNSForm() {
  const form = document.getElementById('sns-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = document.getElementById('sns-key').value;
    const value = document.getElementById('sns-value').value;
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    });
    form.reset();
    loadSNS();
  });
}

window.deleteSNS = async (id) => {
  if (confirm('Remove this channel?')) {
    await fetch(`/api/settings?id=${id}`, { method: 'DELETE' });
    loadSNS();
  }
};

window.deleteItem = async (id) => {
  if (confirm('Delete this fragments?')) {
    await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
    loadPortfolio();
  }
};

async function initEditor() {
  const form = document.getElementById('editor-form');
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  if (editId) {
    const res = await fetch(`/api/portfolio?id=${editId}`);
    const data = await res.json();
    document.getElementById('title').value = data.title;
    document.getElementById('category').value = data.category;
    document.getElementById('image').value = data.image || '';
    document.getElementById('description').value = data.description || '';
    document.getElementById('content').value = data.content || '';
    document.getElementById('is_recommended').checked = data.is_recommended === 1;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      title: document.getElementById('title').value,
      category: document.getElementById('category').value,
      image: document.getElementById('image').value,
      description: document.getElementById('description').value,
      content: document.getElementById('content').value,
      is_recommended: document.getElementById('is_recommended').checked
    };
    await fetch('/api/portfolio' + (editId ? `?id=${editId}` : ''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    window.location.href = 'dashboard.html';
  });
}
