// 全記事を保持する配列
let allArticles = [];

// 現在の絞り込み状態
let currentCategory = 'all';
let currentPeriod = 'all';

// --- お気に入り（localStorage） ---

const FAVORITES_KEY = 'news_favorites';

function loadFavorites() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function isFavorited(article) {
  return loadFavorites().some(f => f.link === article.link);
}

function toggleFavorite(article) {
  const favorites = loadFavorites();
  const idx = favorites.findIndex(f => f.link === article.link);
  if (idx === -1) {
    // pubDateはDate型なので文字列に変換して保存
    favorites.push({ ...article, pubDate: article.pubDate.toISOString() });
  } else {
    favorites.splice(idx, 1);
  }
  saveFavorites(favorites);
}

function renderFavorites() {
  const list = document.getElementById('favorites-list');
  const favorites = loadFavorites().map(f => ({
    ...f,
    pubDate: new Date(f.pubDate),
  }));
  if (favorites.length === 0) {
    list.innerHTML = '<p class="empty-message">お気に入りはまだありません</p>';
    return;
  }
  list.innerHTML = favorites.map(a => createFavoriteCardHtml(a)).join('');
}

function createFavoriteCardHtml(article) {
  return `
    <div class="article-card" data-link="${escapeHtml(article.link)}">
      <div class="article-card__header">
        <h2 class="article-card__title">${escapeHtml(article.title)}</h2>
        <button class="article-card__star article-card__star--saved" data-link="${escapeHtml(article.link)}" aria-label="お気に入り解除">★</button>
      </div>
      <p class="article-card__description">${escapeHtml(article.description)}</p>
      <div class="article-card__meta">
        <span>${escapeHtml(article.source)}</span>
        <span>${formatDate(article.pubDate)}</span>
      </div>
    </div>
  `;
}


// ヘッダータブの切り替え
function bindViewTabs() {
  document.querySelector('.header__tabs').addEventListener('click', e => {
    const tab = e.target.closest('.header__tab');
    if (!tab) return;

    document.querySelectorAll('.header__tab').forEach(t => t.classList.remove('header__tab--active'));
    tab.classList.add('header__tab--active');

    const view = tab.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('view--active'));
    document.getElementById(`view-${view}`).classList.add('view--active');

    if (view === 'favorites') renderFavorites();
  });
}

// 記事にカテゴリを付与する
function assignCategory(article) {
  const text = article.title + ' ' + article.description;
  for (const cat of CONFIG.CATEGORIES) {
    if (cat.keywords.length === 0) continue; // 採用全般は最後
    if (cat.keywords.some(kw => text.includes(kw))) {
      return cat.id;
    }
  }
  return 'general';
}

// カテゴリタブをDOMに生成する
function buildCategoryTabs() {
  const inner = document.querySelector('.category-nav__inner');
  CONFIG.CATEGORIES.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'category-btn';
    btn.dataset.category = cat.id;
    btn.textContent = cat.label;
    inner.appendChild(btn);
  });
}

// 期間フィルターの判定
function isInPeriod(article) {
  if (currentPeriod === 'all') return true;
  const now = new Date();
  const pub = article.pubDate;
  if (currentPeriod === 'today') {
    return pub.getFullYear() === now.getFullYear()
      && pub.getMonth() === now.getMonth()
      && pub.getDate() === now.getDate();
  }
  if (currentPeriod === 'week') {
    const msPerDay = 1000 * 60 * 60 * 24;
    return (now - pub) <= msPerDay * 7;
  }
  return true;
}

// 現在の絞り込み条件で表示を更新する
function applyFilters() {
  let filtered = allArticles;
  if (currentCategory !== 'all') {
    filtered = filtered.filter(a => a.category === currentCategory);
  }
  filtered = filtered.filter(isInPeriod);
  renderArticles(filtered);
}

// 期間フィルターのクリックを処理する
function bindPeriodEvents() {
  document.querySelector('.period-filter').addEventListener('click', e => {
    const btn = e.target.closest('.period-btn');
    if (!btn) return;

    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('period-btn--active'));
    btn.classList.add('period-btn--active');

    currentPeriod = btn.dataset.period;
    applyFilters();
  });
}

// カテゴリタブのクリックを処理する
function bindCategoryEvents() {
  document.querySelector('.category-nav__inner').addEventListener('click', e => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;

    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('category-btn--active'));
    btn.classList.add('category-btn--active');

    currentCategory = btn.dataset.category;
    applyFilters();
  });
}

// RSS1件をfetchしてarticle配列を返す
async function fetchFeed(source) {
  const url = CONFIG.RSS2JSON_API + encodeURIComponent(source.url);
  const res = await fetch(url);
  const data = await res.json();

  if (data.status !== 'ok') return [];

  return data.items.map(item => {
    const article = {
      title: item.title || '',
      description: stripHtml(item.description || item.content || ''),
      link: item.link || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      source: source.name,
    };
    article.category = assignCategory(article);
    return article;
  });
}

// HTMLタグを除去してテキストだけ取り出す
function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent.trim();
}

// 日付を「YYYY/MM/DD」形式に整形
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

// 記事カードのHTML文字列を生成（link URLをキーにして記事を特定する）
function createCardHtml(article) {
  const saved = isFavorited(article);
  return `
    <div class="article-card" data-link="${escapeHtml(article.link)}">
      <div class="article-card__header">
        <h2 class="article-card__title">${escapeHtml(article.title)}</h2>
        <button class="article-card__star ${saved ? 'article-card__star--saved' : ''}" data-link="${escapeHtml(article.link)}" aria-label="お気に入り">${saved ? '★' : '☆'}</button>
      </div>
      <p class="article-card__description">${escapeHtml(article.description)}</p>
      <div class="article-card__meta">
        <span>${escapeHtml(article.source)}</span>
        <span>${formatDate(article.pubDate)}</span>
      </div>
    </div>
  `;
}

// XSS対策
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 記事一覧を描画
function renderArticles(articles) {
  const list = document.getElementById('article-list');
  if (articles.length === 0) {
    list.innerHTML = '<p class="empty-message">記事が見つかりませんでした</p>';
    return;
  }
  list.innerHTML = articles.map(a => createCardHtml(a)).join('');
}

// カードクリックでモーダルを開く
function openModal(article) {
  document.getElementById('modal-title').textContent = article.title;
  document.getElementById('modal-description').textContent = article.description;
  document.getElementById('modal-source').textContent = article.source;
  document.getElementById('modal-date').textContent = formatDate(article.pubDate);
  document.getElementById('modal-link').href = article.link;

  const modal = document.getElementById('modal');
  modal.classList.add('modal--open');
  modal.setAttribute('aria-hidden', 'false');
}

// モーダルを閉じる
function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('modal--open');
  modal.setAttribute('aria-hidden', 'true');
}

// イベント登録
function bindEvents() {
  // ニュース一覧：☆クリック・カードクリック
  document.getElementById('article-list').addEventListener('click', e => {
    const star = e.target.closest('.article-card__star');
    if (star) {
      const article = allArticles.find(a => a.link === star.dataset.link);
      if (!article) return;
      toggleFavorite(article);
      const saved = isFavorited(article);
      star.textContent = saved ? '★' : '☆';
      star.classList.toggle('article-card__star--saved', saved);
      return;
    }
    const card = e.target.closest('.article-card');
    if (!card) return;
    const article = allArticles.find(a => a.link === card.dataset.link);
    if (article) openModal(article);
  });

  // お気に入りビュー：★クリックで解除、カードクリックでモーダル
  document.getElementById('favorites-list').addEventListener('click', e => {
    const favorites = loadFavorites().map(f => ({ ...f, pubDate: new Date(f.pubDate) }));
    const star = e.target.closest('.article-card__star');
    if (star) {
      const article = favorites.find(f => f.link === star.dataset.link);
      if (article) toggleFavorite(article);
      renderFavorites();
      return;
    }
    const card = e.target.closest('.article-card');
    if (!card) return;
    const article = favorites.find(f => f.link === card.dataset.link);
    if (article) openModal(article);
  });

  // モーダルを閉じる（×ボタン・背景クリック・ESCキー）
  document.querySelector('.modal__close').addEventListener('click', closeModal);
  document.querySelector('.modal__overlay').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// 起動
async function init() {
  buildCategoryTabs();
  bindViewTabs();
  bindEvents();
  bindCategoryEvents();
  bindPeriodEvents();

  const list = document.getElementById('article-list');
  list.innerHTML = '<div class="loading">ニュースを読み込み中...</div>';

  const results = await Promise.allSettled(
    CONFIG.RSS_SOURCES.map(source => fetchFeed(source))
  );

  allArticles = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value)
    .sort((a, b) => b.pubDate - a.pubDate);

  applyFilters();
}

document.addEventListener('DOMContentLoaded', init);
