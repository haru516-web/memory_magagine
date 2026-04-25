import { getIcon } from '../components/icons.js';
import { renderAvatarContent } from '../components/avatar.js';
import { formatDate } from '../utils/date.js';

function uniqueAuthors(posts) {
  return [...new Set(posts.map((post) => post.authorName))];
}

function toHandle(name) {
  return `@${String(name || 'user').trim().replace(/\s+/g, '.').toLowerCase()}`;
}

function getPostTitle(post) {
  const headline = String(post.composeData?.headline || '').trim();
  if (headline && headline.toLowerCase() !== 'text') return headline;
  const caption = String(post.caption || '').split('/')[0].trim();
  return caption || 'Untitled';
}

function getPostExcerpt(post) {
  const source = [
    post.composeData?.subhead,
    post.composeData?.intro,
    post.composeData?.body,
    post.caption,
  ]
    .map((value) => String(value || '').trim())
    .find((value) => value && value.toLowerCase() !== 'text');
  return source || 'A page kept close.';
}

function getDraftTitle(draft) {
  const title = String(draft.title || draft.composeData?.headline || '').trim();
  return title && title.toLowerCase() !== 'text' ? title : 'Untitled';
}

function getDraftPreview(draft) {
  return draft.composeData?.standardFiles?.primary?.file || '';
}

function getDraftTagSummary(draft) {
  const fixedTags = Array.isArray(draft.composeData?.fixedTags) ? draft.composeData.fixedTags : [];
  const freeTags = Array.isArray(draft.composeData?.freeTags) ? draft.composeData.freeTags : [];
  const tags = [...fixedTags, ...freeTags].filter(Boolean);
  return tags.length ? tags.slice(0, 2).join(' · ') : 'Needs tags';
}

function monthKeyFromDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function monthLabelFromKey(key) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, Math.max(0, month - 1), 1);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(date);
}

function groupPostsByMonth(posts) {
  const groups = new Map();
  posts.forEach((post) => {
    const key = monthKeyFromDate(post.createdAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(post);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({ key, label: monthLabelFromKey(key), posts: items }));
}

function collectOwnTags(posts) {
  return [...new Set(posts.flatMap((post) => [...(post.fixedTags || []), ...(post.freeTags || [])].filter(Boolean)))];
}

function renderArchiveCard(post) {
  const title = getPostTitle(post);

  return `
    <article class="profile-archive-card" data-post-id="${post.id}">
      <button class="profile-archive-card__media" type="button" data-open-preview="${post.id}" aria-label="Open ${title}">
        <img src="${post.imageData}" alt="${title}" />
      </button>
    </article>
  `;
}

function renderDraftCard(draft) {
  const preview = getDraftPreview(draft);
  return `
    <article class="profile-draft-card">
      <button class="profile-draft-card__menu" type="button" data-toggle-draft-menu="${draft.id}" aria-label="Open draft menu" aria-expanded="false">
        ${getIcon('more')}
      </button>
      <div class="profile-draft-card__actions" data-draft-actions="${draft.id}" hidden>
        <button type="button" data-open-draft="${draft.id}">編集に戻る</button>
        <button type="button" data-publish-draft="${draft.id}">投稿する</button>
        <button type="button" data-delete-draft="${draft.id}" class="profile-draft-card__action-danger">削除する</button>
      </div>
      <button class="profile-draft-card__body" type="button" data-open-draft="${draft.id}">
        <div class="profile-draft-card__copy">
          <h4 class="profile-draft-card__title">${getDraftTitle(draft)}</h4>
          <p class="profile-draft-card__date">${draft.updatedAt ? `Edited ${formatDate(draft.updatedAt)}` : 'No date'}</p>
        </div>
        ${preview
          ? `<div class="profile-draft-card__media"><img src="${preview}" alt="${getDraftTitle(draft)} draft" /></div>`
          : '<div class="profile-draft-card__media profile-draft-card__media--empty"><span>Draft</span></div>'}
        <p class="profile-draft-card__status">${getDraftTagSummary(draft)}</p>
      </button>
    </article>
  `;
}

function renderMonthSections(posts) {
  const grouped = groupPostsByMonth(posts);
  if (!grouped.length) {
    return '<p class="empty-copy">Your pages will appear here after you publish one.</p>';
  }

  return grouped.map((group) => `
    <section class="profile-month-group">
      <div class="profile-month-group__head">
        <p class="profile-month-group__label">${group.label}</p>
      </div>
      <div class="profile-archive-grid">
        ${group.posts.map((post) => renderArchiveCard(post)).join('')}
      </div>
    </section>
  `).join('');
}

function renderFindPanel(posts, uiState) {
  const activeTags = uiState.profileFindTags || [];
  const activeMonth = uiState.profileFindMonth || '';
  const query = String(uiState.profileFindQuery || '').trim().toLowerCase();
  const tagPool = collectOwnTags(posts);
  const monthPool = [...new Set(posts.map((post) => monthKeyFromDate(post.createdAt)))].sort().reverse();
  const filtered = posts.filter((post) => {
    const tags = [...(post.fixedTags || []), ...(post.freeTags || [])];
    const title = getPostTitle(post).toLowerCase();
    const caption = String(post.caption || '').toLowerCase();
    const monthKey = monthKeyFromDate(post.createdAt);
    const matchesQuery = !query || [title, caption, ...tags.map((tag) => tag.toLowerCase())].some((value) => value.includes(query));
    const matchesTags = !activeTags.length || activeTags.every((tag) => tags.includes(tag));
    const matchesMonth = !activeMonth || monthKey === activeMonth;
    return matchesQuery && matchesTags && matchesMonth;
  });

  return `
    <section class="profile-find-panel">
      <label class="profile-find-search">
        ${getIcon('search')}
        <input id="profileFindInput" type="search" value="${uiState.profileFindQuery || ''}" placeholder="Search your pages" />
      </label>
      <div class="profile-find-filters">
        ${tagPool.map((tag) => `
          <button class="profile-filter-chip ${activeTags.includes(tag) ? 'is-active' : ''}" type="button" data-profile-find-tag="${tag}">${tag}</button>
        `).join('')}
        ${monthPool.map((month) => `
          <button class="profile-filter-chip profile-filter-chip--soft ${activeMonth === month ? 'is-active' : ''}" type="button" data-profile-find-month="${month}">${monthLabelFromKey(month)}</button>
        `).join('')}
        <button class="profile-filter-chip profile-filter-chip--clear" type="button" data-profile-find-clear>Clear</button>
      </div>
      <p class="profile-find-meta">${filtered.length} results</p>
      <div class="profile-archive-grid">
        ${filtered.length ? filtered.map((post) => renderArchiveCard(post)).join('') : '<p class="empty-copy">No pages matched that combination.</p>'}
      </div>
    </section>
  `;
}

function renderEditPanel(state, showAvatarCropper) {
  return `
    <section class="profile-edit-panel">
      <div class="section-head">
        <h3>Edit profile</h3>
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
}

function renderOwnProfile(state, uiState, authors) {
  const ownPosts = state.posts
    .filter((post) => post.authorName === state.profile.name)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const drafts = (state.drafts || [])
    .slice()
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  const followingAuthors = state.followingAuthors || [];
  const followerAuthors = authors.filter((author) => author !== state.profile.name);
  const activeSection = uiState.profileSection || 'pages';
  const showAvatarCropper = Boolean(uiState.profileAvatarCropOpen);
  const handle = toHandle(state.profile.name);
  const profileBio = state.profile.bio || 'Collecting the little moments that make life beautiful.';
  const avatarMarkup = renderAvatarContent(
    state.profile.avatarData,
    (state.profile.name || 'Y').slice(0, 1).toUpperCase(),
    `${state.profile.name} avatar`,
  );

  const tabs = [
    { id: 'pages', label: 'Pages' },
    { id: 'find', label: 'Find' },
    { id: 'drafts', label: 'Drafts' },
  ];

  let panelMarkup = '';
  if (activeSection === 'find') {
    panelMarkup = renderFindPanel(ownPosts, uiState);
  } else if (activeSection === 'drafts') {
    panelMarkup = drafts.length
      ? `<div class="profile-draft-grid">${drafts.map((draft) => renderDraftCard(draft)).join('')}</div>`
      : '<p class="empty-copy">Unfinished pages will appear here.</p>';
  } else if (activeSection === 'edit') {
    panelMarkup = renderEditPanel(state, showAvatarCropper);
  } else {
    panelMarkup = renderMonthSections(ownPosts);
  }

  return `
    <section class="page page--profile page--profile-journal">
      <section class="profile-journal-shell">
        <header class="profile-journal-head">
          <button class="profile-journal-icon" type="button" data-profile-open-edit aria-label="Edit profile">
            ${getIcon('settings')}
          </button>
          <button class="profile-journal-icon" type="button" aria-label="Notifications">
            ${getIcon('bell')}
          </button>
        </header>

        <section class="profile-journal-hero">
          <div class="profile-journal-avatar">${avatarMarkup}</div>
          <div class="profile-journal-meta">
            <div class="profile-journal-title-row">
              <h2 class="profile-journal-title">${state.profile.name}</h2>
              <span class="profile-journal-mark">${getIcon('heart')}</span>
            </div>
            <p class="profile-journal-handle">${handle}</p>
            <p class="profile-journal-bio">${profileBio}</p>
          </div>
        </section>

        <div class="profile-journal-stats">
          <span><strong>${ownPosts.length}</strong> Pages</span>
          <span><strong>${followingAuthors.length}</strong> Following</span>
          <span><strong>${followerAuthors.length}</strong> Followers</span>
        </div>

        ${activeSection === 'edit'
          ? ''
          : `
            <nav class="profile-journal-tabs" aria-label="Profile sections">
              ${tabs.map((tab) => `
                <button class="profile-journal-tab ${activeSection === tab.id ? 'is-active' : ''}" type="button" data-profile-tab="${tab.id}">${tab.label}</button>
              `).join('')}
            </nav>
          `}

        <section class="profile-journal-panel">
          ${panelMarkup}
        </section>
      </section>
    </section>
  `;
}

function renderOtherProfile(state, viewedAuthor) {
  const authorPosts = state.posts.filter((post) => post.authorName === viewedAuthor);
  const isFollowing = state.followingAuthors.includes(viewedAuthor);

  return `
    <section class="page page--profile">
      <header class="page-header page-header--with-back">
        <button class="button button--ghost page-back page-back--icon" type="button" data-close-profile aria-label="Back">
          ${getIcon('returnLeft')}
        </button>
        <div>
          <p class="page-header__mini">author profile</p>
          <h2 class="page-header__title">${viewedAuthor}</h2>
        </div>
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
        <div class="profile-archive-grid">
          ${authorPosts.length ? authorPosts.map((post) => renderArchiveCard(post)).join('') : '<p class="empty-copy">This author has no posts yet.</p>'}
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
