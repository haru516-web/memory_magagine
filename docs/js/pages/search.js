import { getIcon } from '../components/icons.js';
import { filterPosts, sortRecommended } from '../utils/filter.js';

const SEARCH_SCENE_TAGS = [
  'ご飯',
  'カフェ',
  '散歩',
  'ドライブ',
  '旅行',
  'まったり',
  'おしゃれ',
  'ロマンチック',
  '記念日',
];

const SEARCH_MOOD_TAGS = [
  { label: '晴れの日', icon: 'sunLine' },
  { label: '雨の日', icon: 'cloudLine' },
  { label: '夜デート', icon: 'moonLine' },
  { label: '特別な日', icon: 'sparkleLine' },
];

function getPostTitle(post) {
  const caption = String(post.caption || '').split('/')[0].trim();
  return caption || 'Untitled';
}

function getPostExcerpt(post) {
  const caption = String(post.caption || '').trim();
  if (!caption) return '静かな記録をそっと残した一頁です。';
  return caption.length > 84 ? `${caption.slice(0, 84)}...` : caption;
}

function getPostLocation(post) {
  const tags = [...(post.fixedTags || []), ...(post.freeTags || [])].filter(Boolean);
  return tags[0] || '場所未設定';
}

function formatCardDateParts(isoDate) {
  const date = new Date(isoDate);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  return {
    year: String(date.getFullYear()),
    monthDay: `${String(date.getMonth() + 1).padStart(2, '0')} / ${String(date.getDate()).padStart(2, '0')}`,
    weekday,
  };
}

function sortSearchPosts(posts, sortMode) {
  if (sortMode === 'new') {
    return [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
  if (sortMode === 'place') {
    return [...posts].sort((a, b) => getPostLocation(a).localeCompare(getPostLocation(b), 'ja'));
  }
  return sortRecommended(posts);
}

function renderSearchChip(tag, selectedTags, options = {}) {
  const { icon = '' } = options;
  return `
    <button class="search-chip ${selectedTags.includes(tag) ? 'is-active' : ''}" type="button" data-search-tag="${tag}">
      ${icon ? `<span class="search-chip__icon">${getIcon(icon)}</span>` : ''}
      <span>${tag}</span>
    </button>
  `;
}

function renderSearchSection(title, tags, selectedTags, options = {}) {
  const { withIcons = false, sectionKey = '' } = options;
  const chipsMarkup = withIcons
    ? tags.map((tag) => renderSearchChip(tag.label, selectedTags, { icon: tag.icon })).join('')
    : tags.map((tag) => renderSearchChip(tag, selectedTags)).join('');

  return `
    <section class="search-section">
      <div class="search-section__head">
        <div class="search-section__title-wrap">
          <h3 class="search-section__title">${title}</h3>
          <span class="search-section__line"></span>
        </div>
        <button class="search-section__more" type="button" data-search-clear-section="${sectionKey}">
          <span>すべて見る</span>
          ${getIcon('chevronRight')}
        </button>
      </div>
      <div class="search-chip-grid">
        ${chipsMarkup}
      </div>
    </section>
  `;
}

function renderSortButton(value, label, activeSort, icon = '') {
  return `
    <button class="search-sort-button ${activeSort === value ? 'is-active' : ''}" type="button" data-search-sort="${value}">
      ${icon ? `<span class="search-sort-button__icon">${getIcon(icon)}</span>` : ''}
      <span>${label}</span>
    </button>
  `;
}

function renderSearchResultCard(post) {
  const title = getPostTitle(post);
  const excerpt = getPostExcerpt(post);
  const location = getPostLocation(post);
  const date = formatCardDateParts(post.createdAt);

  return `
    <article class="search-result-card" data-post-id="${post.id}">
      <button class="search-result-card__body" type="button" data-open-preview="${post.id}" aria-label="Open ${title}">
        <div class="search-result-card__head">
          <h3 class="search-result-card__title">${title}</h3>
          <p class="search-result-card__lede">${excerpt}</p>
        </div>
        <div class="search-result-card__layout">
          <div class="search-result-card__media-wrap">
            <img class="search-result-card__media" src="${post.imageData}" alt="${title}" />
          </div>
          <div class="search-result-card__aside">
            <div class="search-result-card__note-block"></div>
            <p class="search-result-card__note">${excerpt}</p>
            <div class="search-result-card__date">
              <span>${date.year}</span>
              <strong>${date.monthDay}</strong>
              <small>${date.weekday}</small>
            </div>
          </div>
        </div>
      </button>
      <div class="search-result-card__meta">
        <p class="search-result-card__location">
          <span class="search-result-card__location-icon">${getIcon('pin')}</span>
          <span>${location}</span>
        </p>
        <p class="search-result-card__caption">${excerpt}</p>
      </div>
    </article>
  `;
}

export function renderSearch(state, uiState) {
  const selectedTags = uiState.searchTags || [];
  const activeSort = uiState.searchSort || 'popular';
  const filteredPosts = filterPosts(state.posts || [], {
    query: uiState.searchQuery || '',
    tags: selectedTags,
  });
  const posts = sortSearchPosts(filteredPosts, activeSort);
  const resultsMarkup = posts.length
    ? `
      <section class="search-results">
        <div class="search-results-grid">
          ${posts.map((post) => renderSearchResultCard(post)).join('')}
        </div>
      </section>
    `
    : `
      <section class="search-empty">
        <p class="search-empty__title">見つかる投稿がまだありません</p>
        <p class="search-empty__copy">作者名・タグ・キャプションの組み合わせを変えて、静かな記録を探してみてください。</p>
      </section>
    `;

  return `
    <section class="page page--search">
      <div class="search-shell">
        <div class="search-shell__surface">
          <div class="search-shell__field">
            <span class="search-shell__field-icon">${getIcon('searchLine')}</span>
            <input
              class="search-shell__input"
              id="searchInput"
              type="search"
              value="${uiState.searchQuery || ''}"
              placeholder="作者名・タグ・キャプションで検索"
            />
          </div>

          ${renderSearchSection('シーンで探す', SEARCH_SCENE_TAGS, selectedTags, { sectionKey: 'scene' })}
          ${renderSearchSection('気分で探す', SEARCH_MOOD_TAGS, selectedTags, { withIcons: true, sectionKey: 'mood' })}

          <div class="search-sort-bar" role="tablist" aria-label="Search sorting">
            ${renderSortButton('popular', '人気順', activeSort)}
            ${renderSortButton('new', '新着', activeSort)}
            ${renderSortButton('place', '場所', activeSort, 'filter')}
          </div>

          ${resultsMarkup}
        </div>
      </div>
    </section>
  `;
}
