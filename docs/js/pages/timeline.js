import { getIcon } from '../components/icons.js';
import { renderAvatarContent } from '../components/avatar.js';
import { sortRecommended } from '../utils/filter.js';

function getTimelinePosts(state, activeTab) {
  const posts = state.posts || [];
  if (activeTab === 'following') {
    return posts.filter((post) => state.followingAuthors.includes(post.authorName));
  }
  return sortRecommended(posts);
}

export function renderTimelineFeedCard(post, options = {}) {
  const { showActions = true } = options;

  return `
    <article class="timeline-feed-card">
      <button class="timeline-feed-card__image-button" type="button" data-open-preview="${post.id}" aria-label="Open ${post.authorName} post">
        <img class="timeline-feed-card__image" src="${post.imageData}" alt="${post.authorName} post" />
      </button>
      <div class="timeline-feed-card__footer">
        ${showActions ? `
          <div class="timeline-feed-card__actions">
            <button class="timeline-feed-card__action ${post.liked ? 'is-active' : ''}" type="button" data-like="${post.id}" aria-label="Like post">
              <span aria-hidden="true">${getIcon('heart')}</span>
            </button>
            <button class="timeline-feed-card__action ${post.saved ? 'is-active' : ''}" type="button" data-save="${post.id}" aria-label="Save post">
              <span aria-hidden="true">${getIcon('save')}</span>
            </button>
            <button class="timeline-feed-card__action" type="button" data-comment="${post.id}" aria-label="Open comments">
              <span aria-hidden="true">${getIcon('comment')}</span>
            </button>
          </div>
        ` : '<span aria-hidden="true"></span>'}
        <button class="avatar avatar-button timeline-feed-card__author" type="button" data-open-author="${post.authorName}" aria-label="Open ${post.authorName} profile">
          ${renderAvatarContent(post.authorAvatarData, post.authorIcon, `${post.authorName} avatar`)}
        </button>
      </div>
    </article>
  `;
}

function renderEditorialTimeline(state, uiState) {
  const posts = getTimelinePosts(state, uiState.timelineTab);
  const nextTab = uiState.timelineTab === 'following' ? 'recommended' : 'following';
  const filterLabel = uiState.timelineTab === 'following'
    ? 'Switch to recommended posts'
    : 'Switch to following posts';

  return `
    <section class="page timeline-page">
      <div class="timeline-screen timeline-screen--editorial">
        <header class="timeline-screen__masthead">
          <div class="timeline-screen__logo" aria-label="BURN">BURN</div>
          <button class="timeline-screen__filter-button" type="button" data-timeline-tab="${nextTab}" aria-label="${filterLabel}">
            <span aria-hidden="true">${getIcon('sliders')}</span>
          </button>
        </header>

        <div class="timeline-feed" role="list">
          ${posts.length
            ? posts.map((post) => renderTimelineFeedCard(post)).join('')
            : `
              <div class="timeline-field__empty">
                <p class="timeline-field__empty-title">No posts yet</p>
                <p class="timeline-field__empty-copy">Create your first memory and it will appear here.</p>
              </div>
            `}
        </div>
      </div>
    </section>
  `;
}

export function renderHome(state, uiState) {
  return renderEditorialTimeline(state, uiState);
}

export function renderTimeline(state, uiState) {
  return renderEditorialTimeline(state, uiState);
}
