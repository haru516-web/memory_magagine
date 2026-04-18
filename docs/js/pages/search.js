import { renderPostCard } from '../components/postCard.js';
import { ALL_FIXED_TAGS } from '../data/tags.js';
import { filterPosts } from '../utils/filter.js';

function renderSearchTags(selectedTags) {
  return ALL_FIXED_TAGS.map((tag) => `
    <button class="chip chip--filter ${selectedTags.includes(tag) ? 'is-active' : ''}" data-search-tag="${tag}">${tag}</button>
  `).join('');
}

export function renderSearch(state, uiState) {
  const selectedTags = uiState.searchTags || [];
  const posts = filterPosts(state.posts || [], { query: uiState.searchQuery || '', tags: selectedTags });
  const resultsMarkup = posts.length
    ? `
      <div class="feed-grid">
        ${posts.map((post) => renderPostCard(post, { mode: 'compact' })).join('')}
      </div>
    `
    : `
      <section class="empty-panel">
        <p class="empty-panel__title">条件に合う投稿がまだありません</p>
        <p class="empty-panel__copy">タグや検索語を変えるか、先に投稿を作成してください。</p>
      </section>
    `;

  return `
    <section class="page page--search">
      <header class="page-header page-header--with-back">
        <button class="button button--ghost page-back" type="button" data-home-nav="home">Back</button>
        <div>
          <p class="page-header__mini">discover</p>
          <h2 class="page-header__title">Search</h2>
        </div>
      </header>

      <div class="search-box">
        <input class="field__input field__input--search" id="searchInput" type="search" value="${uiState.searchQuery || ''}" placeholder="作者名・タグ・キャプションで検索" />
      </div>

      <div class="tag-filter-row">
        ${renderSearchTags(selectedTags)}
      </div>

      ${resultsMarkup}
    </section>
  `;
}
