// ===== 数据管理 =====
let capsules = [];
let currentImage = null;

// 初始化
function init() {
  loadCapsules();
  
  // 设置最小日期为明天
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById('input-date').min = tomorrow.toISOString().split('T')[0];
  
  // 监听路由
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

// 加载胶囊数据
function loadCapsules() {
  const stored = localStorage.getItem('time_capsules');
  if (stored) {
    capsules = JSON.parse(stored);
  }
}

// 保存胶囊数据
function saveCapsules() {
  localStorage.setItem('time_capsules', JSON.stringify(capsules));
}

// ===== 路由 =====
function navigate(view, id = null) {
  if (id) {
    window.location.hash = `${view}/${id}`;
  } else {
    window.location.hash = view;
  }
}

function handleRoute() {
  const hash = window.location.hash.slice(1) || 'home';
  const [view, id] = hash.split('/');
  
  showPage(view, id);
}

function showPage(view, id) {
  // 隐藏所有页面
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  
  // 显示目标页面
  const page = document.getElementById(`page-${view}`);
  if (page) {
    page.style.display = 'flex';
  }
  
  // 执行页面逻辑
  if (view === 'list') {
    renderCapsuleList();
  } else if (view === 'open' && id) {
    openCapsule(id);
  } else if (view === 'create') {
    resetCreateForm();
  }
}

// ===== 创建胶囊 =====
function previewImage() {
  const file = document.getElementById('input-image').files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    currentImage = e.target.result;
    const preview = document.getElementById('image-preview');
    preview.innerHTML = `<img src="${currentImage}" alt="preview">`;
    preview.style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function resetCreateForm() {
  document.getElementById('input-title').value = '';
  document.getElementById('input-content').value = '';
  document.getElementById('input-image').value = '';
  document.getElementById('image-preview').style.display = 'none';
  currentImage = null;
}

function saveCapsule() {
  const title = document.getElementById('input-title').value.trim();
  const content = document.getElementById('input-content').value.trim();
  const openDate = document.getElementById('input-date').value;
  
  if (!content) {
    alert('请填写内容');
    return false;
  }
  
  if (!openDate) {
    alert('请选择开启日期');
    return false;
  }
  
  const capsule = {
    id: Date.now().toString(),
    title: title || '无标题',
    content: content,
    image: currentImage,
    createdAt: new Date().toISOString(),
    openAt: new Date(openDate).toISOString(),
    opened: false
  };
  
  capsules.push(capsule);
  saveCapsules();
  
  navigate('list');
  return false;
}

// ===== 胶囊列表 =====
function renderCapsuleList() {
  const grid = document.getElementById('capsule-grid');
  
  if (capsules.length === 0) {
    grid.innerHTML = '<div class="empty-state">暂无胶囊</div>';
    return;
  }
  
  // 按开启时间排序
  const sorted = [...capsules].sort((a, b) => new Date(a.openAt) - new Date(b.openAt));
  
  let html = '';
  sorted.forEach(cap => {
    const openTime = new Date(cap.openAt);
    const now = new Date();
    const canOpen = openTime <= now;
    
    const statusClass = canOpen ? 'opened' : 'sealed';
    const statusText = canOpen ? '可开启' : '已封存';
    
    let countdown = '';
    if (!canOpen) {
      const diff = openTime - now;
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      countdown = `${days}天后开启`;
    }
    
    html += `
      <div class="capsule-card ${statusClass}" onclick="navigate('open', '${cap.id}')">
        <div class="capsule-title">${cap.title}</div>
        <div class="capsule-date">${formatDate(openTime)}</div>
        <div class="capsule-status ${statusClass}">${statusText}</div>
        ${countdown ? `<div class="capsule-countdown">${countdown}</div>` : ''}
      </div>
    `;
  });
  
  grid.innerHTML = html;
}

// ===== 开启胶囊 =====
function openCapsule(id) {
  const capsule = capsules.find(c => c.id === id);
  if (!capsule) {
    navigate('list');
    return;
  }
  
  const openTime = new Date(capsule.openAt);
  const now = new Date();
  
  if (openTime > now) {
    alert('胶囊尚未到达开启时间');
    navigate('list');
    return;
  }
  
  // 标记已开启
  capsule.opened = true;
  saveCapsules();
  
  // 渲染内容
  const header = document.getElementById('open-time');
  header.textContent = `封存于 ${formatDate(new Date(capsule.createdAt))}`;
  
  const body = document.getElementById('open-body');
  let html = `
    <div class="open-title">${capsule.title}</div>
    <div class="open-text">${capsule.content}</div>
  `;
  
  if (capsule.image) {
    html += `<img class="open-image" src="${capsule.image}" alt="image">`;
  }
  
  html += `
    <div class="open-meta">
      开启于 ${formatDate(openTime)}
    </div>
  `;
  
  body.innerHTML = html;
}

// ===== 工具函数 =====
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d}`;
}

// 启动
document.addEventListener('DOMContentLoaded', init);