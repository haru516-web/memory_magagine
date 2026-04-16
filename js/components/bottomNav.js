import { getIcon } from './icons.js';

const navItems = [
  { key: 'timeline', label: 'Timeline', icon: 'timeline' },
  { key: 'search', label: 'Search', icon: 'search' },
  { key: 'compose', label: 'Post', icon: 'compose' },
  { key: 'profile', label: 'Profile', icon: 'profile' },
];

export function renderBottomNav(currentScreen, uiState = {}) {
  const isExpanded = Boolean(uiState.bottomNavExpanded);
  const toggleLabel = isExpanded ? 'Close' : 'Open';
  const toggleIcon = isExpanded ? 'close' : 'spark';
  const leftItems = navItems.slice(0, 2);
  const rightItems = navItems.slice(2);

  return `
    <nav class="bottom-nav ${isExpanded ? 'is-expanded' : 'is-collapsed'}" aria-label="Main navigation">
      ${isExpanded ? leftItems.map((item) => `
        <button
          class="bottom-nav__item ${currentScreen === item.key ? 'is-current' : ''}"
          type="button"
          data-nav="${item.key}"
        >
          <span class="bottom-nav__icon">${getIcon(item.icon)}</span>
          <span class="bottom-nav__label">${item.label}</span>
        </button>
      `).join('') : ''}
      <button
        class="bottom-nav__item bottom-nav__item--toggle"
        type="button"
        data-nav-toggle
        aria-expanded="${isExpanded ? 'true' : 'false'}"
        aria-label="${isExpanded ? 'Collapse navigation' : 'Expand navigation'}"
      >
        <span class="bottom-nav__icon">${getIcon(toggleIcon)}</span>
        <span class="bottom-nav__label">${toggleLabel}</span>
      </button>
      ${isExpanded ? rightItems.map((item) => `
        <button
          class="bottom-nav__item ${currentScreen === item.key ? 'is-current' : ''}"
          type="button"
          data-nav="${item.key}"
        >
          <span class="bottom-nav__icon">${getIcon(item.icon)}</span>
          <span class="bottom-nav__label">${item.label}</span>
        </button>
      `).join('') : ''}
    </nav>
  `;
}
