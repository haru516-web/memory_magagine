import { renderPostCard } from '../components/postCard.js';
import { getIcon } from '../components/icons.js';
import { renderAvatarContent } from '../components/avatar.js';

function uniqueAuthors(posts) {
  return [...new Set(posts.map((post) => post.authorName))];
}

function toHandle(name) {
  return `@${String(name || 'user').trim().replace(/\s+/g, '_').toLowerCase()}`;
}

function renderPostFeed(posts, emptyMessage) {
  if (!posts.length) {
    return `<p class="empty-copy">${emptyMessage}</p>`;
  }

  return `
    <div class="feed-grid feed-grid--single">
      ${posts.map((post) => renderPostCard(post, { mode: 'minimal' })).join('')}
    </div>
  `;
}

function renderIssueFeed(issues, posts) {
  if (!issues.length) {
    return '<p class="empty-copy">Saved magazine issues will appear here.</p>';
  }

  return `
    <div class="issue-list">
      ${issues.map((issue) => {
        const selectedPosts = posts.filter((post) => (issue.postIds || []).includes(post.id));
        return `
          <article class="issue-card issue-card--${issue.tone}">
            <p class="issue-card__eyebrow">memories issue</p>
            <h3 class="issue-card__title">${issue.title}</h3>
            <p class="issue-card__subtitle">${issue.subtitle || 'sub title free'}</p>
            <div class="issue-card__count">${selectedPosts.length} posts selected</div>
            <div class="issue-card__thumbs">
              ${selectedPosts.slice(0, 3).map((post) => `<img src="${post.imageData}" alt="${post.authorName} post" />`).join('')}
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

function renderOwnProfile(state, uiState, authors) {
  const ownPosts = state.posts.filter((post) => post.authorName === state.profile.name);
  const likedPosts = state.posts.filter((post) => post.liked);
  const savedPosts = state.posts.filter((post) => post.saved);
  const savedIssues = state.issues || [];
  const followingAuthors = state.followingAuthors;
  const followerAuthors = authors.filter((author) => author !== state.profile.name);
  const activeSection = uiState.profileSection || '';
  const showAvatarCropper = Boolean(uiState.profileAvatarCropOpen);
  const handle = toHandle(state.profile.name);
  const orbitRotation = Number(uiState.profileOrbitRotation || 0);

  const sectionMeta = {
    identity: { label: 'Name / ID', value: handle, angle: 0 },
    library: { label: 'Likes / Saved', value: `${likedPosts.length} / ${savedPosts.length}`, angle: 60 },
    edit: { label: 'Edit', value: 'profile', angle: 120 },
    posts: { label: 'Posts', value: String(ownPosts.length), angle: 180 },
    magazine: { label: 'Magazine', value: String(savedIssues.length), angle: 240 },
    network: { label: 'Follow', value: `${followingAuthors.length} / ${followerAuthors.length}`, angle: 300 },
  };

  const sectionButtons = [
    ['identity', sectionMeta.identity],
    ['library', sectionMeta.library],
    ['edit', sectionMeta.edit],
    ['posts', sectionMeta.posts],
    ['magazine', sectionMeta.magazine],
    ['network', sectionMeta.network],
  ];

  function renderSectionPanel() {
    switch (activeSection) {
      case 'identity':
        return `
          <section class="profile-section-panel">
            <div class="section-head">
              <h3>Name / ID</h3>
            </div>
            <div class="profile-identity-grid">
              <article class="profile-info-card">
                <span class="profile-info-card__label">Display Name</span>
                <strong>${state.profile.name}</strong>
              </article>
              <article class="profile-info-card">
                <span class="profile-info-card__label">ID</span>
                <strong>${handle}</strong>
              </article>
              <article class="profile-info-card profile-info-card--wide">
                <span class="profile-info-card__label">Bio</span>
                <p>${state.profile.bio}</p>
              </article>
            </div>
          </section>
        `;
      case 'network':
        return `
          <section class="profile-section-panel">
            <div class="section-head">
              <h3>Follow / Follower</h3>
            </div>
            <div class="profile-network-summary">
              <article class="stat-card">
                <span>Following</span>
                <strong>${followingAuthors.length}</strong>
              </article>
              <article class="stat-card">
                <span>Followers</span>
                <strong>${followerAuthors.length}</strong>
              </article>
            </div>
            <div class="profile-network-columns">
              <div>
                <p class="profile-column-title">Following</p>
                <div class="follow-list">
                  ${followingAuthors.length ? followingAuthors.map((author) => `
                    <article class="follow-item">
                      <div class="follow-item__main">
                        <div class="avatar">${author.slice(0, 1).toUpperCase()}</div>
                        <span>${author}</span>
                      </div>
                      <button class="button button--ghost is-active" type="button" data-follow-author="${author}">Following</button>
                    </article>
                  `).join('') : '<p class="empty-copy">No following yet.</p>'}
                </div>
              </div>
              <div>
                <p class="profile-column-title">Followers</p>
                <div class="follow-list">
                  ${followerAuthors.length ? followerAuthors.map((author) => `
                    <article class="follow-item">
                      <div class="follow-item__main">
                        <div class="avatar">${author.slice(0, 1).toUpperCase()}</div>
                        <span>${author}</span>
                      </div>
                      <button class="button button--ghost" type="button" data-open-author="${author}">View</button>
                    </article>
                  `).join('') : '<p class="empty-copy">No followers yet.</p>'}
                </div>
              </div>
            </div>
          </section>
        `;
      case 'library':
        return `
          <section class="profile-section-panel">
            <div class="section-head">
              <h3>Likes / Saved</h3>
            </div>
            <div class="profile-library-grid">
              <section class="profile-library-block">
                <p class="profile-column-title">Liked Posts</p>
                ${renderPostFeed(likedPosts, 'Posts you liked will appear here.')}
              </section>
              <section class="profile-library-block">
                <p class="profile-column-title">Saved Posts</p>
                ${renderPostFeed(savedPosts, 'Posts you saved will appear here.')}
              </section>
            </div>
          </section>
        `;
      case 'magazine':
        return `
          <section class="profile-section-panel">
            <div class="section-head">
              <h3>Magazine</h3>
            </div>
            ${renderIssueFeed(savedIssues, state.posts || [])}
          </section>
        `;
      case 'edit':
        return `
          <section class="profile-section-panel">
            <div class="section-head">
              <h3>Edit Profile</h3>
            </div>
            <form class="profile-form" id="profileForm">
              <section class="profile-avatar-editor">
                <div class="profile-avatar-editor__current">
                  <div class="profile-avatar-editor__preview-wrap">
                    <button
                      class="profile-avatar-editor__add"
                      type="button"
                      data-profile-avatar-upload
                      aria-label="Upload profile avatar"
                    >
                      +
                    </button>
                    <div class="profile-card__avatar profile-card__avatar--preview">
                      ${renderAvatarContent(state.profile.avatarData, (state.profile.name || 'Y').slice(0, 1).toUpperCase(), `${state.profile.name} avatar`)}
                    </div>
                  </div>
                </div>
                <input id="profileAvatarInput" type="file" accept="image/*" hidden />
                ${showAvatarCropper ? `
                  <div class="avatar-cropper" id="avatarCropper">
                    <div class="avatar-cropper__viewport" id="avatarCropSurface">
                      <img class="avatar-cropper__image" id="avatarCropImage" alt="Avatar crop preview" />
                      <div class="avatar-cropper__overlay"></div>
                      <div class="avatar-cropper__ring"></div>
                    </div>
                    <p class="avatar-cropper__hint">Drag to choose the visible area inside the circle.</p>
                  </div>
                ` : ''}
              </section>
              <label class="field">
                <span class="field__label">Display Name</span>
                <input class="field__input" type="text" name="name" maxlength="18" value="${state.profile.name}" required />
              </label>
              <label class="field">
                <span class="field__label">Bio</span>
                <textarea class="field__textarea" name="bio" maxlength="80">${state.profile.bio}</textarea>
              </label>
              <button class="button button--primary" type="submit">Save</button>
            </form>
          </section>
        `;
      case 'posts':
        return `
          <section class="profile-section-panel">
            <div class="section-head">
              <h3>Your Posts</h3>
            </div>
            ${renderPostFeed(ownPosts, 'Your posts will appear here after you publish one.')}
          </section>
        `;
      default:
        return '';
    }
  }

  return `
    <section class="page page--profile">
      <header class="page-header">
        <p class="page-header__mini">your room</p>
        <h2 class="page-header__title">Profile</h2>
      </header>

      <section
        class="profile-orbit-shell"
        data-profile-orbit
        style="--orbit-rotation: ${orbitRotation}deg;"
      >
        <div class="profile-orbit">
          <div class="profile-orbit__core" aria-hidden="true">
            <div class="profile-orbit__core-avatar">
              ${renderAvatarContent(state.profile.avatarData, (state.profile.name || 'Y').slice(0, 1).toUpperCase(), `${state.profile.name} avatar`)}
            </div>
          </div>

          ${sectionButtons.map(([key, meta]) => `
            <div class="profile-node-slot" style="--orbit-angle: ${meta.angle}deg;">
              <button
                class="profile-node ${activeSection === key ? 'is-active' : ''}"
                type="button"
                data-profile-section="${key}"
                data-orbit-angle="${meta.angle}"
                style="--node-counter-angle: ${-(meta.angle + orbitRotation)}deg;"
              >
                <span class="profile-node__label">${meta.label}</span>
                <strong class="profile-node__value">${key === 'edit' ? getIcon('compose') : meta.value}</strong>
              </button>
            </div>
          `).join('')}
        </div>
      </section>

      ${activeSection ? renderSectionPanel() : ''}
    </section>
  `;
}

function renderOtherProfile(state, viewedAuthor) {
  const authors = uniqueAuthors(state.posts || []);
  const authorPosts = state.posts.filter((post) => post.authorName === viewedAuthor);
  const isFollowing = state.followingAuthors.includes(viewedAuthor);

  return `
    <section class="page page--profile">
      <header class="page-header">
        <p class="page-header__mini">author profile</p>
        <h2 class="page-header__title">${viewedAuthor}</h2>
      </header>

      <section class="profile-card">
        <div class="profile-card__avatar">${renderAvatarContent(authorPosts[0]?.authorAvatarData, (viewedAuthor || 'Y').slice(0, 1).toUpperCase(), `${viewedAuthor} avatar`)}</div>
        <div class="profile-card__body">
          <div class="profile-card__heading">
            <div>
              <h3 class="profile-card__name">${viewedAuthor}</h3>
              <p class="profile-card__bio">${toHandle(viewedAuthor)}</p>
            </div>
            <button class="button button--ghost ${isFollowing ? 'is-active' : ''}" type="button" data-follow-author="${viewedAuthor}">
              ${isFollowing ? 'Following' : 'Follow'}
            </button>
          </div>
        </div>
      </section>

      <section class="section-block">
        <div class="section-head">
          <h3>Posts</h3>
        </div>
        ${renderPostFeed(authorPosts, 'This author has no posts yet.')}
      </section>

      <section class="section-block">
        <div class="section-head">
          <h3>Local Stats</h3>
        </div>
        <div class="stats-grid">
          <article class="stat-card"><span>Posts</span><strong>${authorPosts.length}</strong></article>
          <article class="stat-card"><span>Followers</span><strong>${authors.filter((author) => author !== viewedAuthor).length}</strong></article>
          <article class="stat-card"><span>Following</span><strong>${Number(isFollowing)}</strong></article>
        </div>
      </section>
    </section>
  `;
}

export function renderProfile(state, uiState = {}) {
  const authors = uniqueAuthors(state.posts || []);
  const viewedAuthor = uiState.profileAuthor || null;
  const isOwnProfile = !viewedAuthor || viewedAuthor === state.profile.name;

  if (!isOwnProfile) {
    return renderOtherProfile(state, viewedAuthor);
  }

  return renderOwnProfile(state, uiState, authors);
}
