import { getIcon } from './icons.js';

export function renderBottomNav(screen) {
  const activeScreen = screen === 'timeline' ? 'home' : screen;
  const isTimelineActive = activeScreen === 'home';
  const isSearchActive = activeScreen === 'search';
  const isProfileActive = activeScreen === 'profile';

  if (!['home', 'timeline', 'search', 'profile'].includes(screen)) {
    return '';
  }

  return `
    <nav class="timeline-bottom-nav" aria-label="Primary navigation">
      <button class="timeline-bottom-nav__item ${isTimelineActive ? 'is-active' : ''}" type="button" data-home-nav="home" aria-label="Open timeline">
        <span class="timeline-bottom-nav__icon" aria-hidden="true">${getIcon('timeline')}</span>
        <span class="timeline-bottom-nav__label">Timeline</span>
        ${isTimelineActive ? '<span class="timeline-bottom-nav__dot" aria-hidden="true"></span>' : ''}
      </button>
      <button class="timeline-bottom-nav__item ${isSearchActive ? 'is-active' : ''}" type="button" data-home-nav="search" aria-label="Open search">
        <span class="timeline-bottom-nav__icon" aria-hidden="true">${getIcon('search')}</span>
        <span class="timeline-bottom-nav__label">Search</span>
        ${isSearchActive ? '<span class="timeline-bottom-nav__dot" aria-hidden="true"></span>' : ''}
      </button>
      <button class="timeline-bottom-nav__item timeline-bottom-nav__item--compose" type="button" data-home-nav="compose" aria-label="Create post">
        <span class="timeline-bottom-nav__icon" aria-hidden="true">${getIcon('compose')}</span>
        <span class="timeline-bottom-nav__label">Post</span>
      </button>
      <button class="timeline-bottom-nav__item" type="button" data-home-nav="home" aria-label="Open settings">
        <span class="timeline-bottom-nav__icon" aria-hidden="true">${getIcon('settings')}</span>
        <span class="timeline-bottom-nav__label">Settings</span>
      </button>
      <button class="timeline-bottom-nav__item ${isProfileActive ? 'is-active' : ''}" type="button" data-home-nav="profile" aria-label="Open profile">
        <span class="timeline-bottom-nav__icon" aria-hidden="true">${getIcon('profile')}</span>
        <span class="timeline-bottom-nav__label">Profile</span>
        ${isProfileActive ? '<span class="timeline-bottom-nav__dot" aria-hidden="true"></span>' : ''}
      </button>
    </nav>
  `;
}
