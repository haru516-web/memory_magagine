import { getIcon } from './icons.js';

const MAIN_ITEMS = [
  { key: 'timeline', label: 'Timeline', icon: 'timeline' },
  { key: 'search', label: 'Search', icon: 'search' },
  { key: 'compose', label: 'Post', icon: 'compose' },
  { key: 'profile', label: 'Profile', icon: 'profile' },
];

const TIMELINE_ITEMS = [
  { key: 'following', label: 'フォロー', icon: 'follow' },
  { key: 'recommended', label: 'おすすめ', icon: 'recommended' },
];

const PROFILE_ITEMS = [
  { key: 'identity', label: 'Name / ID', icon: 'profile' },
  { key: 'library', label: 'Like / Save', icon: 'heart' },
  { key: 'network', label: 'Follow', icon: 'profile' },
  { key: 'posts', label: 'Posts', icon: 'timeline' },
  { key: 'magazine', label: 'Magazine', icon: 'issue' },
  { key: 'edit', label: 'Edit', icon: 'compose' },
];

function renderWheel({ side, group, items, activeKey, label }) {
  return `
    <section
      class="side-wheel side-wheel--${side}"
      data-side-wheel="${group}"
      aria-label="${label}"
    >
      <div class="side-wheel__ghost"></div>
      <div class="side-wheel__track"></div>
      <div class="side-wheel__dock" aria-hidden="true">
        <div class="side-wheel__dock-ring"></div>
        <div class="side-wheel__dock-core"></div>
      </div>
      <div class="side-wheel__status" aria-hidden="true">${label}</div>
      <div class="side-wheel__arc" data-side-wheel-arc>
        ${items.map((item, index) => `
          <button
            class="side-wheel__item ${item.key === activeKey ? 'is-active' : ''}"
            type="button"
            ${group === 'main'
              ? `data-side-nav-screen="${item.key}"`
              : group === 'timeline'
                ? `data-side-nav-tab="${item.key}"`
                : `data-side-nav-profile-section="${item.key}"`}
            data-side-index="${index}"
            aria-label="${item.label}"
          >
            <span class="side-wheel__item-icon">${getIcon(item.icon)}</span>
            <span class="side-wheel__item-label">${item.label}</span>
          </button>
        `).join('')}
      </div>
    </section>
  `;
}

export function renderBottomNav(currentScreen, uiState) {
  const mainActiveKey = MAIN_ITEMS.some((item) => item.key === currentScreen)
    ? currentScreen
    : (MAIN_ITEMS.some((item) => item.key === uiState.postReturnScreen) ? uiState.postReturnScreen : 'timeline');

  return `
    <div class="side-wheel-system" aria-hidden="false">
      ${renderWheel({
        side: 'left',
        group: 'main',
        items: MAIN_ITEMS,
        activeKey: mainActiveKey,
        label: 'Page navigation',
      })}
      ${currentScreen === 'timeline' ? renderWheel({
        side: 'right',
        group: 'timeline',
        items: TIMELINE_ITEMS,
        activeKey: uiState.timelineTab || 'recommended',
        label: 'Timeline filter',
      }) : ''}
      ${currentScreen === 'profile' && !uiState.profileAuthor ? renderWheel({
        side: 'right',
        group: 'profile',
        items: PROFILE_ITEMS,
        activeKey: uiState.profileSection || 'identity',
        label: 'Profile sections',
      }) : ''}
    </div>
  `;
}
