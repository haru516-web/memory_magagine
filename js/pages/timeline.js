import { renderPostCard } from '../components/postCard.js';
import { renderTopTabs } from '../components/topTabs.js';
import { sortRecommended } from '../utils/filter.js';

function getTimelinePosts(state, activeTab) {
  const posts = state.posts || [];
  if (activeTab === 'following') {
    return posts.filter((post) => state.followingAuthors.includes(post.authorName));
  }
  return sortRecommended(posts);
}

export function renderTimeline(state, uiState) {
  const posts = getTimelinePosts(state, uiState.timelineTab);
  return `
    <section class="page page--timeline">
      <header class="page-header">
        <p class="page-header__mini">memories timeline</p>
        <h2 class="page-header__title">Timeline</h2>
      </header>

      ${renderTopTabs(uiState.timelineTab)}

      <div class="feed-grid feed-grid--single">
        ${posts.length ? posts.map((post) => renderPostCard(post, { mode: 'minimal' })).join('') : `
          <section class="empty-panel">
            <p class="empty-panel__title">No posts yet</p>
            <p class="empty-panel__copy">Create a page in Compose and it will appear here.</p>
          </section>
        `}
      </div>
    </section>
  `;
}
