import { formatDateTime } from '../utils/date.js';
import { getIcon } from '../components/icons.js';
import { renderAvatarContent } from '../components/avatar.js';

export function renderPostDetail(post, options = {}) {
  if (!post) {
    return `
      <section class="page page--post-detail">
        <header class="page-header page-header--with-back">
          <button class="button button--ghost page-back page-back--icon" type="button" data-close-post-detail aria-label="Back">
            ${getIcon('returnLeft')}
          </button>
          <div>
            <p class="page-header__mini">post view</p>
            <h2 class="page-header__title">Post</h2>
          </div>
        </header>
        <section class="empty-panel">
          <p class="empty-panel__title">Post not found</p>
        </section>
      </section>
    `;
  }

  const { canDelete = false, canEdit = false } = options;
  const tags = [...(post.fixedTags || []), ...(post.freeTags || [])];

  return `
    <section class="page page--post-detail">
      <header class="page-header page-header--with-back">
        <button class="button button--ghost page-back page-back--icon" type="button" data-close-post-detail aria-label="Back">
          ${getIcon('returnLeft')}
        </button>
        <div>
          <p class="page-header__mini">post view</p>
          <h2 class="page-header__title">Post</h2>
        </div>
      </header>

      <article class="post-detail-card">
        <div class="post-detail-card__author-row">
          <button class="avatar avatar-button" type="button" data-open-author="${post.authorName}" aria-label="Open ${post.authorName} profile">
            ${renderAvatarContent(post.authorAvatarData, post.authorIcon, `${post.authorName} avatar`)}
          </button>
          <div>
            <p class="post-card__author">${post.authorName}</p>
            <p class="post-card__time">${formatDateTime(post.createdAt)}</p>
          </div>
        </div>

        <img class="post-detail-card__image" src="${post.imageData}" alt="${post.authorName} post image" />

        ${post.caption ? `<p class="post-detail-card__caption">${post.caption}</p>` : ''}

        ${tags.length ? `
          <div class="post-detail-card__tags">
            ${tags.map((tag) => `<span class="chip chip--soft">${tag}</span>`).join('')}
          </div>
        ` : ''}

        <div class="post-detail-card__meta">
          <div class="post-card__actions">
            <button class="icon-button ${post.liked ? 'is-active' : ''}" data-like="${post.id}" aria-label="Like post">
              ${getIcon('heart')}
              <span>${post.likes}</span>
            </button>
            <button class="icon-button" data-comment="${post.id}" aria-label="Open comments">
              ${getIcon('comment')}
              <span>${post.comments?.length || 0}</span>
            </button>
            <button class="icon-button ${post.saved ? 'is-active' : ''}" data-save="${post.id}" aria-label="Save post">
              ${getIcon('save')}
              <span>${post.saves}</span>
            </button>
          </div>
          ${(canEdit || canDelete) ? `
            <div class="post-detail-card__owner-actions">
              ${canEdit ? `
                <button class="button button--ghost post-detail-card__edit" type="button" data-edit-post="${post.id}" aria-label="Edit post">
                  ${getIcon('edit')}
                </button>
              ` : ''}
              ${canDelete ? `
                <button class="button button--ghost post-detail-card__delete" type="button" data-delete-post="${post.id}" aria-label="Delete post">
                  ${getIcon('trash')}
                </button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </article>
    </section>
  `;
}
