import { renderAvatarContent } from '../components/avatar.js';
import { getIcon } from '../components/icons.js';
import { sortRecommended } from '../utils/filter.js';

function resolveHomeTheme(mode) {
  if (mode === 'system') {
    const prefersDark = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

function getThemeLabel(mode) {
  if (mode === 'system') return 'System';
  return mode === 'dark' ? 'Dark' : 'White';
}

function getThemeMeta(mode, resolvedTheme) {
  if (mode === 'system') {
    return `OS ${resolvedTheme === 'dark' ? 'Dark' : 'White'}`;
  }
  return 'Tap to switch';
}

function getTimelinePosts(state, activeTab) {
  const posts = state.posts || [];
  if (activeTab === 'following') {
    return posts.filter((post) => state.followingAuthors.includes(post.authorName));
  }
  return sortRecommended(posts);
}

const TIMELINE_BOARD_SLOTS = [
  { x: 70, y: 78, w: 210, h: 300 },
  { x: 382, y: 116, w: 122, h: 148 },
  { x: 566, y: 82, w: 214, h: 320 },
  { x: 78, y: 448, w: 214, h: 304 },
  { x: 360, y: 318, w: 204, h: 434 },
  { x: 598, y: 470, w: 190, h: 260 },
  { x: 88, y: 834, w: 156, h: 196 },
  { x: 344, y: 786, w: 182, h: 264 },
  { x: 640, y: 872, w: 142, h: 172 },
];

const TIMELINE_BOARD_WIDTH = 860;
const TIMELINE_BOARD_HEIGHT = 1120;
const TIMELINE_BOARD_GAP_X = 980;
const TIMELINE_BOARD_GAP_Y = 1260;

function getTimelineBoardPlacement(boardIndex) {
  const column = boardIndex % 2;
  const row = Math.floor(boardIndex / 2);
  return {
    x: 120 + (column * TIMELINE_BOARD_GAP_X),
    y: 80 + (row * TIMELINE_BOARD_GAP_Y),
  };
}

function renderTimelineParticleCard(post, slot, boardOffset) {
  return `
    <article
      class="timeline-particle"
      style="left:${boardOffset.x + slot.x}px; top:${boardOffset.y + slot.y}px; width:${slot.w}px; height:${slot.h}px;"
    >
      <button class="timeline-particle__author" type="button" data-open-author="${post.authorName}" aria-label="Open ${post.authorName} profile">
        ${renderAvatarContent(post.authorAvatarData, post.authorIcon, `${post.authorName} avatar`)}
      </button>
      <button class="timeline-particle__image-button" type="button" data-open-preview="${post.id}" aria-label="Open ${post.authorName} post">
        <img class="timeline-particle__image" src="${post.imageData}" alt="${post.authorName} post" />
      </button>
    </article>
  `;
}

function renderTimelineField(posts) {
  const boardCount = Math.max(1, Math.ceil(posts.length / TIMELINE_BOARD_SLOTS.length));
  const boards = Array.from({ length: boardCount }, (_, index) => {
    const placement = getTimelineBoardPlacement(index);
    const boardPosts = posts.slice(
      index * TIMELINE_BOARD_SLOTS.length,
      (index + 1) * TIMELINE_BOARD_SLOTS.length,
    );
    return {
      placement,
      html: `
        <section
          class="timeline-board"
          style="left:${placement.x}px; top:${placement.y}px; width:${TIMELINE_BOARD_WIDTH}px; height:${TIMELINE_BOARD_HEIGHT}px;"
          aria-hidden="true"
        ></section>
        ${boardPosts.map((post, slotIndex) => renderTimelineParticleCard(post, TIMELINE_BOARD_SLOTS[slotIndex], placement)).join('')}
      `,
    };
  });

  if (!posts.length) {
    return {
      width: 1280,
      height: 1120,
      html: `
        <div class="timeline-field__empty">
        <p class="timeline-field__empty-title">No posts yet</p>
        <p class="timeline-field__empty-copy">Create your first memory and it will appear here.</p>
      </div>
      `,
    };
  }

  const lastBoard = getTimelineBoardPlacement(boardCount - 1);
  return {
    width: lastBoard.x + TIMELINE_BOARD_WIDTH + 140,
    height: lastBoard.y + TIMELINE_BOARD_HEIGHT + 140,
    html: boards.map((board) => board.html).join(''),
  };
}

export function renderHome(state, uiState) {
  const homeThemeMode = uiState?.homeTheme || 'dark';
  const homeTheme = resolveHomeTheme(homeThemeMode);
  const homeCoreState = uiState?.homeCoreState || 'default';
  const toggleLabel = getThemeLabel(homeThemeMode);
  const toggleMeta = getThemeMeta(homeThemeMode, homeTheme);

  return `
    <section class="page orbit-home orbit-home--${homeTheme} orbit-home--mode-${homeThemeMode} orbit-home--${homeCoreState}">
      <div class="orbit-stage">
        <button class="orbit-node orbit-node--theme orbit-node--theme-mode-${homeThemeMode}" type="button" data-home-theme-toggle aria-label="Switch main page theme">
          <strong class="orbit-node__title">${toggleLabel}</strong>
          <span class="orbit-node__meta">${toggleMeta}</span>
        </button>
        <div class="orbit-stage__noise" aria-hidden="true"></div>
        <div class="orbit-stage__glow orbit-stage__glow--a" aria-hidden="true"></div>
        <div class="orbit-stage__glow orbit-stage__glow--b" aria-hidden="true"></div>
        <div class="orbit-stage__glow orbit-stage__glow--c" aria-hidden="true"></div>

        <button class="orbit-node orbit-node--timeline" type="button" data-home-nav="timeline">
          <span class="orbit-node__icon" aria-hidden="true">${getIcon('timeline')}</span>
          <strong class="orbit-node__title">Timeline</strong>
        </button>

        <button class="orbit-node orbit-node--profile" type="button" data-home-nav="profile">
          <span class="orbit-node__icon" aria-hidden="true">${getIcon('profile')}</span>
          <strong class="orbit-node__title">Profile</strong>
        </button>

        <button class="orbit-node orbit-node--search" type="button" data-home-nav="search">
          <span class="orbit-node__icon" aria-hidden="true">${getIcon('search')}</span>
          <strong class="orbit-node__title">Search</strong>
        </button>

        <button class="orbit-node orbit-node--compose" type="button" data-home-nav="compose">
          <span class="orbit-node__icon" aria-hidden="true">${getIcon('compose')}</span>
          <strong class="orbit-node__title">Post</strong>
        </button>

        <button class="orbit-core orbit-core--button" type="button" data-home-core-toggle aria-label="Reveal hidden home mark">
          <span class="orbit-core__surface">
            <img class="orbit-core__mark" src="image/icon/icon_toka.png" alt="" />
          </span>
        </button>

        <button class="orbit-sheep" type="button" data-home-sheep-toggle aria-label="Return to main page">
          <img class="orbit-sheep__mark" src="image/icon/hitsuji_toka.png" alt="" />
        </button>
      </div>
    </section>
  `;
}

export function renderTimeline(state, uiState) {
  const posts = getTimelinePosts(state, uiState.timelineTab);
  const field = renderTimelineField(posts);

  return `
    <section class="page timeline-page">
      <div class="timeline-screen">
        <header class="timeline-screen__chrome">
          <button class="timeline-screen__back" type="button" data-home-nav="home" aria-label="Back to main page">
            <span>${getIcon('arrowLeft')}</span>
          </button>
          <div class="timeline-screen__toggle" role="tablist" aria-label="Timeline filter">
            <button class="timeline-screen__toggle-button ${uiState.timelineTab !== 'following' ? 'is-active' : ''}" type="button" data-timeline-tab="recommended">おすすめ</button>
            <button class="timeline-screen__toggle-button ${uiState.timelineTab === 'following' ? 'is-active' : ''}" type="button" data-timeline-tab="following">フォロー</button>
          </div>
        </header>

        <div class="timeline-screen__viewport" data-timeline-pan-viewport>
          <div class="timeline-screen__axes" aria-hidden="true">
            <span class="timeline-screen__axis timeline-screen__axis--x"></span>
            <span class="timeline-screen__axis timeline-screen__axis--y"></span>
            <span class="timeline-screen__arrow timeline-screen__arrow--up"></span>
            <span class="timeline-screen__arrow timeline-screen__arrow--right"></span>
            <span class="timeline-screen__arrow timeline-screen__arrow--down"></span>
            <span class="timeline-screen__arrow timeline-screen__arrow--left"></span>
          </div>
          <div
            class="timeline-screen__surface"
            data-timeline-pan-surface
            style="width:${field.width}px; height:${field.height}px; transform: translate(${uiState.timelinePan?.x ?? -360}px, ${uiState.timelinePan?.y ?? -220}px);"
          >
            ${field.html}
          </div>
        </div>
      </div>
    </section>
  `;
}
