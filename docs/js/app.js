import { renderBottomNav } from './components/bottomNav.js';
import { renderCommentsModal } from './components/modals.js';
import { getIcon } from './components/icons.js';
import { getState, addPost, updatePost, deletePost, toggleLike, toggleSave, addComment, addImpression, updateProfile, toggleFollow, saveIssue, upsertDraft, deleteDraft } from './core/store.js';
import { renderOpening } from './pages/opening.js';
import { renderInvite } from './pages/invite.js';
import { renderHome, renderTimeline } from './pages/timeline.js';
import { renderSearch } from './pages/search.js';
import { renderCompose } from './pages/compose.js';
import { renderMagazine } from './pages/magazine.js';
import { renderProfile } from './pages/profile.js';
import { renderPostDetail } from './pages/postDetail.js';
import { DEFAULT_COMPOSE_TEMPLATE, getComposeTemplateById } from './templates/index.js';
import {
  FIXED_TEMPLATE_SLOT_KEYS,
  getFixedTemplateLayout,
  getFixedTemplateTextMetrics,
} from './templates/fixedTemplateLayouts.js';
import {
  computePage8ResolvedLayout,
  normalizePage8ImageBoxes,
  normalizePage8Options,
  normalizePage8TextBoxes,
  page8RectToPercent,
  PAGE8_BOUNDS,
  PAGE8_GRID,
  PAGE8_MIN_IMAGE_SIZE,
  PAGE8_MIN_TEXT_SIZE,
  snapPage8Value,
} from './templates/page8Layout.js';
import { cropFileToCirclePngDataUrl, fileToWebpDataUrl } from './utils/image.js';

const uiState = {
  screen: 'opening',
  timelineOverlay: null,
  timelineTab: 'recommended',
  timelinePan: { x: -360, y: -220 },
  searchQuery: '',
  searchTags: [],
  searchSort: 'popular',
  homeTheme: 'light',
  homeCoreState: 'default',
  homeCoreTapTimestamps: [],
  previewPostId: null,
  commentPostId: null,
  profileEditOpen: false,
  profileAuthor: null,
  profileSection: null,
  profileLibraryTab: 'liked',
  profileFindQuery: '',
  profileFindTags: [],
  profileFindMonth: '',
  profileExpanded: true,
  profileOrbitRotation: 0,
  profileOrbitDragSuppressUntil: 0,
  profileAvatarCropOpen: false,
  composeStage: 'select',
  composeTemplateId: DEFAULT_COMPOSE_TEMPLATE,
  composeBackgroundColor: '#f8f4ee',
  composeEditingPostId: null,
  composeDraftId: null,
  composeWorkingDraft: null,
  openingTapGuardUntil: 0,
  postReturnScreen: 'timeline',
  postReturnProfileAuthor: null,
  profileReturnState: null,
  composeReturnState: null,
  postDetailShouldScroll: false,
};

const HOME_THEME_ORDER = ['dark', 'light', 'system'];
const COMPOSE_TEXT_FONT_STACKS = {
  'noto-sans-jp': `'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif`,
  'zen-kaku-gothic-new': `'Zen Kaku Gothic New', 'Hiragino Sans', 'Yu Gothic', sans-serif`,
  'biz-udgothic': `'BIZ UDGothic', 'Yu Gothic', sans-serif`,
  'kosugi-maru': `'Kosugi Maru', 'Hiragino Maru Gothic ProN', sans-serif`,
  'line-seed-jp': `'LINE Seed JP', 'Noto Sans JP', 'Hiragino Sans', sans-serif`,
  'sawarabi-mincho': `'Sawarabi Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif`,
  'hina-mincho': `'Hina Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif`,
  'source-han-serif': `'Source Han Serif', 'Source Han Serif JP', 'Noto Serif JP', serif`,
  'shippori-mincho': `'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif`,
  'zen-old-mincho': `'Zen Old Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif`,
  'editorial-serif': `'Zen Old Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif`,
  'modern-sans': `'Noto Sans JP', 'Hiragino Sans', 'Yu Gothic', sans-serif`,
  'soft-serif': `'Shippori Mincho', 'Hiragino Mincho ProN', 'Yu Mincho', serif`,
};
const COMPOSE_TEXT_FONT_IDS = new Set(Object.keys(COMPOSE_TEXT_FONT_STACKS));

const composePreviewDefaults = {
  text: 'text',
  headline: 'text',
  subhead: 'text',
  intro: 'text',
  body: 'text',
  date: 'text',
  editor: '編集者：haru',
};

function createComposeFileState(source = {}) {
  return {
    file: typeof source.file === 'string' ? source.file : null,
    position: {
      x: Number(source.position?.x) || 0.5,
      y: Number(source.position?.y) || 0.5,
      zoom: Math.max(1, Number(source.position?.zoom) || 1),
    },
    imageSize: source.imageSize && Number.isFinite(source.imageSize.width) && Number.isFinite(source.imageSize.height)
      ? { width: source.imageSize.width, height: source.imageSize.height }
      : null,
  };
}

function createComposeTextStyleValue(source = {}) {
  const family = COMPOSE_TEXT_FONT_IDS.has(source.family)
    ? source.family
    : null;
  const scale = Number.isFinite(Number(source.scale))
    ? Math.min(4, Math.max(1, Number(source.scale)))
    : 1;

  return { family, scale };
}

function createComposeTextStyleState(source = {}) {
  return {
    text: createComposeTextStyleValue(source.text),
    headline: createComposeTextStyleValue(source.headline),
    subhead: createComposeTextStyleValue(source.subhead),
    intro: createComposeTextStyleValue(source.intro),
    body: createComposeTextStyleValue(source.body),
    date: createComposeTextStyleValue(source.date),
    editor: createComposeTextStyleValue(source.editor),
  };
}

function createComposeWorkingDraft(source = {}) {
  const textValue = source.text || source.headline || composePreviewDefaults.text;
  return {
    templateId: source.templateId || DEFAULT_COMPOSE_TEMPLATE,
    backgroundColor: source.backgroundColor || '#f8f4ee',
    text: textValue,
    headline: source.headline || composePreviewDefaults.headline,
    subhead: source.subhead || composePreviewDefaults.subhead,
    intro: source.intro || composePreviewDefaults.intro,
    body: source.body || composePreviewDefaults.body,
    date: source.date || composePreviewDefaults.date,
    editor: source.editor || composePreviewDefaults.editor,
    textStyles: createComposeTextStyleState(source.textStyles),
    fixedTags: Array.isArray(source.fixedTags) ? [...source.fixedTags] : [],
    freeTags: Array.isArray(source.freeTags)
      ? [...source.freeTags]
      : String(source.freeTags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    customLayout: source.customLayout ? JSON.parse(JSON.stringify(source.customLayout)) : null,
    standardFiles: {
      primary: createComposeFileState(source.standardFiles?.primary),
      secondary: createComposeFileState(source.standardFiles?.secondary),
      accent: createComposeFileState(source.standardFiles?.accent),
      detail: createComposeFileState(source.standardFiles?.detail),
    },
  };
}

function getFixedSlotStateKey(inputId) {
  switch (inputId) {
    case 'imageInputPrimary':
      return 'primary';
    case 'imageInputSecondary':
      return 'secondary';
    case 'imageInputAccent':
      return 'accent';
    case 'imageInputDetail':
      return 'detail';
    default:
      return 'primary';
  }
}

let app = null;
let openingSequenceId = 0;
let homeCoreTransitionTimer = null;
let activeComposeBridge = null;
let systemThemeMediaQuery = null;
const profileAvatarDraft = {
  file: null,
  previewUrl: '',
  imageSize: null,
  crop: { x: 0.5, y: 0.5, zoom: 1 },
};

function snapPage8ValueUp(value) {
  return Math.ceil(value / PAGE8_GRID) * PAGE8_GRID;
}

function clearHomeCoreTransition() {
  if (homeCoreTransitionTimer) {
    window.clearTimeout(homeCoreTransitionTimer);
    homeCoreTransitionTimer = null;
  }
}

function resetHomeCoreState() {
  clearHomeCoreTransition();
  uiState.homeCoreState = 'default';
  uiState.homeCoreTapTimestamps = [];
}

function resetProfileAvatarDraft() {
  if (profileAvatarDraft.previewUrl) {
    URL.revokeObjectURL(profileAvatarDraft.previewUrl);
  }
  profileAvatarDraft.file = null;
  profileAvatarDraft.previewUrl = '';
  profileAvatarDraft.imageSize = null;
  profileAvatarDraft.crop = { x: 0.5, y: 0.5, zoom: 1 };
  uiState.profileAvatarCropOpen = false;
}

function cleanupComposeBridge() {
  if (activeComposeBridge?.unmount) {
    activeComposeBridge.unmount();
  }
  activeComposeBridge = null;
}

function resolveHomeTheme(mode = uiState.homeTheme) {
  if (mode === 'system') {
    const prefersDark = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }
  return mode === 'dark' ? 'dark' : 'light';
}

function getPageHtml() {
  const state = getState();
  switch (uiState.screen) {
    case 'home':
      return renderHome(state, uiState);
    case 'timeline':
      return renderTimeline(state, uiState);
    case 'search':
      return renderSearch(state, uiState);
    case 'invite':
      return renderInvite();
    case 'compose':
      return renderCompose({
        stage: uiState.composeStage,
        selectedTemplateId: uiState.composeTemplateId,
        selectedBackground: uiState.composeBackgroundColor,
        draft: uiState.composeWorkingDraft || getActivePost(uiState.composeEditingPostId)?.composeData || null,
        isEditing: Boolean(uiState.composeEditingPostId),
      });
    case 'magazine':
      return renderMagazine(state);
    case 'profile':
      return renderProfile(state, uiState);
    case 'post': {
      const post = getActivePost(uiState.previewPostId);
      const posts = [...(state.posts || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return renderPostDetail(post, {
        posts,
        currentUserName: state.profile.name,
        title: uiState.postReturnScreen === 'profile' ? post?.authorName : '',
        showOwnerMenu: uiState.postReturnScreen === 'profile',
      });
    }
    default:
      return renderHome(state, uiState);
  }
}

function getActivePost(postId) {
  return getState().posts.find((post) => post.id === postId);
}

function isOwnPost(post) {
  if (!post) return false;
  return post.authorName === getState().profile.name;
}

function renderShell() {
  if (!app) return;
  const shellClasses = ['app-shell'];
  const screenAreaClasses = ['screen-area'];
  const themeName = resolveHomeTheme(uiState.homeTheme);
  const hasBottomNav = ['home', 'timeline', 'search', 'profile'].includes(uiState.screen);

  shellClasses.push(`app-shell--theme-${themeName}`);
  shellClasses.push(`app-shell--theme-mode-${uiState.homeTheme}`);
  if (hasBottomNav) {
    shellClasses.push('app-shell--with-bottom-nav');
    screenAreaClasses.push('screen-area--with-bottom-nav');
  }

  if (uiState.screen === 'home') {
    shellClasses.push('app-shell--home');
    screenAreaClasses.push('screen-area--home');
  } else if (uiState.screen === 'timeline') {
    shellClasses.push('app-shell--timeline');
    screenAreaClasses.push('screen-area--timeline');
  } else if (uiState.screen === 'compose') {
    shellClasses.push('app-shell--compose');
    screenAreaClasses.push('screen-area--compose');
  } else if (uiState.screen === 'search') {
    screenAreaClasses.push('screen-area--search');
  } else if (uiState.screen === 'profile') {
    screenAreaClasses.push('screen-area--profile');
  } else if (uiState.screen === 'post') {
    screenAreaClasses.push('screen-area--post');
  } else if (uiState.screen === 'invite') {
    screenAreaClasses.push('screen-area--invite');
  }

  app.innerHTML = `
    <div class="${shellClasses.join(' ')}">
      <main class="${screenAreaClasses.join(' ')}" id="screenArea"></main>
      ${renderBottomNav(uiState.screen, uiState)}
      <div id="modalRoot"></div>
    </div>
  `;
}

function renderModals() {
  const modalRoot = document.getElementById('modalRoot');
  if (!modalRoot) return;
  const commentPost = uiState.commentPostId ? getActivePost(uiState.commentPostId) : null;
  modalRoot.innerHTML = `
    ${renderCommentsModal(commentPost)}
  `;
  bindModalEvents();
}

function renderScreen() {
  const screenArea = document.getElementById('screenArea');
  if (!screenArea) return;
  screenArea.innerHTML = getPageHtml();
  bindPageEvents();
  renderModals();
}

function render() {
  if (!app) return;
  cleanupComposeBridge();
  if (uiState.screen === 'opening') {
    app.innerHTML = renderOpening(renderHome(getState(), uiState));
    bindOpeningEvents();
    return;
  }
  renderShell();
  renderScreen();
  bindNavEvents();
}

function captureViewState() {
  return {
    screen: uiState.screen,
    previewPostId: uiState.previewPostId,
    profileAuthor: uiState.profileAuthor,
    postReturnScreen: uiState.postReturnScreen,
    postReturnProfileAuthor: uiState.postReturnProfileAuthor,
  };
}

function restoreViewState(snapshot, fallback = 'home') {
  if (!snapshot) {
    navigate(fallback);
    return;
  }
  uiState.screen = snapshot.screen || fallback;
  uiState.previewPostId = snapshot.previewPostId || null;
  uiState.commentPostId = null;
  uiState.profileEditOpen = false;
  uiState.profileAuthor = uiState.screen === 'profile' ? (snapshot.profileAuthor || null) : null;
  uiState.postReturnScreen = snapshot.postReturnScreen || 'home';
  uiState.postReturnProfileAuthor = snapshot.postReturnProfileAuthor || null;
  render();
}

function navigate(screen) {
  if (screen !== 'home') {
    resetHomeCoreState();
  }
  if (screen === 'compose' && uiState.screen !== 'compose') {
    uiState.composeReturnState = captureViewState();
  }
  if (screen === 'profile' && uiState.screen !== 'profile') {
    uiState.profileReturnState = captureViewState();
  }
  if (screen !== 'profile') {
    resetProfileAvatarDraft();
    uiState.profileReturnState = null;
  }
  if (screen !== 'home') {
    uiState.timelineOverlay = null;
  }
  if (screen !== 'compose') {
    uiState.composeEditingPostId = null;
    uiState.composeDraftId = null;
    uiState.composeStage = 'select';
    uiState.composeBackgroundColor = '#f8f4ee';
    uiState.composeWorkingDraft = null;
    uiState.composeReturnState = null;
  }
  uiState.screen = screen;
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  if (screen === 'compose') {
    uiState.composeStage = 'select';
    uiState.composeBackgroundColor = '#f8f4ee';
    uiState.composeTemplateId = DEFAULT_COMPOSE_TEMPLATE;
    uiState.composeDraftId = null;
    uiState.composeWorkingDraft = createComposeWorkingDraft({
      templateId: DEFAULT_COMPOSE_TEMPLATE,
      backgroundColor: '#f8f4ee',
    });
  }
  if (screen === 'profile') {
    resetProfileAvatarDraft();
    uiState.profileAuthor = null;
    uiState.profileSection = 'pages';
    uiState.profileLibraryTab = 'liked';
    uiState.profileFindQuery = '';
    uiState.profileFindTags = [];
    uiState.profileFindMonth = '';
    uiState.profileExpanded = true;
    uiState.profileOrbitRotation = 270;
  }
  if (screen !== 'profile') {
    uiState.profileEditOpen = false;
    uiState.profileAuthor = null;
  }
  render();
}

function enterTimelineFromOpening() {
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  uiState.openingTapGuardUntil = Date.now() + 700;
  uiState.postReturnScreen = 'home';
  uiState.postReturnProfileAuthor = null;
  uiState.screen = 'invite';
  render();
}

function openProfile(authorName) {
  resetProfileAvatarDraft();
  uiState.profileReturnState = captureViewState();
  uiState.screen = 'profile';
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  uiState.profileEditOpen = false;
  uiState.profileAuthor = authorName || null;
  uiState.profileSection = authorName ? null : 'pages';
  uiState.profileLibraryTab = 'liked';
  uiState.profileFindQuery = '';
  uiState.profileFindTags = [];
  uiState.profileFindMonth = '';
  uiState.profileExpanded = true;
  uiState.profileOrbitRotation = authorName ? 0 : 270;
  render();
}

function closeProfile() {
  resetProfileAvatarDraft();
  const snapshot = uiState.profileReturnState;
  uiState.profileReturnState = null;
  restoreViewState(snapshot, 'home');
}

function openPostDetail(postId) {
  uiState.postReturnScreen = uiState.screen;
  uiState.postReturnProfileAuthor = uiState.profileAuthor;
  uiState.screen = 'post';
  uiState.previewPostId = postId;
  uiState.commentPostId = null;
  uiState.postDetailShouldScroll = true;
  render();
}

function openPostEdit(postId) {
  const post = getActivePost(postId);
  if (!post || !isOwnPost(post)) return;
  uiState.composeReturnState = captureViewState();
  uiState.composeEditingPostId = postId;
  uiState.composeDraftId = null;
  uiState.composeStage = 'edit';
  uiState.composeTemplateId = post.composeData?.templateId || DEFAULT_COMPOSE_TEMPLATE;
  uiState.composeBackgroundColor = post.composeData?.backgroundColor || '#f8f4ee';
  uiState.composeWorkingDraft = createComposeWorkingDraft(post.composeData || {});
  uiState.screen = 'compose';
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  render();
}

function hasMeaningfulComposeDraft(draft) {
  if (!draft || typeof draft !== 'object') return false;
  const textValues = [draft.headline, draft.subhead, draft.intro, draft.body, draft.date, draft.editor]
    .map((value) => String(value || '').trim());
  const hasNonDefaultText = (
    textValues[0] && textValues[0] !== composePreviewDefaults.headline
  ) || (
    textValues[1] && textValues[1] !== composePreviewDefaults.subhead
  ) || (
    textValues[2] && textValues[2] !== composePreviewDefaults.intro
  ) || (
    textValues[3] && textValues[3] !== composePreviewDefaults.body
  ) || (
    textValues[4] && textValues[4] !== composePreviewDefaults.date
  ) || (
    textValues[5] && textValues[5] !== composePreviewDefaults.editor
  );
  const hasTags = Array.isArray(draft.fixedTags) ? draft.fixedTags.length > 0 : false;
  const hasFreeTags = Array.isArray(draft.freeTags) ? draft.freeTags.length > 0 : false;
  const hasFiles = Object.values(draft.standardFiles || {}).some((fileState) => typeof fileState?.file === 'string' && fileState.file);
  const hasCustomLayout = Boolean(
    draft.customLayout
    && (
      Array.isArray(draft.customLayout.imageBoxes) && draft.customLayout.imageBoxes.length
      || Array.isArray(draft.customLayout.textBoxes) && draft.customLayout.textBoxes.length
      || Array.isArray(draft.customLayout.pretextBoxes) && draft.customLayout.pretextBoxes.length
    ),
  );
  return hasNonDefaultText || hasTags || hasFreeTags || hasFiles || hasCustomLayout;
}

function persistComposeDraftOnExit() {
  if (uiState.composeEditingPostId) return;
  const draft = uiState.composeWorkingDraft;
  if (!hasMeaningfulComposeDraft(draft)) {
    if (uiState.composeDraftId) {
      deleteDraft(uiState.composeDraftId);
    }
    uiState.composeDraftId = null;
    return;
  }

  const savedDraft = upsertDraft({
    id: uiState.composeDraftId || undefined,
    title: buildComposeCaption(draft) || draft.headline || 'Untitled',
    composeData: createComposeWorkingDraft(draft),
  });
  uiState.composeDraftId = savedDraft.id;
}

function openComposeDraft(draftId) {
  const draft = getState().drafts.find((item) => item.id === draftId);
  if (!draft?.composeData) return;
  uiState.composeReturnState = captureViewState();
  uiState.composeEditingPostId = null;
  uiState.composeDraftId = draft.id;
  uiState.composeStage = 'edit';
  uiState.composeTemplateId = draft.composeData.templateId || DEFAULT_COMPOSE_TEMPLATE;
  uiState.composeBackgroundColor = draft.composeData.backgroundColor || '#f8f4ee';
  uiState.composeWorkingDraft = createComposeWorkingDraft(draft.composeData);
  uiState.screen = 'compose';
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  render();
}

async function publishComposeDraft(draftId) {
  const draft = getState().drafts.find((item) => item.id === draftId);
  if (!draft?.composeData) return;
  const draftSnapshot = createComposeWorkingDraft(draft.composeData);
  const values = {
    templateId: draftSnapshot.templateId,
    backgroundColor: draftSnapshot.backgroundColor,
    text: draftSnapshot.text,
    headline: draftSnapshot.headline,
    subhead: draftSnapshot.subhead,
    intro: draftSnapshot.intro,
    body: draftSnapshot.body,
    date: draftSnapshot.date,
    editor: draftSnapshot.editor,
    textStyles: draftSnapshot.textStyles,
    customLayout: draftSnapshot.customLayout,
  };
  const imageData = await renderComposeTemplate(values, draftSnapshot.standardFiles, {});
  const profileName = String(getState().profile?.name || 'you').trim() || 'you';

  addPost({
    authorName: profileName,
    caption: buildComposeCaption(values),
    imageData,
    fixedTags: draftSnapshot.fixedTags,
    freeTags: draftSnapshot.freeTags,
    composeData: {
      ...values,
      fixedTags: draftSnapshot.fixedTags,
      freeTags: draftSnapshot.freeTags,
      standardFiles: draftSnapshot.standardFiles,
    },
  });
  deleteDraft(draftId);
  uiState.composeDraftId = null;
  uiState.composeWorkingDraft = null;
  uiState.composeEditingPostId = null;
  uiState.screen = 'timeline';
  uiState.timelineTab = 'recommended';
  uiState.profileSection = 'pages';
  render();
}

function closeCompose() {
  persistComposeDraftOnExit();
  const snapshot = uiState.composeReturnState;
  uiState.composeReturnState = null;
  uiState.composeDraftId = null;
  uiState.composeWorkingDraft = null;
  restoreViewState(snapshot, 'home');
}

function closePostDetail() {
  uiState.screen = uiState.postReturnScreen || 'timeline';
  uiState.commentPostId = null;
  uiState.profileEditOpen = false;
  uiState.profileAuthor = uiState.screen === 'profile' ? uiState.postReturnProfileAuthor : null;
  render();
}

function openSearchForTag(tag) {
  const normalizedTag = String(tag || '').trim();
  if (!normalizedTag) return;
  uiState.screen = 'search';
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  uiState.searchQuery = normalizedTag;
  uiState.searchTags = [];
  uiState.searchSort = 'popular';
  uiState.profileEditOpen = false;
  uiState.profileAuthor = null;
  render();
}

function loadOpeningImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load opening asset: ${src}`));
    image.src = src;
  });
}

function createOpeningLogoSprite(logoImage) {
  const sourceWidth = logoImage.naturalWidth || logoImage.width;
  const sourceHeight = logoImage.naturalHeight || logoImage.height;
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = sourceWidth;
  sourceCanvas.height = sourceHeight;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) return null;

  sourceCtx.drawImage(logoImage, 0, 0, sourceWidth, sourceHeight);
  const imageData = sourceCtx.getImageData(0, 0, sourceWidth, sourceHeight);
  const pixels = imageData.data;
  let minX = sourceWidth;
  let minY = sourceHeight;
  let maxX = -1;
  let maxY = -1;

  for (let index = 0; index < pixels.length; index += 4) {
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const sourceAlpha = pixels[index + 3] / 255;
    const luminance = (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
    const glowAlpha = Math.max(0, Math.min(1, (luminance - 108) / 110)) * sourceAlpha;
    const coreAlpha = Math.max(0, Math.min(1, (luminance - 184) / 42)) * sourceAlpha;
    const outputAlpha = Math.max(glowAlpha * 0.8, coreAlpha);

    pixels[index] = 255;
    pixels[index + 1] = 255;
    pixels[index + 2] = 255;
    pixels[index + 3] = Math.round(outputAlpha * 255);

    if (outputAlpha > 0.03) {
      const pixelIndex = index / 4;
      const x = pixelIndex % sourceWidth;
      const y = Math.floor(pixelIndex / sourceWidth);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return {
      canvas: sourceCanvas,
      width: sourceWidth,
      height: sourceHeight,
    };
  }

  sourceCtx.putImageData(imageData, 0, 0);
  const padding = Math.max(8, Math.round(Math.min(sourceWidth, sourceHeight) * 0.03));
  const cropX = Math.max(0, minX - padding);
  const cropY = Math.max(0, minY - padding);
  const cropWidth = Math.min(sourceWidth - cropX, (maxX - minX) + (padding * 2) + 1);
  const cropHeight = Math.min(sourceHeight - cropY, (maxY - minY) + (padding * 2) + 1);
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  if (!croppedCtx) return null;
  croppedCtx.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

  return {
    canvas: croppedCanvas,
    width: cropWidth,
    height: cropHeight,
  };
}

function createOpeningLogoSegments(logoSprite) {
  const sourceCtx = logoSprite.canvas.getContext('2d');
  if (!sourceCtx) return [];
  const { width, height } = logoSprite.canvas;
  const { data } = sourceCtx.getImageData(0, 0, width, height);
  const activeColumns = Array.from({ length: width }, (_, x) => {
    let activePixels = 0;
    for (let y = 0; y < height; y += 1) {
      if (data[((y * width) + x) * 4 + 3] > 110) {
        activePixels += 1;
      }
    }
    return activePixels > Math.max(2, Math.round(height * 0.04));
  });

  const groups = [];
  let start = null;
  for (let x = 0; x < activeColumns.length; x += 1) {
    if (activeColumns[x] && start == null) {
      start = x;
    }
    if ((!activeColumns[x] || x === activeColumns.length - 1) && start != null) {
      const end = activeColumns[x] && x === activeColumns.length - 1 ? x : x - 1;
      groups.push({ start, end });
      start = null;
    }
  }

  const resolvedGroups = groups.length === 4
    ? groups
    : [
      { start: 0, end: Math.round(width * 0.25) },
      { start: Math.round(width * 0.25), end: Math.round(width * 0.49) },
      { start: Math.round(width * 0.49), end: Math.round(width * 0.73) },
      { start: Math.round(width * 0.73), end: width - 1 },
    ];

  return resolvedGroups.map((group) => {
    const segmentWidth = Math.max(1, (group.end - group.start) + 1);
    const segmentCanvas = document.createElement('canvas');
    segmentCanvas.width = segmentWidth;
    segmentCanvas.height = height;
    const segmentCtx = segmentCanvas.getContext('2d');
    if (!segmentCtx) return null;
    segmentCtx.drawImage(
      logoSprite.canvas,
      group.start,
      0,
      segmentWidth,
      height,
      0,
      0,
      segmentWidth,
      height,
    );
    return {
      canvas: segmentCanvas,
      x: group.start,
      width: segmentWidth,
      height,
    };
  }).filter(Boolean);
}

async function bindOpeningEvents() {
  const canvas = document.getElementById('openingCanvas');
  const openingScreen = document.querySelector('.opening-screen');
  if (!canvas || !openingScreen) return;

  const sequenceId = ++openingSequenceId;
  const skipOpening = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (sequenceId !== openingSequenceId) return;
    openingSequenceId += 1;
    enterTimelineFromOpening();
  };
  openingScreen.addEventListener('pointerdown', skipOpening, { once: true });

  const assetTask = Promise.all([
    loadOpeningImage('image/background/okinawa.png'),
    loadOpeningImage('image/logo/b439a9c7-433e-4123-91c2-7d9eb952c1b4.png'),
  ]).catch(() => [null, null]);

  try {
    if (document.fonts?.ready) {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, 1200)),
      ]);
    } else {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
    }
  } catch {}
  if (sequenceId !== openingSequenceId) return;

  let backgroundImage = null;
  let logoImage = null;
  try {
    [backgroundImage, logoImage] = await Promise.race([
      assetTask,
      new Promise((resolve) => window.setTimeout(() => resolve([null, null]), 1600)),
    ]);
  } catch {}
  if (sequenceId !== openingSequenceId) return;

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  startOpeningSequence(canvas, openingScreen, sequenceId, prefersReducedMotion, { backgroundImage, logoImage });
}

function startOpeningSequence(canvas, openingScreen, sequenceId, prefersReducedMotion, openingAssets = {}) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = width;
  canvas.height = height;

  const { backgroundImage, logoImage } = openingAssets;
  const textColor = '#f7fbff';
  const subtitleFont = '"Avenir Next", "Helvetica Neue", Arial, sans-serif';
  const subtitleFontSize = Math.min(width * 0.038, 28 * ratio);
  const subtitleLineHeight = subtitleFontSize * 1.24;
  const secondarySubtitleFontSize = subtitleFontSize;
  const secondarySubtitleLineHeight = subtitleLineHeight;
  const flowDuration = prefersReducedMotion ? 1400 : 2800;
  const settleDuration = prefersReducedMotion ? 420 : 760;
  const revealDuration = prefersReducedMotion ? 300 : 560;
  const holdDuration = prefersReducedMotion ? 760 : 1600;
  const disperseDuration = prefersReducedMotion ? 900 : 1700;
  const subtitleStartOffset = flowDuration * 0.62;
  const secondarySubtitleStartOffset = subtitleStartOffset * 2;
  const rippleStartOffset = flowDuration + settleDuration + revealDuration + (holdDuration * 1.08);
  const rippleRingCount = 3;
  const rippleRingSpacing = prefersReducedMotion ? 620 : 1280;
  const rippleRingDuration = prefersReducedMotion ? 1480 : 3200;
  const rippleEndOffset = rippleStartOffset
    + rippleRingDuration
    + ((rippleRingCount - 1) * rippleRingSpacing);
  const secondRippleStartOffset = rippleStartOffset + rippleRingSpacing;
  const disperseStartOffset = rippleEndOffset - disperseDuration;
  const totalDuration = Math.max(
    disperseStartOffset + disperseDuration,
    rippleEndOffset,
  );
  const subtitleLines = [
    'When the darkness, which ought to be devoid of color,',
    'is vivid with color.',
  ];
  const secondarySubtitleText = 'There was a time when, with you beside me, the sky and the flowers appeared more beautiful than ever, and even the sound of falling rain felt boundlessly tender.';

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function easeOutCubic(value) {
    return 1 - ((1 - value) ** 3);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - (((-2 * value) + 2) ** 3) / 2;
  }

  function lerp(startValue, endValue, amount) {
    return startValue + ((endValue - startValue) * amount);
  }

  function getPhaseProgress(elapsed, offset, duration) {
    return clamp((elapsed - offset) / duration, 0, 1);
  }

  function drawCoverImage(targetCtx, image, drawWidth, drawHeight, zoom = 1) {
    if (!image) return;
    const imageWidth = image.naturalWidth || image.width;
    const imageHeight = image.naturalHeight || image.height;
    if (!imageWidth || !imageHeight) return;
    const coverScale = Math.max(drawWidth / imageWidth, drawHeight / imageHeight) * zoom;
    const renderedWidth = imageWidth * coverScale;
    const renderedHeight = imageHeight * coverScale;
    const offsetX = (drawWidth - renderedWidth) / 2;
    const offsetY = (drawHeight - renderedHeight) / 2;
    targetCtx.drawImage(image, offsetX, offsetY, renderedWidth, renderedHeight);
  }

  function drawRippleWord(targetCtx, alpha = 1, elapsedMs = 0) {
    const centerY = height * 0.5;
    const maxRadius = Math.hypot(width, height);
    const minRadius = Math.min(width, height) * 0.08;
    targetCtx.save();
    targetCtx.lineWidth = Math.max(1 * ratio, Math.min(width, height) * 0.0038);
    targetCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    for (let ring = 0; ring < rippleRingCount; ring += 1) {
      const ringElapsed = elapsedMs - rippleStartOffset - (ring * rippleRingSpacing);
      const ringProgress = clamp(ringElapsed / rippleRingDuration, 0, 1);
      if (ringProgress <= 0 || ringProgress >= 1) continue;
      targetCtx.globalAlpha = ((1 - ringProgress) ** 1.45) * 0.2 * alpha;
      targetCtx.beginPath();
      targetCtx.arc(
        width / 2,
        centerY,
        minRadius + (ringProgress * (maxRadius - minRadius)),
        0,
        Math.PI * 2,
      );
      targetCtx.stroke();
    }
    targetCtx.restore();
  }

  const logoSprite = logoImage ? createOpeningLogoSprite(logoImage) : null;
  const baseLogoWidth = logoSprite?.width || 1;
  const baseLogoHeight = logoSprite?.height || 1;
  const logoScale = logoSprite
    ? Math.min((width * 0.56) / baseLogoWidth, (height * 0.15) / baseLogoHeight)
    : 1;
  const logoRenderWidth = baseLogoWidth * logoScale;
  const logoRenderHeight = baseLogoHeight * logoScale;
  const logoOriginX = (width - logoRenderWidth) / 2;
  const logoTop = height * 0.12;
  const logoSegments = logoSprite
    ? createOpeningLogoSegments(logoSprite)
    : [];

  const animatedLogoSegments = (logoSegments.length ? logoSegments : []).map((segment, index, array) => {
    const targetWidth = segment.width * logoScale;
    const targetHeight = segment.height * logoScale;
    const targetX = logoOriginX + (segment.x * logoScale);
    const targetY = logoTop;
    const fromLeft = index < Math.ceil(array.length / 2);
    return {
      canvas: segment.canvas,
      targetX,
      targetY,
      targetWidth,
      targetHeight,
      startX: fromLeft
        ? -targetWidth - (Math.random() * width * 0.14) - (index * targetWidth * 0.16)
        : width + (Math.random() * width * 0.14) + ((array.length - index) * targetWidth * 0.16),
      startY: targetY + ((Math.random() - 0.5) * targetHeight * 0.45),
      driftX: (Math.random() - 0.5) * targetWidth * 0.12,
      driftY: (Math.random() - 0.5) * targetHeight * 0.08,
      enterArc: (Math.random() - 0.5) * targetHeight * 0.28,
      delay: index * 0.055,
      alpha: 0.78 + Math.random() * 0.16,
    };
  });

  const fallbackLogoMotion = {
    startX: (width * 0.5) - (logoRenderWidth * 0.45),
    startY: logoTop + (height * 0.04),
    targetX: logoOriginX,
    targetY: logoTop,
  };

  const sceneCanvas = document.createElement('canvas');
  sceneCanvas.width = width;
  sceneCanvas.height = height;
  const sceneCtx = sceneCanvas.getContext('2d');
  if (!sceneCtx) return;

  const start = performance.now();

  function frame(now) {
    if (sequenceId !== openingSequenceId) return;

    const elapsed = now - start;
    const flowProgress = easeOutCubic(getPhaseProgress(elapsed, 0, flowDuration));
    const settleProgress = easeInOutCubic(getPhaseProgress(elapsed, flowDuration * 0.56, settleDuration));
    const revealProgress = easeInOutCubic(getPhaseProgress(elapsed, flowDuration + settleDuration * 0.15, revealDuration));
    const subtitleProgress = easeInOutCubic(getPhaseProgress(elapsed, subtitleStartOffset, settleDuration + revealDuration));
    const secondarySubtitleProgress = easeInOutCubic(getPhaseProgress(elapsed, secondarySubtitleStartOffset, settleDuration + revealDuration));
    const disperseProgress = easeInOutCubic(
      getPhaseProgress(elapsed, disperseStartOffset, disperseDuration),
    );
    const rippleProgress = easeInOutCubic(
      getPhaseProgress(elapsed, rippleStartOffset, rippleEndOffset - rippleStartOffset),
    );
    const transitionProgress = easeInOutCubic(
      getPhaseProgress(elapsed, secondRippleStartOffset, rippleEndOffset - secondRippleStartOffset),
    );
    const dissolveFade = Math.max(0, 1 - (disperseProgress ** 1.24));
    const terminalFadeProgress = easeInOutCubic(getPhaseProgress(transitionProgress, 0.12, 0.88));
    const sceneFadeAlpha = dissolveFade * (1 - (terminalFadeProgress * 0.68));
    const underlayRevealAlpha = Math.min(0.42, terminalFadeProgress * 0.42);
    openingScreen?.style.setProperty('--opening-underlay-opacity', String(underlayRevealAlpha));

    sceneCtx.clearRect(0, 0, width, height);

    if (backgroundImage) {
      drawCoverImage(sceneCtx, backgroundImage, width, height, 1 + (disperseProgress * 0.04));
    } else {
      const fallbackGradient = sceneCtx.createLinearGradient(0, 0, 0, height);
      fallbackGradient.addColorStop(0, '#5f7894');
      fallbackGradient.addColorStop(0.58, '#8d7d73');
      fallbackGradient.addColorStop(1, '#182011');
      sceneCtx.fillStyle = fallbackGradient;
      sceneCtx.fillRect(0, 0, width, height);
    }

    sceneCtx.fillStyle = 'rgba(8, 12, 18, 0.2)';
    sceneCtx.fillRect(0, 0, width, height);

    const vignette = sceneCtx.createLinearGradient(0, 0, 0, height);
    vignette.addColorStop(0, 'rgba(10, 16, 24, 0.28)');
    vignette.addColorStop(0.34, 'rgba(10, 16, 24, 0.04)');
    vignette.addColorStop(0.72, 'rgba(10, 16, 24, 0.08)');
    vignette.addColorStop(1, 'rgba(3, 4, 7, 0.42)');
    sceneCtx.fillStyle = vignette;
    sceneCtx.fillRect(0, 0, width, height);

    if (animatedLogoSegments.length) {
      animatedLogoSegments.forEach((segment, index) => {
        const localProgress = clamp((flowProgress - segment.delay) / (1 - segment.delay), 0, 1);
        if (localProgress <= 0.001) return;
        const travel = easeOutCubic(localProgress);
        const arcStrength = (1 - travel) * segment.enterArc;
        const x = lerp(segment.startX, segment.targetX, travel) + (segment.driftX * (1 - travel));
        const y = lerp(segment.startY, segment.targetY, travel)
          + (Math.sin((travel * Math.PI) + (index * 0.35)) * arcStrength)
          + (segment.driftY * (1 - travel));
        const alpha = Math.min(1, (0.18 + (travel * segment.alpha) + (settleProgress * 0.22) + (revealProgress * 0.1))) * dissolveFade;
        if (alpha <= 0.02) return;
        sceneCtx.save();
        sceneCtx.globalAlpha = alpha;
        sceneCtx.drawImage(segment.canvas, x, y, segment.targetWidth, segment.targetHeight);
        sceneCtx.restore();
      });
    } else if (logoImage) {
      const travel = easeOutCubic(flowProgress);
      const x = lerp(fallbackLogoMotion.startX, fallbackLogoMotion.targetX, travel);
      const y = lerp(fallbackLogoMotion.startY, fallbackLogoMotion.targetY, travel);
      sceneCtx.save();
      sceneCtx.globalAlpha = (0.22 + (travel * 0.78)) * dissolveFade;
      sceneCtx.drawImage(logoImage, x, y, logoRenderWidth, logoRenderHeight);
      sceneCtx.restore();
    }

    const subtitleYBase = logoTop + logoRenderHeight + (height * 0.075);
    if (subtitleProgress > 0.001) {
      const subtitleAlpha = Math.min(0.96, subtitleProgress * 0.96) * Math.max(0, 1 - (disperseProgress * 0.88));
      const subtitleOffsetY = (1 - subtitleProgress) * subtitleFontSize * 0.85;
      sceneCtx.save();
      sceneCtx.globalAlpha = subtitleAlpha;
      sceneCtx.font = `400 ${subtitleFontSize}px ${subtitleFont}`;
      sceneCtx.textAlign = 'center';
      sceneCtx.textBaseline = 'middle';
      sceneCtx.fillStyle = textColor;
      sceneCtx.shadowColor = 'rgba(0, 0, 0, 0.22)';
      sceneCtx.shadowBlur = 16 * ratio;
      const subtitleY = subtitleYBase + subtitleOffsetY;
      subtitleLines.forEach((line, index) => {
        sceneCtx.fillText(line, width / 2, subtitleY + (index * subtitleLineHeight));
      });
      sceneCtx.restore();
    }
    if (secondarySubtitleProgress > 0.001) {
      const secondarySubtitleAlpha = Math.min(0.96, secondarySubtitleProgress * 0.96)
        * Math.max(0, 1 - (disperseProgress * 0.88));
      const secondarySubtitleOffsetY = (1 - secondarySubtitleProgress) * secondarySubtitleFontSize * 0.85;
      const secondarySubtitleY = subtitleYBase
        + (subtitleLines.length * subtitleLineHeight)
        + (secondarySubtitleFontSize * 1.15)
        + secondarySubtitleOffsetY;
      sceneCtx.save();
      sceneCtx.globalAlpha = secondarySubtitleAlpha;
      sceneCtx.font = `400 ${secondarySubtitleFontSize}px ${subtitleFont}`;
      sceneCtx.textAlign = 'center';
      sceneCtx.textBaseline = 'middle';
      sceneCtx.fillStyle = textColor;
      sceneCtx.shadowColor = 'rgba(0, 0, 0, 0.22)';
      sceneCtx.shadowBlur = 16 * ratio;
      addWrappedText(sceneCtx, secondarySubtitleText, {
        x: width / 2,
        y: secondarySubtitleY,
        maxWidth: logoRenderWidth * 0.96,
        lineHeight: secondarySubtitleLineHeight,
        maxLines: 6,
      });
      sceneCtx.restore();
    }
    if (rippleProgress > 0.001) {
      const rippleAlpha = Math.max(0, 1 - (rippleProgress ** 1.12));
      drawRippleWord(sceneCtx, rippleAlpha, elapsed);
    }

    ctx.clearRect(0, 0, width, height);
    const rotation = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.0054) * 0.009 * disperseProgress;
    const sceneScale = 1 + (disperseProgress * 0.038);

    ctx.save();
    ctx.globalAlpha = sceneFadeAlpha;
    ctx.filter = prefersReducedMotion ? 'none' : `blur(${disperseProgress * 14}px)`;
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    ctx.scale(sceneScale, sceneScale);
    ctx.drawImage(sceneCanvas, -width / 2, -height / 2, width, height);
    ctx.restore();

    if (elapsed < totalDuration) {
      requestAnimationFrame(frame);
      return;
    }

    if (sequenceId === openingSequenceId) {
      openingScreen?.style.setProperty('--opening-underlay-opacity', '0');
      enterTimelineFromOpening();
    }
  }

  requestAnimationFrame(frame);
}

function bindNavEvents() {
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const wheels = [
    {
      element: document.querySelector('[data-side-wheel="main"]'),
      getItems: () => Array.from(document.querySelectorAll('[data-side-wheel="main"] [data-side-nav-screen]')),
      getActiveKey: () => (['timeline', 'search', 'compose', 'profile'].includes(uiState.screen) ? uiState.screen : (uiState.postReturnScreen || 'timeline')),
      applySelection: (key) => {
        if (uiState.screen === key) {
          render();
          return;
        }
        navigate(key);
      },
    },
    {
      element: document.querySelector('[data-side-wheel="timeline"]'),
      getItems: () => Array.from(document.querySelectorAll('[data-side-wheel="timeline"] [data-side-nav-tab]')),
      getActiveKey: () => uiState.timelineTab || 'recommended',
      applySelection: (key) => {
        uiState.timelineTab = key;
        render();
      },
    },
    {
      element: document.querySelector('[data-side-wheel="profile"]'),
      getItems: () => Array.from(document.querySelectorAll('[data-side-wheel="profile"] [data-side-nav-profile-section]')),
      getActiveKey: () => uiState.profileSection || 'pages',
      applySelection: (key) => {
        uiState.profileSection = key;
        render();
      },
    },
  ].filter((entry) => entry.element);

  wheels.forEach((wheelConfig) => {
    const { element, getItems, applySelection, getActiveKey } = wheelConfig;
    const buttons = getItems();
    if (!buttons.length) return;

    const items = buttons.map((button, index) => ({
      button,
      key: button.dataset.sideNavScreen || button.dataset.sideNavTab || button.dataset.sideNavProfileSection,
      index,
    }));

    const currentIndex = Math.max(0, items.findIndex((item) => item.key === getActiveKey()));
    let engaged = false;
    let focusIndex = currentIndex;
    let wheelOffsetY = 0;
    let activeDragX = 0;
    let suppressClickUntil = 0;
    let dragState = null;

    const clampWheelOffsetY = (nextOffset) => {
      const activeRect = items[focusIndex]?.button.getBoundingClientRect();
      const halfHeight = (activeRect?.height || 0) / 2;
      const minCenter = halfHeight;
      const maxCenter = window.innerHeight - halfHeight;
      if (maxCenter <= minCenter) return 0;
      return clamp(nextOffset, minCenter - (window.innerHeight / 2), maxCenter - (window.innerHeight / 2));
    };

    const applyWheelLayout = (nextFocusIndex, isEngaged) => {
      const anchorX = element.classList.contains('side-wheel--left') ? 76 : 24;
      const stepY = items.length <= 2 ? 88 : 76;

      element.style.setProperty('--wheel-offset-y', `${wheelOffsetY}px`);
      element.classList.toggle('is-dragging', Boolean(dragState?.moved));

      items.forEach((entry) => {
        const y = (entry.index - nextFocusIndex) * stepY;
        const opacity = isEngaged ? 1 : (entry.index === nextFocusIndex ? 1 : 0);
        const scale = isEngaged ? (entry.index === nextFocusIndex ? 1 : 0.9) : 1;
        const dragX = !isEngaged && entry.index === nextFocusIndex ? activeDragX : 0;

        entry.button.style.setProperty('--slot-x', `${anchorX}%`);
        entry.button.style.setProperty('--slot-y', `${y}px`);
        entry.button.style.setProperty('--slot-scale', String(scale));
        entry.button.style.setProperty('--slot-opacity', String(opacity));
        entry.button.style.setProperty('--slot-depth', String(Math.abs(entry.index - nextFocusIndex)));
        entry.button.style.setProperty('--drag-x', `${dragX}px`);
        entry.button.style.setProperty('--drag-y', '0px');
        entry.button.classList.toggle('is-active', entry.index === nextFocusIndex);
        entry.button.classList.toggle('is-dragging', Boolean(dragState?.moved) && entry.index === nextFocusIndex);
      });
    };

    const finishDrag = (event) => {
      if (!dragState) return;
      if (event?.pointerId != null && dragState.pointerId !== event.pointerId) return;
      const { button, pointerId, moved } = dragState;
      if (button.hasPointerCapture?.(pointerId)) {
        button.releasePointerCapture(pointerId);
      }
      dragState = null;
      if (moved) {
        suppressClickUntil = Date.now() + 220;
      }
      applyWheelLayout(focusIndex, engaged);
    };

    const handleDragMove = (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      if (!dragState.moved && Math.hypot(deltaX, deltaY) < 8) return;
      dragState.moved = true;

      wheelOffsetY = clampWheelOffsetY(dragState.startWheelOffsetY + deltaY);
      if (dragState.mode === 'collapsed') {
        const minCenterX = dragState.halfWidth;
        const maxCenterX = window.innerWidth - dragState.halfWidth;
        const nextCenterX = clamp(dragState.startCenterX + deltaX, minCenterX, maxCenterX);
        activeDragX = nextCenterX - dragState.anchorCenterX;
      } else {
        activeDragX = 0;
      }

      applyWheelLayout(focusIndex, engaged);
    };

    applyWheelLayout(currentIndex, false);

    const openWheel = () => {
      engaged = true;
      element.classList.add('is-engaged');
      activeDragX = 0;
      applyWheelLayout(focusIndex, true);
    };

    const closeWheel = () => {
      engaged = false;
      element.classList.remove('is-engaged');
      applyWheelLayout(focusIndex, false);
    };

    const commitSelection = (nextIndex = focusIndex) => {
      focusIndex = nextIndex;
      const selected = items[focusIndex];
      if (!selected) {
        closeWheel();
        return;
      }
      applySelection(selected.key);
    };

    buttons.forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        const buttonIndex = Number(button.dataset.sideIndex || 0);
        if (buttonIndex !== focusIndex) return;

        const rect = button.getBoundingClientRect();
        dragState = {
          pointerId: event.pointerId,
          button,
          mode: engaged ? 'engaged' : 'collapsed',
          startX: event.clientX,
          startY: event.clientY,
          startCenterX: rect.left + (rect.width / 2),
          anchorCenterX: rect.left + (rect.width / 2) - activeDragX,
          halfWidth: rect.width / 2,
          startWheelOffsetY: wheelOffsetY,
          moved: false,
        };
        button.setPointerCapture(event.pointerId);
      });

      button.addEventListener('pointermove', handleDragMove);
      button.addEventListener('pointerup', finishDrag);
      button.addEventListener('pointercancel', finishDrag);
      button.addEventListener('lostpointercapture', finishDrag);

      button.addEventListener('click', (event) => {
        if (Date.now() < suppressClickUntil) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        event.preventDefault();
        const buttonIndex = Number(button.dataset.sideIndex || 0);
        if (!engaged) {
          if (buttonIndex !== focusIndex) return;
          openWheel();
          return;
        }
        if (buttonIndex === focusIndex) {
          closeWheel();
          return;
        }
        commitSelection(buttonIndex);
      });
    });
  });
}

function bindPostInteractions(scope = document) {
  scope.querySelectorAll('[data-toggle-tags]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = document.querySelector(`[data-tags-panel="${button.dataset.toggleTags}"]`);
      if (!panel) return;
      panel.hidden = !panel.hidden;
      button.classList.toggle('is-active', !panel.hidden);
    });
  });

  scope.querySelectorAll('[data-like]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleLike(button.dataset.like);
      renderScreen();
    });
  });

  scope.querySelectorAll('[data-save]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleSave(button.dataset.save);
      renderScreen();
    });
  });

  scope.querySelectorAll('[data-comment]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.commentPostId = button.dataset.comment;
      renderModals();
    });
  });

  scope.querySelectorAll('[data-post-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      openSearchForTag(button.dataset.postTag);
    });
  });

  scope.querySelectorAll('[data-open-preview]').forEach((button) => {
    button.addEventListener('click', (event) => {
      if (Date.now() < uiState.openingTapGuardUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const postId = button.dataset.openPreview;
      addImpression(postId);
      openPostDetail(postId);
    });
  });

  scope.querySelectorAll('[data-open-author]').forEach((button) => {
    button.addEventListener('click', () => {
      openProfile(button.dataset.openAuthor);
    });
  });

  scope.querySelectorAll('[data-post-owner-menu]').forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest('[data-post-detail-card]');
      const menu = card?.querySelector('[data-post-owner-actions]');
      if (!menu) return;
      menu.hidden = !menu.hidden;
    });
  });

  scope.querySelectorAll('[data-edit-post]').forEach((button) => {
    button.addEventListener('click', () => {
      openPostEdit(button.dataset.editPost);
    });
  });

  if (uiState.screen === 'post' && uiState.postDetailShouldScroll) {
    uiState.postDetailShouldScroll = false;
    requestAnimationFrame(() => {
      document.querySelector('[data-post-detail-active]')?.scrollIntoView({ block: 'start' });
    });
  }
}

function bindHomeEvents() {
  const homeRoot = document.querySelector('.orbit-home');
  const syncHomeCoreState = () => {
    if (!homeRoot) return;
    homeRoot.classList.remove('orbit-home--default', 'orbit-home--collapsing', 'orbit-home--sheep');
    homeRoot.classList.add(`orbit-home--${uiState.homeCoreState}`);
  };

  document.querySelectorAll('[data-home-theme-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      const currentIndex = HOME_THEME_ORDER.indexOf(uiState.homeTheme);
      uiState.homeTheme = HOME_THEME_ORDER[(currentIndex + 1) % HOME_THEME_ORDER.length];
      render();
    });
  });

  document.querySelectorAll('[data-home-core-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      if (uiState.homeCoreState !== 'default') return;
      const now = Date.now();
      uiState.homeCoreTapTimestamps = [...uiState.homeCoreTapTimestamps.filter((time) => now - time < 900), now];
      if (uiState.homeCoreTapTimestamps.length < 3) return;
      uiState.homeCoreTapTimestamps = [];
      uiState.homeCoreState = 'collapsing';
      syncHomeCoreState();
      clearHomeCoreTransition();
      homeCoreTransitionTimer = window.setTimeout(() => {
        uiState.homeCoreState = 'sheep';
        syncHomeCoreState();
      }, 620);
    });
  });

  document.querySelectorAll('[data-home-sheep-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      if (uiState.homeCoreState !== 'sheep') return;
      resetHomeCoreState();
      syncHomeCoreState();
    });
  });
}

function bindTimelineEvents() {
  bindPostInteractions(document.getElementById('screenArea'));

  const viewport = document.querySelector('[data-timeline-pan-viewport]');
  const surface = document.querySelector('[data-timeline-pan-surface]');
  if (viewport && surface) {
    const clampPan = (nextX, nextY) => {
      const minX = Math.min(0, viewport.clientWidth - surface.scrollWidth);
      const minY = Math.min(0, viewport.clientHeight - surface.scrollHeight);
      return {
        x: Math.max(minX, Math.min(0, nextX)),
        y: Math.max(minY, Math.min(0, nextY)),
      };
    };

    const applyPan = (nextX, nextY) => {
      const clamped = clampPan(nextX, nextY);
      uiState.timelinePan = clamped;
      surface.style.transform = `translate(${clamped.x}px, ${clamped.y}px)`;
    };

    applyPan(uiState.timelinePan?.x ?? -360, uiState.timelinePan?.y ?? -220);

    let dragState = null;

    surface.addEventListener('pointerdown', (event) => {
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: uiState.timelinePan?.x ?? -360,
        originY: uiState.timelinePan?.y ?? -220,
        moved: false,
      };
      viewport.classList.add('is-dragging');
      surface.setPointerCapture?.(event.pointerId);
    });

    surface.addEventListener('pointermove', (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
        dragState.moved = true;
        event.preventDefault();
      }
      applyPan(dragState.originX + deltaX, dragState.originY + deltaY);
    });

    const finishDrag = (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      viewport.classList.remove('is-dragging');
      if (dragState.moved) {
        uiState.openingTapGuardUntil = Date.now() + 180;
      }
      dragState = null;
      surface.releasePointerCapture?.(event.pointerId);
    };

    surface.addEventListener('pointerup', finishDrag);
    surface.addEventListener('pointercancel', finishDrag);
  }

  document.querySelectorAll('[data-timeline-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.timelineTab = button.dataset.timelineTab || 'recommended';
      renderScreen();
    });
  });
}

function bindSearchEvents() {
  bindPostInteractions(document.getElementById('screenArea'));

  const input = document.getElementById('searchInput');
  if (input) {
    input.addEventListener('input', (event) => {
      uiState.searchQuery = event.target.value;
      const cursor = event.target.selectionStart;
      renderScreen();
      const nextInput = document.getElementById('searchInput');
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(cursor, cursor);
      }
    });
  }

  document.querySelectorAll('[data-search-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      const tag = button.dataset.searchTag;
      uiState.searchTags = uiState.searchTags.includes(tag)
        ? uiState.searchTags.filter((item) => item !== tag)
        : [...uiState.searchTags, tag];
      renderScreen();
    });
  });

  document.querySelectorAll('[data-search-sort]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.searchSort = button.dataset.searchSort || 'popular';
      renderScreen();
    });
  });

  document.querySelectorAll('[data-search-clear-section]').forEach((button) => {
    button.addEventListener('click', () => {
      const section = button.dataset.searchClearSection;
      const sceneTags = ['ご飯', 'カフェ', '散歩', 'ドライブ', '旅行', 'まったり', 'おしゃれ', 'ロマンチック', '記念日'];
      const moodTags = ['晴れの日', '雨の日', '夜デート', '特別な日'];
      const sectionTags = section === 'mood' ? moodTags : sceneTags;
      uiState.searchTags = uiState.searchTags.filter((tag) => !sectionTags.includes(tag));
      renderScreen();
    });
  });
}

function bindScreenNavigationEvents() {
  document.querySelectorAll('[data-home-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      navigate(button.dataset.homeNav);
    });
  });

  document.querySelectorAll('[data-close-profile]').forEach((button) => {
    button.addEventListener('click', () => {
      closeProfile();
    });
  });

  document.querySelectorAll('[data-close-compose]').forEach((button) => {
    button.addEventListener('click', () => {
      closeCompose();
    });
  });
}

function normalizeInviteCode(value = '') {
  return String(value)
    .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
    .replace(/\D/g, '')
    .slice(0, 4);
}

function bindInviteEvents() {
  const form = document.querySelector('[data-invite-form]');
  const input = document.querySelector('[data-invite-code]');
  const error = document.querySelector('[data-invite-error]');
  if (!form || !input) return;

  const unlock = () => {
    uiState.openingTapGuardUntil = Date.now() + 700;
    navigate('home');
  };

  input.addEventListener('input', () => {
    const normalized = normalizeInviteCode(input.value);
    input.value = normalized;
    if (error) error.hidden = true;
    if (normalized === '0000') {
      unlock();
    }
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const normalized = normalizeInviteCode(input.value);
    input.value = normalized;
    if (normalized === '0000') {
      unlock();
      return;
    }
    if (error) error.hidden = false;
    input.focus();
    input.select();
  });

  requestAnimationFrame(() => input.focus());
}

function buildComposeCaption(values) {
  if (values.templateId === 'page8' && Array.isArray(values.customLayout?.pretextBoxes)) {
    return values.customLayout.pretextBoxes
      .filter((box) => box.kind === 'title' || box.kind === 'body')
      .map((box) => String(box.data?.text || '').trim())
      .filter(Boolean)
      .join(' / ')
      .slice(0, 120);
  }
  if (values.templateId === 'page8' && Array.isArray(values.customLayout?.textBoxes)) {
    return values.customLayout.textBoxes
      .map((box) => String(box.text || '').trim())
      .filter(Boolean)
      .join(' / ')
      .slice(0, 120);
  }
  return [values.headline, values.subhead, values.intro, values.body]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(' / ')
    .slice(0, 120);
}

function addWrappedText(ctx, text, options) {
  const {
    x,
    y,
    maxWidth,
    lineHeight,
    maxLines,
    align = 'left',
    exclusions = [],
  } = options;

  const baseLeft = align === 'center' ? x - (maxWidth / 2) : x;
  const baseRight = baseLeft + maxWidth;
  const lines = [];
  const paragraphs = String(text || '').split('\n');

  function carveSlots(blocked) {
    let slots = [{ left: baseLeft, right: baseRight }];
    blocked.forEach((interval) => {
      const next = [];
      slots.forEach((slot) => {
        if (interval.right <= slot.left || interval.left >= slot.right) {
          next.push(slot);
          return;
        }
        if (interval.left > slot.left) {
          next.push({ left: slot.left, right: interval.left });
        }
        if (interval.right < slot.right) {
          next.push({ left: interval.right, right: slot.right });
        }
      });
      slots = next;
    });
    return slots.filter((slot) => slot.right - slot.left > 8);
  }

  function lineSlots(lineTop) {
    const lineBottom = lineTop + lineHeight;
    const blocked = exclusions
      .filter((rect) => (rect.y + rect.height) > lineTop && rect.y < lineBottom)
      .map((rect) => ({
        left: Math.max(baseLeft, rect.x),
        right: Math.min(baseRight, rect.x + rect.width),
      }))
      .sort((a, b) => a.left - b.left);
    return carveSlots(blocked);
  }

  function chooseSlot(slots) {
    if (!slots.length) return null;
    if (align === 'right') {
      return [...slots].sort((a, b) => b.right - a.right)[0];
    }
    if (align === 'center') {
      const center = (baseLeft + baseRight) / 2;
      return [...slots].sort((a, b) => {
        const aCenter = (a.left + a.right) / 2;
        const bCenter = (b.left + b.right) / 2;
        return Math.abs(aCenter - center) - Math.abs(bCenter - center);
      })[0];
    }
    return [...slots].sort((a, b) => a.left - b.left)[0];
  }

  function fitUnitsIntoWidth(units, startIndex, separator, width) {
    let current = '';
    let index = startIndex;
    while (index < units.length) {
      const candidate = current ? `${current}${separator}${units[index]}` : units[index];
      if (ctx.measureText(candidate).width <= width || !current) {
        current = candidate;
        index += 1;
        continue;
      }
      break;
    }
    return {
      text: current,
      nextIndex: index === startIndex ? Math.min(units.length, startIndex + 1) : index,
    };
  }

  paragraphs.forEach((paragraph) => {
    const hasSpaces = /\s/.test(paragraph.trim());
    const units = hasSpaces
      ? paragraph.split(/\s+/).filter(Boolean)
      : Array.from(paragraph);
    const separator = hasSpaces ? ' ' : '';

    if (!units.length) {
      const lineIndex = lines.length;
      if (lineIndex < maxLines) {
        lines.push({ text: '', x: baseLeft });
      }
      return;
    }

    let cursor = 0;
    while (cursor < units.length) {
      const lineIndex = lines.length;
      if (lineIndex >= maxLines) break;
      const lineTop = y + (lineIndex * lineHeight);
      const slot = chooseSlot(lineSlots(lineTop)) || { left: baseLeft, right: baseRight };
      const fitted = fitUnitsIntoWidth(units, cursor, separator, Math.max(8, slot.right - slot.left));
      const lineWidth = ctx.measureText(fitted.text).width;
      const lineX = align === 'center'
        ? slot.left + Math.max(0, ((slot.right - slot.left - lineWidth) / 2))
        : align === 'right'
          ? slot.right - lineWidth
          : slot.left;
      lines.push({
        text: fitted.text,
        x: lineX,
      });
      cursor = fitted.nextIndex;
    }
  });

  lines.slice(0, maxLines).forEach((line, index) => {
    ctx.fillText(line.text, line.x, y + index * lineHeight);
  });
}

function clipRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function buildComposeSlotPath(ctx, rect) {
  if (rect.shape === 'arch-right') {
    const rightCenterX = rect.x + (rect.width * 0.42);
    const radiusX = rect.width * 0.58;
    const radiusY = rect.height / 2;
    ctx.beginPath();
    ctx.moveTo(rect.x, rect.y);
    ctx.lineTo(rightCenterX, rect.y);
    ctx.ellipse(
      rightCenterX,
      rect.y + radiusY,
      radiusX,
      radiusY,
      0,
      -Math.PI / 2,
      Math.PI / 2,
    );
    ctx.lineTo(rect.x, rect.y + rect.height);
    ctx.closePath();
    return;
  }
  clipRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, rect.radius);
}

async function drawFileCover(ctx, file, rect, position = { x: 0.5, y: 0.5 }) {
  if (!file) return;

  const bitmap = typeof file === 'string'
    ? await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = file;
    })
    : await createImageBitmap(file);
  const imageRatio = bitmap.width / bitmap.height;
  const rectRatio = rect.width / rect.height;
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;
  const zoom = Math.max(1, Number(position?.zoom) || 1);
  const hasDirectCrop = Number.isFinite(position?.cropX) || Number.isFinite(position?.cropY);
  let focusX = Math.min(1, Math.max(0, position.x ?? 0.5));
  let focusY = Math.min(1, Math.max(0, position.y ?? 0.5));

  if (hasDirectCrop) {
    const baseRenderedWidth = imageRatio > rectRatio ? rect.height * imageRatio : rect.width;
    const baseRenderedHeight = imageRatio > rectRatio ? rect.height : rect.width / imageRatio;
    const overflowX = Math.max(0, (baseRenderedWidth * zoom) - rect.width);
    const overflowY = Math.max(0, (baseRenderedHeight * zoom) - rect.height);
    focusX = overflowX ? Math.min(1, Math.max(0, 0.5 - ((Number(position?.cropX) || 0) / overflowX))) : 0.5;
    focusY = overflowY ? Math.min(1, Math.max(0, 0.5 - ((Number(position?.cropY) || 0) / overflowY))) : 0.5;
  }

  if (imageRatio > rectRatio) {
    sw = Math.max(1, (bitmap.height * rectRatio) / zoom);
    sx = (bitmap.width - sw) * focusX;
  } else {
    sh = Math.max(1, (bitmap.width / rectRatio) / zoom);
    sy = (bitmap.height - sh) * focusY;
  }

  ctx.save();
  buildComposeSlotPath(ctx, rect);
  ctx.clip();
  ctx.drawImage(bitmap, sx, sy, sw, sh, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
  bitmap.close?.();
}

function drawSlotPlaceholder(ctx, rect) {
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(34, 28, 25, 0.88)';
  buildComposeSlotPath(ctx, rect);
  ctx.stroke();

  const radius = Math.min(rect.width, rect.height) * 0.18;
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.42, cy);
  ctx.lineTo(cx + radius * 0.42, cy);
  ctx.moveTo(cx, cy - radius * 0.42);
  ctx.lineTo(cx, cy + radius * 0.42);
  ctx.stroke();
  ctx.restore();
}

async function renderComposeTemplate(values, files, extra = {}) {
  const designWidth = 1240;
  const designHeight = 1754;
  const width = 2480;
  const height = 3508;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return '';
  }

  const scale = width / designWidth;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = values.backgroundColor || '#f8f4ee';
  ctx.fillRect(0, 0, width, height);
  ctx.scale(scale, scale);
  const template = getComposeTemplateById(values.templateId);
  await template.render(ctx, values, files, {
    addWrappedText,
    clipRoundedRect,
    drawFileCover,
    drawSlotPlaceholder,
    defaults: composePreviewDefaults,
    getTextFontStack(fieldKey, fallbackStack) {
      const style = createComposeTextStyleValue(values.textStyles?.[fieldKey]);
      return style.family && COMPOSE_TEXT_FONT_STACKS[style.family]
        ? COMPOSE_TEXT_FONT_STACKS[style.family]
        : fallbackStack;
    },
    page8Files: extra.page8Files || {},
  });

  return canvas.toDataURL('image/png');
}

function bindComposeEvents() {
  const composePage = document.querySelector('.page--compose');
  if (!composePage) return;
  const composeStage = composePage.dataset.composeStage || 'select';
  const form = document.getElementById('composeForm');
  const composeRoot = form || composePage;
  const composeSheet = document.getElementById('composeSheet');
  const composeFrame = composeSheet?.querySelector('.compose-sheet__frame') || null;
  const composePreview = document.querySelector('.compose-preview--editor');
  const customCanvas = composeSheet?.querySelector('[data-custom-canvas]') || null;
  const composeDraft = uiState.composeWorkingDraft || getActivePost(uiState.composeEditingPostId)?.composeData || null;
  const page8DraftValues = {
    ...composePreviewDefaults,
    ...(composeDraft || {}),
  };
  const previewUrls = {
    imageInputPrimary: typeof composeDraft?.standardFiles?.primary?.file === 'string' ? composeDraft.standardFiles.primary.file : '',
    imageInputSecondary: typeof composeDraft?.standardFiles?.secondary?.file === 'string' ? composeDraft.standardFiles.secondary.file : '',
    imageInputAccent: typeof composeDraft?.standardFiles?.accent?.file === 'string' ? composeDraft.standardFiles.accent.file : '',
    imageInputDetail: typeof composeDraft?.standardFiles?.detail?.file === 'string' ? composeDraft.standardFiles.detail.file : '',
  };
  const selectedFiles = {
    primary: createComposeFileState(composeDraft?.standardFiles?.primary),
    secondary: createComposeFileState(composeDraft?.standardFiles?.secondary),
    accent: createComposeFileState(composeDraft?.standardFiles?.accent),
    detail: createComposeFileState(composeDraft?.standardFiles?.detail),
  };
  const tagToggle = document.querySelector('[data-toggle-compose-tags]');
  const tagPanel = document.querySelector('[data-compose-tags]');
  const previewToggle = document.querySelector('[data-toggle-compose-preview]');
  const customTemplateControls = document.querySelector('[data-custom-template-controls]');
  const customInspector = document.querySelector('[data-custom-inspector]');
  const pretextComposeHost = document.querySelector('[data-compose-pretext-host]');
  const editables = Array.from(document.querySelectorAll('[data-editable]'));
  const customLayoutState = {
    options: normalizePage8Options(composeDraft?.customLayout || {}),
    imageBoxes: normalizePage8ImageBoxes(composeDraft?.customLayout || {}),
    textBoxes: normalizePage8TextBoxes(composeDraft?.customLayout || {}, page8DraftValues),
    selectedId: null,
    imageMode: 'frame',
  };
  const customImageFiles = {};
  const editableKeyMap = {
    text: document.querySelector('[data-editable="text"]'),
    headline: document.querySelector('[data-editable="headline"]'),
    subhead: document.querySelector('[data-editable="subhead"]'),
    intro: document.querySelector('[data-editable="intro"]'),
    body: document.querySelector('[data-editable="body"]'),
    date: document.querySelector('[data-editable="date"]'),
    editor: document.querySelector('[data-editable="editor"]'),
  };
  const slotKeyMap = {
    primary: document.querySelector('[data-slot="imageInputPrimary"]'),
    secondary: document.querySelector('[data-slot="imageInputSecondary"]'),
    accent: document.querySelector('[data-slot="imageInputAccent"]'),
    detail: document.querySelector('[data-slot="imageInputDetail"]'),
  };
  const roughOverlay = composeSheet?.querySelector('[data-compose-rough-overlay]') || null;
  const shapeMasks = Array.from(composeSheet?.querySelectorAll('[data-compose-shape-mask]') || []);
  const textTray = document.querySelector('[data-compose-text-tray]');
  const textTrayChrome = textTray?.querySelector('[data-compose-text-tray-chrome]') || null;
  const textTrayBody = textTray?.querySelector('[data-compose-text-tray-body]') || null;
  const textTrayTarget = textTray?.querySelector('[data-compose-text-target]') || null;
  const textTraySizeValue = textTray?.querySelector('[data-compose-text-size-value]') || null;
  const textTraySizeInput = textTray?.querySelector('[data-compose-text-size]') || null;
  const textTraySizeStepButtons = Array.from(textTray?.querySelectorAll('[data-compose-text-size-step]') || []);
  const textTrayFontButtons = Array.from(textTray?.querySelectorAll('[data-compose-text-font]') || []);
  const textTrayLevelButtons = Array.from(textTray?.querySelectorAll('[data-compose-text-tray-level]') || []);
  let activeFixedTextKey = null;
  let textTrayOpenLevel = 100;
  let textTrayDragState = null;
  let textTrayJustDragged = false;

  const composeTextLabels = {
    text: 'Text',
    headline: 'Text',
    subhead: 'Subhead',
    intro: 'Notes',
    body: 'Body',
    date: 'Date',
    editor: 'Editor',
  };

  function serializeStandardFiles() {
    return {
      primary: createComposeFileState(selectedFiles.primary),
      secondary: createComposeFileState(selectedFiles.secondary),
      accent: createComposeFileState(selectedFiles.accent),
      detail: createComposeFileState(selectedFiles.detail),
    };
  }

  function persistComposeDraft(partial = {}) {
    const nextDraft = createComposeWorkingDraft({
      ...(uiState.composeWorkingDraft || composeDraft || {}),
      ...partial,
    });
    uiState.composeWorkingDraft = nextDraft;
    uiState.composeTemplateId = nextDraft.templateId;
    uiState.composeBackgroundColor = nextDraft.backgroundColor;
    return nextDraft;
  }

  function getComposeTextStyleValue(fieldKey) {
    return createComposeTextStyleValue(
      (uiState.composeWorkingDraft || composeDraft || {}).textStyles?.[fieldKey],
    );
  }

  function applyComposeTextStyle(fieldKey) {
    const target = editableKeyMap[fieldKey];
    if (!target) return;
    const style = getComposeTextStyleValue(fieldKey);
    if (!target.dataset.composeBaseFontSize) {
      target.dataset.composeBaseFontSize = window.getComputedStyle(target).fontSize;
    }
    if (!target.dataset.composeBaseLineHeight) {
      target.dataset.composeBaseLineHeight = window.getComputedStyle(target).lineHeight;
    }
    const baseFontSize = Number.parseFloat(target.dataset.composeBaseFontSize || '');
    const baseLineHeight = Number.parseFloat(target.dataset.composeBaseLineHeight || '');
    target.style.setProperty('--compose-text-scale', String(style.scale));
    if (Number.isFinite(baseFontSize)) {
      target.style.fontSize = `${baseFontSize * style.scale}px`;
    }
    if (Number.isFinite(baseLineHeight)) {
      target.style.lineHeight = `${baseLineHeight * style.scale}px`;
    }
    if (style.family && COMPOSE_TEXT_FONT_STACKS[style.family]) {
      target.style.setProperty('--compose-font-stack', COMPOSE_TEXT_FONT_STACKS[style.family]);
      target.style.fontFamily = COMPOSE_TEXT_FONT_STACKS[style.family];
    } else {
      target.style.removeProperty('--compose-font-stack');
      target.style.removeProperty('font-family');
    }
  }

  function applyComposeTextStyles() {
    Object.keys(editableKeyMap).forEach((fieldKey) => applyComposeTextStyle(fieldKey));
  }

  function syncComposeTextTray() {
    if (!textTray || !activeFixedTextKey) return;
    const style = getComposeTextStyleValue(activeFixedTextKey);
    if (textTrayTarget) {
      textTrayTarget.textContent = composeTextLabels[activeFixedTextKey] || 'Text';
    }
    if (textTraySizeValue) {
      textTraySizeValue.textContent = `${Math.round(style.scale * 50)}%`;
    }
    if (textTraySizeInput) {
      textTraySizeInput.value = String(Math.round(style.scale * 50));
    }
    textTrayFontButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.composeTextFont === style.family);
    });
  }

  function syncComposeTextTargetState() {
    editables.forEach((element) => {
      element.classList.toggle('is-active', element.dataset.editable === activeFixedTextKey);
    });
  }

  function getComposeTextTrayHeights() {
    if (!textTray) {
      return { collapsedHeight: 0, expandedHeight: 0, bodyHeight: 0 };
    }
    const previousHidden = textTray.hidden;
    const previousHeight = textTray.style.height;
    const previousVisibility = textTray.style.visibility;
    if (previousHidden) {
      textTray.hidden = false;
      textTray.style.visibility = 'hidden';
    }
    textTray.style.height = 'auto';
    const expandedHeight = textTray.scrollHeight;
    const bodyHeight = textTrayBody?.scrollHeight || 0;
    const collapsedHeight = Math.max(0, expandedHeight - bodyHeight);
    textTray.style.height = previousHeight;
    textTray.style.visibility = previousVisibility;
    if (previousHidden) {
      textTray.hidden = true;
    }
    return { collapsedHeight, expandedHeight, bodyHeight };
  }

  function syncComposeTextTrayLevels() {
    textTrayLevelButtons.forEach((button) => {
      button.classList.toggle('is-active', Number(button.dataset.composeTextTrayLevel) === textTrayOpenLevel);
    });
  }

  function applyComposeTextTrayLevel(nextLevel, options = {}) {
    if (!textTray) return;
    const { animate = true } = options;
    textTrayOpenLevel = Math.max(0, Math.min(100, nextLevel));
    const { collapsedHeight, bodyHeight } = getComposeTextTrayHeights();
    const targetHeight = collapsedHeight + (bodyHeight * (textTrayOpenLevel / 100));
    textTray.style.transition = animate ? '' : 'none';
    textTray.style.height = `${Math.round(targetHeight)}px`;
    textTray.dataset.openLevel = String(textTrayOpenLevel);
    syncComposeTextTrayLevels();
  }

  function snapComposeTextTrayLevel(level) {
    const snapPoints = [0, 50, 100];
    return snapPoints.reduce((closest, candidate) => (
      Math.abs(candidate - level) < Math.abs(closest - level) ? candidate : closest
    ));
  }

  function openComposeTextTray(fieldKey, options = {}) {
    if (!textTray || composeSheet?.dataset.template === 'page8') return;
    const { expand = false } = options;
    const shouldExpandFully = expand && (textTray.hidden || activeFixedTextKey !== fieldKey);
    activeFixedTextKey = fieldKey;
    textTray.hidden = false;
    textTray.dataset.activeField = fieldKey;
    syncComposeTextTargetState();
    syncComposeTextTray();
    applyComposeTextTrayLevel(shouldExpandFully ? 100 : textTrayOpenLevel, { animate: false });
  }

  function closeComposeTextTray() {
    if (!textTray) return;
    textTray.style.removeProperty('height');
    textTray.style.removeProperty('transition');
    activeFixedTextKey = null;
    textTrayOpenLevel = 100;
    textTrayDragState = null;
    textTray.hidden = true;
    delete textTray.dataset.activeField;
    delete textTray.dataset.openLevel;
    syncComposeTextTargetState();
    syncComposeTextTrayLevels();
  }

  function minimizeComposeTextTray() {
    if (!textTray || textTray.hidden) return;
    applyComposeTextTrayLevel(0);
  }

  function restoreActiveComposeTextFocus() {
    if (!activeFixedTextKey) return;
    const target = editableKeyMap[activeFixedTextKey];
    if (!target) return;
    target.focus({ preventScroll: true });
    if (!selectionIsWithin(target)) {
      placeCaretAtEnd(target);
    }
  }

  function updateComposeTextStyle(partial = {}) {
    if (!activeFixedTextKey) return;
    const currentDraft = uiState.composeWorkingDraft || composeDraft || {};
    const nextStyle = {
      ...createComposeTextStyleValue(currentDraft.textStyles?.[activeFixedTextKey]),
      ...partial,
    };
    persistComposeDraft({
      textStyles: {
        ...(currentDraft.textStyles || {}),
        [activeFixedTextKey]: createComposeTextStyleValue(nextStyle),
      },
    });
    applyComposeTextStyle(activeFixedTextKey);
    const target = editableKeyMap[activeFixedTextKey];
    if (target) {
      clampEditable(target);
    }
    syncComposeTextTray();
  }

  function buildComposeDraftSnapshot(options = {}) {
    const { customLayoutOverride } = options;
    const checkedTemplate = composeRoot.querySelector('input[name="templateId"]:checked');
    const checkedBackground = composeRoot.querySelector('input[name="backgroundColor"]:checked');
    const currentTemplateId = String(
      checkedTemplate?.value
      || composeSheet?.dataset.template
      || uiState.composeTemplateId
      || composeDraft?.templateId
      || DEFAULT_COMPOSE_TEMPLATE,
    );
    const currentBackground = String(
      checkedBackground?.value
      || uiState.composeBackgroundColor
      || composeDraft?.backgroundColor
      || '#f8f4ee',
    );
    const baseDraft = persistComposeDraft({
      templateId: currentTemplateId,
      backgroundColor: currentBackground,
      standardFiles: serializeStandardFiles(),
    });

    const tagSource = form ? new FormData(form) : null;
    const fixedTags = tagSource
      ? tagSource.getAll('fixedTags').map((tag) => String(tag))
      : baseDraft.fixedTags;
    const freeTags = tagSource
      ? String(tagSource.get('freeTags') || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
      : baseDraft.freeTags;

    if (currentTemplateId === 'page8') {
      const nextCustomLayout = customLayoutOverride
        || activeComposeBridge?.getSerializedLayout?.()
        || baseDraft.customLayout;
      return persistComposeDraft({
        fixedTags,
        freeTags,
        customLayout: nextCustomLayout,
      });
    }

    const editableTextValue = getEditableValue('text');
    const editableHeadlineValue = getEditableValue('headline');
    const headlineValue = editableTextValue || editableHeadlineValue || baseDraft.headline;

    return persistComposeDraft({
      fixedTags,
      freeTags,
      text: editableTextValue || baseDraft.text || headlineValue,
      headline: headlineValue,
      subhead: getEditableValue('subhead') || baseDraft.subhead,
      intro: getEditableValue('intro') || baseDraft.intro,
      body: getEditableValue('body') || baseDraft.body,
      date: getEditableValue('date') || baseDraft.date,
      editor: getEditableValue('editor') || baseDraft.editor,
      customLayout: customLayoutOverride ?? null,
    });
  }

  const switchComposeStage = (nextStage) => {
    buildComposeDraftSnapshot();
    uiState.composeStage = nextStage;
    render();
  };

  function loadImageSize(file) {
    return new Promise((resolve) => {
      const image = new Image();
      const source = typeof file === 'string' ? file : URL.createObjectURL(file);
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
        if (typeof file !== 'string') {
          URL.revokeObjectURL(source);
        }
      };
      image.onerror = () => {
        resolve(null);
        if (typeof file !== 'string') {
          URL.revokeObjectURL(source);
        }
      };
      image.src = source;
    });
  }

  function updateSlotPosition(inputId) {
    const slotImage = document.querySelector(`[data-slot-image="${inputId}"]`);
    const stateKey = getFixedSlotStateKey(inputId);
    const slotState = selectedFiles[stateKey];
    if (!slotImage) return;
    slotImage.style.backgroundPosition = `${(slotState.position.x || 0.5) * 100}% ${(slotState.position.y || 0.5) * 100}%`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function createCustomId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  function getCustomImageState(boxId) {
    if (!customImageFiles[boxId]) {
      customImageFiles[boxId] = { file: null, position: { x: 0.5, y: 0.5, zoom: 1 }, imageSize: null, previewUrl: '' };
    }
    return customImageFiles[boxId];
  }

  function getCustomTextPreset(kind) {
    if (kind === 'title') {
      return {
        kind: 'title',
        fontSize: 0.046,
        lineHeight: 1.12,
        padding: 0.01,
        family: 'serif',
        weight: 600,
        align: 'left',
      };
    }
    return {
      kind: 'body',
      fontSize: 0.026,
      lineHeight: 1.45,
      padding: 0.012,
      family: 'sans',
      weight: 500,
      align: 'left',
    };
  }

  function applyCustomTextPreset(textItem, kind) {
    Object.assign(textItem, {
      ...textItem,
      ...getCustomTextPreset(kind),
    });
  }

  function createCustomTextBox(align = 'left') {
    const nextText = findSafeTextPosition({
      id: createCustomId('text'),
      kind: 'body',
      text: 'text',
      isDefaultText: true,
      x: 0.18,
      y: 0.2,
      width: 0.28,
      height: 0.12,
      fontSize: 0.026,
      lineHeight: 1.45,
      padding: 0.012,
      align,
      family: 'sans',
      weight: 500,
    }, [
      ...customLayoutState.imageBoxes.map((item) => getCustomRect(item)),
      ...customLayoutState.textBoxes.map((item) => getCustomRect(item)),
    ]);
    customLayoutState.textBoxes = [
      ...customLayoutState.textBoxes,
      clampCustomBoxRect(nextText, PAGE8_MIN_TEXT_SIZE),
    ];
    customLayoutState.selectedId = nextText.id;
    renderCustomCanvas();
  }

  function normalizeEditableContent(element) {
    if (element.dataset.singleLine === 'true') {
      element.innerText = element.innerText.replace(/\r?\n+/g, ' ');
      return;
    }
    element.innerHTML = element.innerHTML
      .replace(/<div><br><\/div>/gi, '<br>')
      .replace(/<div>/gi, '<br>')
      .replace(/<\/div>/gi, '')
      .replace(/&nbsp;/gi, ' ');
  }

  function createEditableMeasureNode(element) {
    const computed = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const boxWidth = rect.width || element.clientWidth;
    const boxHeight = rect.height || element.clientHeight;
    const measure = document.createElement('div');
    measure.setAttribute('aria-hidden', 'true');
    measure.className = element.className;
      if (element.dataset.composeExclusionSide) {
        measure.dataset.composeExclusionSide = element.dataset.composeExclusionSide;
        measure.style.setProperty('--compose-exclusion-top', element.style.getPropertyValue('--compose-exclusion-top'));
        measure.style.setProperty('--compose-exclusion-width', element.style.getPropertyValue('--compose-exclusion-width'));
        measure.style.setProperty('--compose-exclusion-height', element.style.getPropertyValue('--compose-exclusion-height'));
        measure.style.setProperty('--compose-exclusion-bottom', element.style.getPropertyValue('--compose-exclusion-bottom'));
        measure.style.setProperty('--compose-fixed-line-height', element.style.getPropertyValue('--compose-fixed-line-height'));
        measure.style.setProperty('--compose-fixed-block-height', element.style.getPropertyValue('--compose-fixed-block-height'));
      }
    measure.style.position = 'absolute';
    measure.style.left = '-99999px';
    measure.style.top = '0';
    measure.style.visibility = 'hidden';
    measure.style.pointerEvents = 'none';
    measure.style.boxSizing = 'border-box';
    measure.style.width = `${boxWidth}px`;
    measure.style.height = `${boxHeight}px`;
    measure.style.padding = computed.padding;
    measure.style.border = '0';
    measure.style.margin = '0';
    measure.style.overflow = 'hidden';
    measure.style.fontFamily = computed.fontFamily;
    measure.style.fontSize = computed.fontSize;
    measure.style.fontWeight = computed.fontWeight;
    measure.style.fontStyle = computed.fontStyle;
    measure.style.lineHeight = computed.lineHeight;
    measure.style.letterSpacing = computed.letterSpacing;
    measure.style.whiteSpace = computed.whiteSpace;
    measure.style.wordBreak = computed.wordBreak;
    measure.style.overflowWrap = computed.overflowWrap;
    measure.style.textAlign = computed.textAlign;
    measure.style.textTransform = computed.textTransform;
    measure.style.textIndent = computed.textIndent;
    return measure;
  }

  function normalizeEditableValue(element, value) {
    const text = String(value || '').replace(/\r/g, '');
    return element.dataset.singleLine === 'true'
      ? text.replace(/\n+/g, ' ')
      : text;
  }

  function isPage7ConstrainedEditable(element) {
    return composeSheet?.dataset.template === 'page7'
      && (element?.dataset.editable === 'headline' || element?.dataset.editable === 'body');
  }

  function getPage7RawText(element) {
    return normalizeEditableValue(element, element.innerText).replace(/\n+/g, '');
  }

  function measurePage7TextWidth(element, value) {
    const computed = window.getComputedStyle(element);
    const canvas = measurePage7TextWidth.canvas || document.createElement('canvas');
    measurePage7TextWidth.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return value.length * parseFloat(computed.fontSize || '14');
    ctx.font = `${computed.fontStyle || 'normal'} ${computed.fontWeight || '400'} ${computed.fontSize || '14px'} ${computed.fontFamily || 'sans-serif'}`;
    return ctx.measureText(value).width;
  }

  function fitPage7Line(element, units, startIndex, maxWidth) {
    let line = '';
    let index = startIndex;
    while (index < units.length) {
      const candidate = `${line}${units[index]}`;
      if (line && measurePage7TextWidth(element, candidate) > maxWidth) {
        break;
      }
      line = candidate;
      index += 1;
      if (measurePage7TextWidth(element, line) > maxWidth) {
        break;
      }
    }
    return { line, nextIndex: Math.max(index, startIndex + (line ? 0 : 1)) };
  }

  function buildPage7LinePlan(element) {
    const rect = element.getBoundingClientRect();
    const computed = window.getComputedStyle(element);
    const fontSize = parseFloat(computed.fontSize || '14');
    const lineHeight = parseFloat(computed.lineHeight || `${fontSize * 1.3}`) || (fontSize * 1.3);
    const maxLines = Math.max(1, Math.floor(((rect.height || element.clientHeight) + 1) / lineHeight));
    const fullWidth = rect.width || element.clientWidth;
    const exclusionWidth = Math.min(fullWidth * 0.55, fullWidth * 0.28 + 10);
    const shortWidth = Math.max(fullWidth * 0.35, fullWidth - exclusionWidth);
    return Array.from({ length: maxLines }, (_, index) => {
      const isHeadlineRestricted = element.dataset.editable === 'headline' && index >= maxLines - 3;
      const isBodyRestricted = element.dataset.editable === 'body' && index < 3;
      return {
        width: isHeadlineRestricted || isBodyRestricted ? shortWidth : fullWidth,
        boxWidth: fullWidth,
        indent: isBodyRestricted ? exclusionWidth : 0,
        restricted: isHeadlineRestricted || isBodyRestricted,
      };
    });
  }

  function renderPage7Lines(element, rawText) {
    const text = normalizeEditableValue(element, rawText).replace(/\n+/g, '');
    const linePlan = buildPage7LinePlan(element);
    const units = Array.from(text);
    const lines = [];
    let index = 0;
    for (const plan of linePlan) {
      if (index >= units.length) break;
      const fitted = fitPage7Line(element, units, index, plan.width);
      const line = units.slice(index, fitted.nextIndex).join('');
      lines.push({ ...plan, text: line });
      index = fitted.nextIndex;
    }
    const acceptedText = units.slice(0, index).join('');
    element.dataset.page7RawText = acceptedText;
    if (!acceptedText) {
      element.textContent = '';
      return false;
    }
    element.innerHTML = lines.map((line) => {
      const escaped = line.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const style = line.indent
        ? ` style="padding-left:${line.indent}px;width:${line.boxWidth}px;"`
        : ` style="width:${line.width}px;"`;
      return `<div class="compose-page7-line"${style}>${escaped || '<br>'}</div>`;
    }).join('');
    return acceptedText.length === text.length;
  }

  function editableTextFits(element, value) {
    const rect = element.getBoundingClientRect();
    const boxWidth = rect.width || element.clientWidth;
    const boxHeight = rect.height || element.clientHeight;
    const measure = createEditableMeasureNode(element);
    measure.textContent = normalizeEditableValue(element, value);
    document.body.appendChild(measure);
    const isSingleLine = element.dataset.singleLine === 'true';
    const fitsHeight = measure.scrollHeight <= boxHeight + 2;
    const fitsWidth = measure.scrollWidth <= boxWidth + 2;
    measure.remove();
    return isSingleLine ? (fitsHeight && fitsWidth) : fitsHeight;
  }

  function fitEditableText(element, value) {
    const normalized = normalizeEditableValue(element, value);
    if (editableTextFits(element, normalized)) {
      return normalized;
    }

    const units = Array.from(normalized);
    let low = 0;
    let high = units.length;

    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const candidate = units.slice(0, mid).join('');
      if (editableTextFits(element, candidate)) {
        low = mid;
      } else {
        high = mid - 1;
      }
    }

    return units.slice(0, low).join('');
  }

  function shouldClampEditable(element) {
    const templateId = composeSheet?.dataset.template;
    return !(element?.dataset.editable === 'text' && (templateId === 'page4' || templateId === 'page5'));
  }

  function shouldUseBoxLimit(element) {
    return !shouldClampEditable(element);
  }

  function editableOverflowsBox(element) {
    return element.scrollHeight > element.clientHeight + 2
      || element.scrollWidth > element.clientWidth + 2;
  }

  function limitEditableToBox(element) {
    if (isPage7ConstrainedEditable(element)) {
      const rawText = getPage7RawText(element);
      const fits = renderPage7Lines(element, rawText);
      element.dataset.previousValue = element.dataset.page7RawText || '';
      return !fits;
    }
    if (!editableOverflowsBox(element)) {
      element.dataset.previousValue = getEditableText(element);
      return false;
    }
    setEditablePlainText(element, element.dataset.previousValue || '');
    return true;
  }

  function setEditablePlainText(element, value) {
    element.textContent = normalizeEditableValue(element, value);
  }

  function clampEditable(element) {
    if (isPage7ConstrainedEditable(element)) {
      limitEditableToBox(element);
      return;
    }
    if (shouldUseBoxLimit(element)) {
      limitEditableToBox(element);
      return;
    }
    const value = normalizeEditableValue(element, element.innerText);
    if (!element.dataset.previousValue) {
      element.dataset.previousValue = value;
    }

    const fittedValue = fitEditableText(element, value);
    if (fittedValue !== value) {
      setEditablePlainText(element, fittedValue);
      element.dataset.previousValue = fittedValue;
      return;
    }

    element.dataset.previousValue = fittedValue;
  }

  function getEditableText(element) {
    if (isPage7ConstrainedEditable(element)) {
      return getPage7RawText(element);
    }
    return normalizeEditableValue(element, element.innerText);
  }

  function placeCaretAtEnd(element) {
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function getSelectionLengthWithin(element) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;
    const range = selection.getRangeAt(0);
    if (!element.contains(range.startContainer) || !element.contains(range.endContainer)) {
      return 0;
    }
    return selection.toString().length;
  }

  function selectionIsWithin(element) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    return element.contains(range.startContainer) && element.contains(range.endContainer);
  }

  function insertPlainText(element, text) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      element.append(document.createTextNode(text));
      placeCaretAtEnd(element);
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function setPreviewMode(enabled) {
    if (!composePage || !previewToggle) return;
    composePage.classList.toggle('is-preview-mode', enabled);
    previewToggle.textContent = enabled ? 'back' : 'preview';
    previewToggle.setAttribute('aria-pressed', String(enabled));
    editables.forEach((element) => {
      element.setAttribute('contenteditable', enabled ? 'false' : 'true');
      if (enabled) {
        element.blur();
      }
    });
    if (composeSheet?.dataset.template === 'page8') {
      renderCustomCanvas();
    }
  }

  function getEditableValue(name) {
    const target = document.querySelector(`[data-editable="${name}"]`);
    if (!target) return '';
    if (isPage7ConstrainedEditable(target)) {
      return getPage7RawText(target).trim();
    }
    return target.innerText.replace(/\r/g, '').trim();
  }

  function setPreviewBackground() {
    const checked = composeRoot.querySelector('input[name="backgroundColor"]:checked');
    const nextBackground = checked?.value || uiState.composeBackgroundColor || '#f8f4ee';
    uiState.composeBackgroundColor = nextBackground;
    persistComposeDraft({ backgroundColor: nextBackground });
    pretextComposeHost?.style.setProperty('background', nextBackground);
    activeComposeBridge?.setBackgroundColor?.(nextBackground);
    if (!composeSheet) {
      composeRoot.querySelectorAll('.color-chip').forEach((chip) => {
        const input = chip.querySelector('input[name="backgroundColor"]');
        chip.classList.toggle('is-active', Boolean(input?.checked));
      });
      return;
    }
    composeSheet.style.setProperty('--sheet-bg', nextBackground);
    composeRoot.querySelectorAll('.color-chip').forEach((chip) => {
      const input = chip.querySelector('input[name="backgroundColor"]');
      chip.classList.toggle('is-active', Boolean(input?.checked));
    });
  }

  function setPreviewTemplate(templateId) {
    const nextTemplateId = templateId || DEFAULT_COMPOSE_TEMPLATE;
    const currentTemplateId = composeSheet?.dataset.template || (pretextComposeHost ? 'page8' : null);
    const isSwitchingSelectMode = composeStage === 'select'
      && currentTemplateId
      && ((currentTemplateId === 'page8') !== (nextTemplateId === 'page8'));
    const isSwitchingPage8Layout = composeStage === 'edit'
      && currentTemplateId
      && currentTemplateId !== nextTemplateId
      && (currentTemplateId === 'page8' || nextTemplateId === 'page8');
    uiState.composeTemplateId = nextTemplateId;
    persistComposeDraft({ templateId: nextTemplateId });
    if (isSwitchingSelectMode) {
      render();
      return;
    }
    if (isSwitchingPage8Layout) {
      render();
      return;
    }
    if (!composeSheet) {
      composeRoot.querySelectorAll('.template-thumb').forEach((card) => {
        const input = card.querySelector('input[name="templateId"]');
        card.classList.toggle('is-active', input?.value === nextTemplateId);
      });
      composeRoot.querySelectorAll('[data-compose-mode]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.composeMode === (nextTemplateId === 'page8' ? 'custom' : 'template'));
        button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
      });
      if (pretextComposeHost && nextTemplateId !== 'page8') {
        render();
      }
      return;
    }
    composeSheet.dataset.template = nextTemplateId;
    composeRoot.querySelectorAll('.template-thumb').forEach((card) => {
      const input = card.querySelector('input[name="templateId"]');
      card.classList.toggle('is-active', input?.value === nextTemplateId);
    });
    const isCustomTemplate = nextTemplateId === 'page8';
    composeRoot.querySelectorAll('[data-compose-mode]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.composeMode === (isCustomTemplate ? 'custom' : 'template'));
      button.setAttribute('aria-pressed', String(button.classList.contains('is-active')));
    });
    if (customTemplateControls) {
      customTemplateControls.hidden = true;
    }
    composeSheet.classList.toggle('compose-sheet--custom', isCustomTemplate);
    if (isCustomTemplate) {
      closeComposeTextTray();
    }
    applyCustomLayout();
  }

  function focusSelectedTemplateCard(templateId) {
    const selectedRadio = composeRoot.querySelector(`input[name="templateId"][value="${templateId}"]`);
    selectedRadio?.closest('.template-thumb')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }

  function focusSelectedColorCard(colorValue) {
    const selectedRadio = composeRoot.querySelector(`input[name="backgroundColor"][value="${colorValue}"]`);
    selectedRadio?.closest('.color-chip')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }

  function setPreviewImage(inputId) {
    const slotImage = document.querySelector(`[data-slot-image="${inputId}"]`);
    const slotPlaceholder = document.querySelector(`[data-slot-placeholder="${inputId}"]`);
    const removeButton = document.querySelector(`[data-slot-remove="${inputId}"]`);
    if (!slotImage || !slotPlaceholder) return;

    if (previewUrls[inputId]) {
      slotImage.style.backgroundImage = `url("${previewUrls[inputId]}")`;
      slotImage.hidden = false;
      slotPlaceholder.hidden = true;
      if (removeButton) {
        removeButton.hidden = false;
      }
      return;
    }

    slotImage.style.backgroundImage = '';
    slotImage.hidden = true;
    slotPlaceholder.hidden = false;
    if (removeButton) {
      removeButton.hidden = true;
    }
  }

  function clampCustomBoxRect(box, minimums) {
    const width = Math.min(PAGE8_BOUNDS.width, Math.max(minimums.width, box.width));
    const height = Math.min(PAGE8_BOUNDS.height, Math.max(minimums.height, box.height));
    return {
      ...box,
      x: Math.min(PAGE8_BOUNDS.x + PAGE8_BOUNDS.width - width, Math.max(PAGE8_BOUNDS.x, snapPage8Value(box.x))),
      y: Math.min(PAGE8_BOUNDS.y + PAGE8_BOUNDS.height - height, Math.max(PAGE8_BOUNDS.y, snapPage8Value(box.y))),
      width: snapPage8Value(width),
      height: snapPage8Value(height),
    };
  }

  function rectsOverlap(a, b, padding = 0.02) {
    return !(
      a.x + a.width + padding <= b.x ||
      b.x + b.width + padding <= a.x ||
      a.y + a.height + padding <= b.y ||
      b.y + b.height + padding <= a.y
    );
  }

  function getCustomRect(item) {
    return { x: item.x, y: item.y, width: item.width, height: item.height };
  }

  function getCustomBlockers(itemId, options = {}) {
    const { ignoreText = false, ignoreImages = false } = options;
    return [
      ...(!ignoreImages
        ? customLayoutState.imageBoxes.filter((item) => item.id !== itemId).map((item) => getCustomRect(item))
        : []),
      ...(!ignoreText
        ? customLayoutState.textBoxes.filter((item) => item.id !== itemId).map((item) => getCustomRect(item))
        : []),
    ];
  }

  function isSafeCustomPosition(candidate, itemId, options = {}) {
    const rect = getCustomRect(candidate);
    const blockers = getCustomBlockers(itemId, options);
    return !blockers.some((blocker) => rectsOverlap(rect, blocker));
  }

  function findNearestSafeBoxPosition(item, itemId, minimums, options = {}) {
    const original = clampCustomBoxRect({ ...item }, minimums);
    if (isSafeCustomPosition(original, itemId, options)) {
      return original;
    }

    const directions = [
      [0, -1],
      [1, 0],
      [0, 1],
      [-1, 0],
      [1, -1],
      [1, 1],
      [-1, 1],
      [-1, -1],
    ];
    const step = PAGE8_GRID * 2;

    for (let ring = 1; ring <= 18; ring += 1) {
      for (const [dx, dy] of directions) {
        const candidate = clampCustomBoxRect({
          ...original,
          x: original.x + (dx * step * ring),
          y: original.y + (dy * step * ring),
        }, minimums);
        if (isSafeCustomPosition(candidate, itemId, options)) {
          return candidate;
        }
      }
    }

    for (let y = PAGE8_BOUNDS.y; y <= PAGE8_BOUNDS.y + PAGE8_BOUNDS.height - original.height; y += step) {
      for (let x = PAGE8_BOUNDS.x; x <= PAGE8_BOUNDS.x + PAGE8_BOUNDS.width - original.width; x += step) {
        const candidate = clampCustomBoxRect({ ...original, x, y }, minimums);
        if (isSafeCustomPosition(candidate, itemId, options)) {
          return candidate;
        }
      }
    }

    return original;
  }

  function carveHorizontalSlots(target, blockers, padding = 0.018) {
    const targetTop = target.y - padding;
    const targetBottom = target.y + target.height + padding;
    const boundsLeft = PAGE8_BOUNDS.x;
    const boundsRight = PAGE8_BOUNDS.x + PAGE8_BOUNDS.width;
    let slots = [{ left: boundsLeft, right: boundsRight }];

    blockers.forEach((blocker) => {
      const blockerTop = blocker.y - padding;
      const blockerBottom = blocker.y + blocker.height + padding;
      if (blockerBottom <= targetTop || blockerTop >= targetBottom) return;
      const blockLeft = Math.max(boundsLeft, blocker.x - padding);
      const blockRight = Math.min(boundsRight, blocker.x + blocker.width + padding);
      slots = slots.flatMap((slot) => {
        if (blockRight <= slot.left || blockLeft >= slot.right) {
          return [slot];
        }
        const next = [];
        if (blockLeft > slot.left) {
          next.push({ left: slot.left, right: blockLeft });
        }
        if (blockRight < slot.right) {
          next.push({ left: blockRight, right: slot.right });
        }
        return next;
      });
    });

    return slots.filter((slot) => (slot.right - slot.left) >= target.width);
  }

  function findSafeTextPosition(textItem, blockers) {
    const original = clampCustomBoxRect({ ...textItem }, PAGE8_MIN_TEXT_SIZE);
    const candidateYs = [];
    for (let ring = 0; ring <= 24; ring += 1) {
      const upward = snapPage8Value(original.y - (ring * PAGE8_GRID));
      const downward = snapPage8Value(original.y + (ring * PAGE8_GRID));
      if (upward >= PAGE8_BOUNDS.y) candidateYs.push(upward);
      if (downward <= PAGE8_BOUNDS.y + PAGE8_BOUNDS.height - original.height && downward !== upward) {
        candidateYs.push(downward);
      }
    }

    let bestCandidate = original;
    let bestScore = Number.POSITIVE_INFINITY;

    candidateYs.forEach((candidateY) => {
      const baseTarget = {
        ...original,
        y: candidateY,
      };
      const slots = carveHorizontalSlots(baseTarget, blockers);
      slots.forEach((slot) => {
        const minX = slot.left;
        const maxX = slot.right - original.width;
        const clampedX = snapPage8Value(Math.min(maxX, Math.max(minX, original.x)));
        const candidate = clampCustomBoxRect({
          ...original,
          x: clampedX,
          y: candidateY,
        }, PAGE8_MIN_TEXT_SIZE);
        if (blockers.some((blocker) => rectsOverlap(getCustomRect(candidate), blocker))) return;
        const dx = Math.abs(candidate.x - original.x);
        const dy = Math.abs(candidate.y - original.y);
        const score = (dy * 2) + dx;
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = candidate;
        }
      });
    });

    return bestCandidate;
  }

  function reflowTextBoxes(movedId) {
    const movedRecord = getCustomItemRecord(movedId);
    if (!movedRecord || movedRecord.type !== 'image') return;

    customLayoutState.textBoxes = customLayoutState.textBoxes.map((textBox) => {
      const blockers = [
        ...customLayoutState.imageBoxes.filter((item) => item.id !== textBox.id).map((item) => getCustomRect(item)),
        ...customLayoutState.textBoxes.filter((item) => item.id !== textBox.id).map((item) => getCustomRect(item)),
      ];
      return findSafeTextPosition(textBox, blockers);
    });
  }

  function getTextBlockers(itemId) {
    return [
      ...customLayoutState.imageBoxes.filter((item) => item.id !== itemId).map((item) => getCustomRect(item)),
      ...customLayoutState.textBoxes.filter((item) => item.id !== itemId).map((item) => getCustomRect(item)),
    ];
  }

  function getCustomItemRecord(itemId) {
    const imageIndex = customLayoutState.imageBoxes.findIndex((box) => box.id === itemId);
    if (imageIndex >= 0) {
      return { type: 'image', collection: customLayoutState.imageBoxes, index: imageIndex, item: customLayoutState.imageBoxes[imageIndex] };
    }
    const textIndex = customLayoutState.textBoxes.findIndex((box) => box.id === itemId);
    if (textIndex >= 0) {
      return { type: 'text', collection: customLayoutState.textBoxes, index: textIndex, item: customLayoutState.textBoxes[textIndex] };
    }
    return null;
  }

  function getCustomItemMinimums(type) {
    return type === 'image' ? PAGE8_MIN_IMAGE_SIZE : PAGE8_MIN_TEXT_SIZE;
  }

  function formatCustomMeasure(value) {
    return `${Math.round(value * 100)}%`;
  }

  function fitCustomTextBoxToContent(itemId, options = {}) {
    const { rerender = false } = options;
    if (!composeFrame || !customCanvas) return;
    const record = itemId ? getCustomItemRecord(itemId) : null;
    if (!record || record.type !== 'text') return;
    const liveText = customCanvas.querySelector(`[data-custom-text="${itemId}"]`);
    if (!liveText) return;
    const frameRect = composeFrame.getBoundingClientRect();
    if (!frameRect.height) return;
    const nextHeight = Math.max(
      PAGE8_MIN_TEXT_SIZE.height,
      snapPage8ValueUp((liveText.scrollHeight + 8) / frameRect.height),
    );
    if (Math.abs(nextHeight - record.item.height) < (PAGE8_GRID / 2)) return;
    record.item.height = nextHeight;
    Object.assign(record.item, clampCustomBoxRect(record.item, PAGE8_MIN_TEXT_SIZE));
    Object.assign(record.item, findSafeTextPosition(record.item, getTextBlockers(itemId)));
    if (rerender) {
      renderCustomCanvas();
      return;
    }
    applyCustomItemRect(itemId, record.item);
    renderCustomInspector();
  }

  function syncCustomSelection() {
    if (!customCanvas) return;
    customCanvas.querySelectorAll('[data-custom-item]').forEach((item) => {
      item.classList.toggle('is-selected', item.dataset.customItem === customLayoutState.selectedId);
    });
  }

  function applyCustomItemRect(itemId, rectSource) {
    const target = customCanvas?.querySelector(`[data-custom-item="${itemId}"]`);
    if (!target) return;
    const rect = page8RectToPercent(rectSource);
    target.style.left = rect.left;
    target.style.top = rect.top;
    target.style.width = rect.width;
    target.style.height = rect.height;
  }

  function applyAllCustomItemRects() {
    [
      ...customLayoutState.imageBoxes,
      ...customLayoutState.textBoxes,
    ].forEach((item) => {
      applyCustomItemRect(item.id, item);
    });
  }

  function selectCustomItem(itemId, options = {}) {
    const { rerender = false } = options;
    customLayoutState.selectedId = itemId;
    if (rerender && composeSheet?.dataset.template === 'page8') {
      renderCustomCanvas();
      return;
    }
    syncCustomSelection();
    renderCustomInspector();
  }

  function renderCustomInspector() {
    if (!customInspector || composeSheet?.dataset.template !== 'page8') return;
    const record = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
    if (!record) {
      customInspector.innerHTML = `
        <p class="compose-custom-inspector__title">Selection</p>
        <p class="compose-custom-inspector__note">ボックスを選ぶと、ここで内容や見た目を調整できます。</p>
      `;
      return;
    }

    if (record.type === 'image') {
      const imageState = getCustomImageState(record.item.id);
      const hasImage = Boolean(imageState.previewUrl || imageState.file);
      const zoomValue = Math.max(1, Number(imageState.position?.zoom) || 1);
      customInspector.innerHTML = `
        <p class="compose-custom-inspector__title">Image Box</p>
        <p class="compose-custom-inspector__note">${customLayoutState.imageMode === 'crop' ? 'Crop 中は画像面をドラッグして見せ方を調整します。' : 'Frame 中はボックス自体を動かします。Crop に切り替えると画像だけを動かせます。'}</p>
        <div class="compose-custom-inspector__meta">
          <span>W ${formatCustomMeasure(record.item.width)}</span>
          <span>H ${formatCustomMeasure(record.item.height)}</span>
        </div>
        <div class="compose-custom-inspector__field">
          <span>Mode</span>
          <div class="compose-custom-inspector__segmented compose-custom-inspector__segmented--dual">
            <button type="button" data-custom-image-mode="frame" class="${customLayoutState.imageMode === 'frame' ? 'is-active' : ''}">Frame</button>
            <button type="button" data-custom-image-mode="crop" class="${customLayoutState.imageMode === 'crop' ? 'is-active' : ''}" ${hasImage ? '' : 'disabled'}>Crop</button>
          </div>
        </div>
        <label class="compose-custom-inspector__field">
          <span>Zoom</span>
          <input class="compose-custom-inspector__range" data-custom-control="zoom" type="range" min="1" max="3" step="0.01" value="${zoomValue}" ${hasImage ? '' : 'disabled'} />
        </label>
        <div class="compose-custom-inspector__segmented compose-custom-inspector__segmented--dual">
          <button type="button" data-custom-control="replace-image">${hasImage ? 'Replace' : 'Upload'}</button>
          <button type="button" data-custom-control="delete">Delete</button>
        </div>
      `;
      customInspector.querySelectorAll('[data-custom-image-mode]').forEach((button) => {
        button.addEventListener('click', () => {
          if (button.hasAttribute('disabled')) return;
          customLayoutState.imageMode = button.dataset.customImageMode === 'crop' ? 'crop' : 'frame';
          renderCustomInspector();
        });
      });
      customInspector.querySelector('[data-custom-control="zoom"]')?.addEventListener('input', (event) => {
        imageState.position.zoom = Math.max(1, Number(event.target.value) || 1);
        renderCustomCanvas();
      });
      customInspector.querySelector('[data-custom-control="replace-image"]')?.addEventListener('click', () => {
        document.getElementById(`custom-image-${record.item.id}`)?.click();
      });
    } else {
      customInspector.innerHTML = `
      <p class="compose-custom-inspector__title">Text Box</p>
      <p class="compose-custom-inspector__note">Title / Body のプリセットを起点にして、細部は個別調整できます。</p>
      <div class="compose-custom-inspector__meta">
        <span>W ${formatCustomMeasure(record.item.width)}</span>
        <span>H ${formatCustomMeasure(record.item.height)}</span>
      </div>
      <div class="compose-custom-inspector__field">
        <span>Preset</span>
        <div class="compose-custom-inspector__segmented compose-custom-inspector__segmented--dual">
          <button type="button" data-custom-preset="title" class="${record.item.kind === 'title' ? 'is-active' : ''}">Title</button>
          <button type="button" data-custom-preset="body" class="${record.item.kind === 'body' ? 'is-active' : ''}">Body</button>
        </div>
      </div>
      <label class="compose-custom-inspector__field">
        <span>Text</span>
        <textarea class="compose-custom-inspector__textarea" data-custom-control="text">${escapeHtml(record.item.text)}</textarea>
      </label>
      <label class="compose-custom-inspector__field">
        <span>Size</span>
        <input class="compose-custom-inspector__range" data-custom-control="fontSize" type="range" min="14" max="54" value="${Math.round(record.item.fontSize * 520)}" />
      </label>
      <label class="compose-custom-inspector__field">
        <span>Leading</span>
        <input class="compose-custom-inspector__range" data-custom-control="lineHeight" type="range" min="100" max="220" step="1" value="${Math.round(record.item.lineHeight * 100)}" />
      </label>
      <label class="compose-custom-inspector__field">
        <span>Padding</span>
        <input class="compose-custom-inspector__range" data-custom-control="padding" type="range" min="4" max="40" step="1" value="${Math.round(record.item.padding * 1000)}" />
      </label>
      <label class="compose-custom-inspector__field">
        <span>Weight</span>
        <input class="compose-custom-inspector__range" data-custom-control="weight" type="range" min="400" max="700" step="100" value="${record.item.weight}" />
      </label>
      <div class="compose-custom-inspector__field">
        <span>Align</span>
        <div class="compose-custom-inspector__segmented compose-custom-inspector__segmented--align">
          <button type="button" data-custom-align="left" class="${record.item.align === 'left' ? 'is-active' : ''}" aria-label="Align left">${getIcon('alignLeft')}</button>
          <button type="button" data-custom-align="center" class="${record.item.align === 'center' ? 'is-active' : ''}" aria-label="Align center">${getIcon('alignCenter')}</button>
          <button type="button" data-custom-align="right" class="${record.item.align === 'right' ? 'is-active' : ''}" aria-label="Align right">${getIcon('alignRight')}</button>
        </div>
      </div>
      <div class="compose-custom-inspector__field">
        <span>Typeface</span>
        <div class="compose-custom-inspector__segmented compose-custom-inspector__segmented--dual">
          <button type="button" data-custom-family="sans" class="${record.item.family === 'sans' ? 'is-active' : ''}">Sans</button>
          <button type="button" data-custom-family="serif" class="${record.item.family === 'serif' ? 'is-active' : ''}">Serif</button>
        </div>
      </div>
      <div class="compose-custom-inspector__segmented compose-custom-inspector__segmented--single">
        <button type="button" data-custom-control="delete">Delete</button>
      </div>
    `;
      const textArea = customInspector.querySelector('[data-custom-control="text"]');
      textArea?.addEventListener('focus', (event) => {
        const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
        if (!nextRecord || nextRecord.type !== 'text') return;
        if (nextRecord.item.isDefaultText && nextRecord.item.text.trim().toLowerCase() === 'text') {
          nextRecord.item.text = '';
          nextRecord.item.isDefaultText = false;
          event.target.value = '';
          const liveText = customCanvas?.querySelector(`[data-custom-text="${nextRecord.item.id}"]`);
          if (liveText) {
            liveText.textContent = '';
          }
        }
      });
      textArea?.addEventListener('input', (event) => {
        const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
        if (!nextRecord || nextRecord.type !== 'text') return;
        nextRecord.item.text = event.target.value.replace(/\r/g, '');
        nextRecord.item.isDefaultText = false;
        const liveText = customCanvas?.querySelector(`[data-custom-text="${nextRecord.item.id}"]`);
        if (liveText && liveText !== document.activeElement) {
          liveText.textContent = nextRecord.item.text;
        }
        fitCustomTextBoxToContent(nextRecord.item.id);
      });

      customInspector.querySelectorAll('[data-custom-preset]').forEach((button) => {
        button.addEventListener('click', () => {
          const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
          if (!nextRecord || nextRecord.type !== 'text') return;
          applyCustomTextPreset(nextRecord.item, button.dataset.customPreset === 'title' ? 'title' : 'body');
          renderCustomCanvas();
          fitCustomTextBoxToContent(nextRecord.item.id, { rerender: true });
        });
      });

      customInspector.querySelector('[data-custom-control="fontSize"]')?.addEventListener('input', (event) => {
        const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
        if (!nextRecord || nextRecord.type !== 'text') return;
        nextRecord.item.fontSize = Number(event.target.value) / 520;
        renderCustomCanvas();
        fitCustomTextBoxToContent(nextRecord.item.id, { rerender: true });
      });

      customInspector.querySelector('[data-custom-control="lineHeight"]')?.addEventListener('input', (event) => {
        const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
        if (!nextRecord || nextRecord.type !== 'text') return;
        nextRecord.item.lineHeight = Number(event.target.value) / 100;
        renderCustomCanvas();
        fitCustomTextBoxToContent(nextRecord.item.id, { rerender: true });
      });

      customInspector.querySelector('[data-custom-control="padding"]')?.addEventListener('input', (event) => {
        const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
        if (!nextRecord || nextRecord.type !== 'text') return;
        nextRecord.item.padding = Number(event.target.value) / 1000;
        renderCustomCanvas();
        fitCustomTextBoxToContent(nextRecord.item.id, { rerender: true });
      });

      customInspector.querySelector('[data-custom-control="weight"]')?.addEventListener('input', (event) => {
        const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
        if (!nextRecord || nextRecord.type !== 'text') return;
        nextRecord.item.weight = Number(event.target.value);
        renderCustomCanvas();
        fitCustomTextBoxToContent(nextRecord.item.id, { rerender: true });
      });

      customInspector.querySelectorAll('[data-custom-align]').forEach((button) => {
        button.addEventListener('click', () => {
          const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
          if (!nextRecord || nextRecord.type !== 'text') return;
          nextRecord.item.align = button.dataset.customAlign || 'left';
          renderCustomCanvas();
        });
      });

      customInspector.querySelectorAll('[data-custom-family]').forEach((button) => {
        button.addEventListener('click', () => {
          const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
          if (!nextRecord || nextRecord.type !== 'text') return;
          nextRecord.item.family = button.dataset.customFamily === 'serif' ? 'serif' : 'sans';
          nextRecord.item.kind = nextRecord.item.family === 'serif' ? 'title' : 'body';
          nextRecord.item.weight = nextRecord.item.family === 'serif'
            ? Math.max(500, nextRecord.item.weight)
            : Math.min(600, nextRecord.item.weight);
          renderCustomCanvas();
          fitCustomTextBoxToContent(nextRecord.item.id, { rerender: true });
        });
      });
    }

    customInspector.querySelector('[data-custom-control="delete"]')?.addEventListener('click', () => {
      const itemId = customLayoutState.selectedId;
      const nextRecord = itemId ? getCustomItemRecord(itemId) : null;
      if (!nextRecord) return;
      nextRecord.collection.splice(nextRecord.index, 1);
      if (nextRecord.type === 'image') {
        const state = customImageFiles[itemId];
        if (state?.previewUrl) {
          URL.revokeObjectURL(state.previewUrl);
        }
        delete customImageFiles[itemId];
        reflowTextBoxes(itemId);
      }
      customLayoutState.selectedId = null;
      renderCustomCanvas();
    });
  }

  function renderCustomCanvas() {
    if (!customCanvas || !composeSheet) return;
    const isCustomTemplate = composeSheet.dataset.template === 'page8';
    const interactive = composeStage === 'edit' && !composePage?.classList.contains('is-preview-mode');
    customCanvas.hidden = !isCustomTemplate;
    if (!isCustomTemplate) {
      customCanvas.innerHTML = '';
      renderCustomInspector();
      return;
    }

    const itemIds = [
      ...customLayoutState.imageBoxes.map((box) => box.id),
      ...customLayoutState.textBoxes.map((box) => box.id),
    ];
    if (!customLayoutState.selectedId || !itemIds.includes(customLayoutState.selectedId)) {
      customLayoutState.selectedId = itemIds[0] || null;
    }

    const imageMarkup = customLayoutState.imageBoxes.map((box) => {
      const rect = page8RectToPercent(box);
      const state = getCustomImageState(box.id);
      const hasImage = Boolean(state.previewUrl || state.file);
      const imagePosition = state.position || { x: 0.5, y: 0.5, zoom: 1 };
      const selectedClass = `${customLayoutState.selectedId === box.id ? ' is-selected' : ''}${hasImage ? '' : ' is-empty'}`;
      const surfaceMarkup = hasImage
        ? `<img class="compose-custom-item__image" src="${state.previewUrl}" alt="" draggable="false" style="object-position:${(imagePosition.x || 0.5) * 100}% ${(imagePosition.y || 0.5) * 100}%;transform:scale(${Math.max(1, imagePosition.zoom || 1)});" />`
        : `<div class="compose-custom-item__placeholder"><span class="compose-custom-item__plus">${getIcon('compose')}</span></div>`;
      return `
        <div
          class="compose-custom-item compose-custom-item--image${selectedClass}"
          data-custom-item="${box.id}"
          data-custom-type="image"
          style="left:${rect.left};top:${rect.top};width:${rect.width};height:${rect.height};"
        >
          ${interactive ? `<input class="field__file" id="custom-image-${box.id}" type="file" accept="image/*" />` : ''}
          ${interactive
            ? `<div class="compose-custom-item__surface compose-custom-item__surface--image" data-custom-surface="${box.id}">${surfaceMarkup}</div>`
            : `<div class="compose-custom-item__surface compose-custom-item__surface--image">${surfaceMarkup}</div>`}
          ${interactive ? `<button class="compose-custom-item__drag" type="button" data-custom-drag="${box.id}" aria-label="move image box">${getIcon('drag')}</button>` : ''}
          ${interactive ? `<button class="compose-custom-item__remove" type="button" data-custom-remove="${box.id}" aria-label="remove image box">&times;</button>` : ''}
          ${interactive ? `<button class="compose-custom-item__resize" type="button" data-custom-resize="${box.id}" aria-label="resize image box"></button>` : ''}
        </div>
      `;
    }).join('');

    const textMarkup = customLayoutState.textBoxes.map((box) => {
      const rect = page8RectToPercent(box);
      const selectedClass = customLayoutState.selectedId === box.id ? ' is-selected' : '';
      return `
        <div
          class="compose-custom-item compose-custom-item--text${selectedClass}"
          data-custom-item="${box.id}"
          data-custom-type="text"
          style="left:${rect.left};top:${rect.top};width:${rect.width};height:${rect.height};"
        >
          <div
            class="compose-custom-item__text"
            data-custom-text="${box.id}"
            contenteditable="${interactive ? 'true' : 'false'}"
            spellcheck="false"
            style="text-align:${box.align};font-size:${Math.max(11, box.fontSize * 520)}px;line-height:${box.lineHeight};padding:${Math.max(4, box.padding * 520)}px;font-family:${box.family === 'serif' ? `'Cormorant Garamond', 'Times New Roman', serif` : `'Noto Sans JP', sans-serif`};font-weight:${box.weight};"
          >${escapeHtml(box.text)}</div>
          ${interactive ? `<button class="compose-custom-item__drag" type="button" data-custom-drag="${box.id}" aria-label="move text box">${getIcon('drag')}</button>` : ''}
          ${interactive ? `<button class="compose-custom-item__remove" type="button" data-custom-remove="${box.id}" aria-label="remove text box">&times;</button>` : ''}
          ${interactive ? `<button class="compose-custom-item__resize" type="button" data-custom-resize="${box.id}" aria-label="resize text box"></button>` : ''}
        </div>
      `;
    }).join('');

    customCanvas.innerHTML = `${imageMarkup}${textMarkup}`;
    renderCustomInspector();

    customCanvas.onpointerdown = (event) => {
      if (event.target !== customCanvas) return;
      customLayoutState.selectedId = null;
      syncCustomSelection();
      renderCustomInspector();
    };

    customCanvas.querySelectorAll('[data-custom-item]').forEach((item) => {
      let dragState = null;

      item.addEventListener('pointerdown', (event) => {
        const itemId = item.dataset.customItem || '';
        const record = getCustomItemRecord(itemId);
        if (!record || !composeFrame) return;
        if (event.target.closest('[data-custom-remove], [data-custom-resize]')) return;
        event.preventDefault();
        const dragHandle = event.target.closest('[data-custom-drag]');
        const textSurface = event.target.closest('[data-custom-text]');
        const imageSurface = event.target.closest('[data-custom-surface]');
        const imageState = record.type === 'image' ? getCustomImageState(itemId) : null;
        selectCustomItem(itemId);
        const frameRect = composeFrame.getBoundingClientRect();
        const hasImage = Boolean(imageState?.previewUrl || imageState?.file);
        const isCropDrag = record.type === 'image'
          && customLayoutState.imageMode === 'crop'
          && hasImage
          && imageSurface
          && !dragHandle;
        dragState = {
          pointerId: event.pointerId,
          itemId,
          mode: isCropDrag ? 'crop-image' : 'move',
          originX: isCropDrag ? (imageState.position.x || 0.5) : record.item.x,
          originY: isCropDrag ? (imageState.position.y || 0.5) : record.item.y,
          startX: event.clientX,
          startY: event.clientY,
          frameWidth: frameRect.width,
          frameHeight: frameRect.height,
          type: record.type,
          zoom: imageState?.position?.zoom || 1,
          targetSurface: record.type === 'image' && !hasImage
            ? imageSurface
            : null,
          targetText: dragHandle ? null : textSurface,
          cropSurface: isCropDrag ? imageSurface : null,
          dragged: false,
        };
        item.setPointerCapture?.(event.pointerId);
      });

      item.addEventListener('pointermove', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        if (!dragState.dragged && Math.hypot(deltaX, deltaY) < 6) return;
        dragState.dragged = true;
        event.preventDefault();
        const record = getCustomItemRecord(dragState.itemId);
        if (!record) return;
        const previousRect = {
          x: record.item.x,
          y: record.item.y,
          width: record.item.width,
          height: record.item.height,
        };
        if (dragState.mode === 'crop-image') {
          const surfaceRect = dragState.cropSurface?.getBoundingClientRect();
          const imageState = getCustomImageState(dragState.itemId);
          const size = imageState.imageSize;
          if (!surfaceRect || !size) return;
          const imageRatio = size.width / size.height;
          const surfaceRatio = surfaceRect.width / surfaceRect.height;
          const renderedWidth = (imageRatio > surfaceRatio ? surfaceRect.height * imageRatio : surfaceRect.width) * dragState.zoom;
          const renderedHeight = (imageRatio > surfaceRatio ? surfaceRect.height : surfaceRect.width / imageRatio) * dragState.zoom;
          const overflowX = Math.max(0, renderedWidth - surfaceRect.width);
          const overflowY = Math.max(0, renderedHeight - surfaceRect.height);
          imageState.position.x = overflowX ? Math.min(1, Math.max(0, dragState.originX - (deltaX / overflowX))) : 0.5;
          imageState.position.y = overflowY ? Math.min(1, Math.max(0, dragState.originY - (deltaY / overflowY))) : 0.5;
          const liveImage = dragState.cropSurface?.querySelector('.compose-custom-item__image');
          if (liveImage) {
            liveImage.style.objectPosition = `${imageState.position.x * 100}% ${imageState.position.y * 100}%`;
          }
        } else {
          record.item.x = dragState.originX + (deltaX / dragState.frameWidth);
          record.item.y = dragState.originY + (deltaY / dragState.frameHeight);
          Object.assign(record.item, clampCustomBoxRect(record.item, getCustomItemMinimums(record.type)));
          const safetyOptions = record.type === 'image' ? { ignoreText: true } : {};
          Object.assign(record.item, findNearestSafeBoxPosition(record.item, record.item.id, getCustomItemMinimums(record.type), safetyOptions));
          if (!isSafeCustomPosition(record.item, record.item.id, safetyOptions)) {
            Object.assign(record.item, previousRect);
          }
          if (record.type === 'image') {
            reflowTextBoxes(record.item.id);
          } else {
            Object.assign(record.item, findSafeTextPosition(record.item, getTextBlockers(record.item.id)));
          }
          renderCustomInspector();
          applyAllCustomItemRects();
        }
      });

      const finishItemDrag = (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        const itemId = dragState.itemId;
        const wasDragged = dragState.dragged;
        const openedSurface = dragState.targetSurface;
        const openedText = dragState.targetText;
        dragState = null;
        item.releasePointerCapture?.(event.pointerId);
        if (wasDragged) return;
        if (openedSurface) {
          document.getElementById(`custom-image-${itemId}`)?.click();
          return;
        }
        if (openedText) {
          openedText.focus();
          placeCaretAtEnd(openedText);
        }
      };

      item.addEventListener('pointerup', finishItemDrag);
      item.addEventListener('pointercancel', finishItemDrag);
    });

    customCanvas.querySelectorAll('[data-custom-remove]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const itemId = button.dataset.customRemove;
        const record = itemId ? getCustomItemRecord(itemId) : null;
        if (!record) return;
        record.collection.splice(record.index, 1);
        if (record.type === 'image') {
          const state = customImageFiles[itemId];
          if (state?.previewUrl) {
            URL.revokeObjectURL(state.previewUrl);
          }
          delete customImageFiles[itemId];
          reflowTextBoxes(itemId);
        }
        customLayoutState.selectedId = null;
        renderCustomCanvas();
      });
    });

    customCanvas.querySelectorAll('[data-custom-text]').forEach((element) => {
      element.addEventListener('beforeinput', (event) => {
        if (event.inputType === 'insertParagraph') {
          insertPlainText(element, '\n');
          event.preventDefault();
        }
      });
      element.addEventListener('focus', () => {
        const itemId = element.dataset.customText;
        const record = itemId ? getCustomItemRecord(itemId) : null;
        if (record?.type === 'text' && record.item.isDefaultText && record.item.text.trim().toLowerCase() === 'text') {
          record.item.text = '';
          record.item.isDefaultText = false;
          element.textContent = '';
        }
        selectCustomItem(element.dataset.customText || '');
      });
      element.addEventListener('input', () => {
        const itemId = element.dataset.customText;
        const record = itemId ? getCustomItemRecord(itemId) : null;
        if (!record) return;
        record.item.text = element.innerText.replace(/\r/g, '');
        record.item.isDefaultText = false;
        const inspectorText = customInspector?.querySelector('[data-custom-control="text"]');
        if (inspectorText && inspectorText !== document.activeElement) {
          inspectorText.value = record.item.text;
        }
        fitCustomTextBoxToContent(record.item.id);
      });
    });

    customCanvas.querySelectorAll('input[id^="custom-image-"]').forEach((input) => {
      input.addEventListener('change', async (event) => {
        const boxId = input.id.replace('custom-image-', '');
        const state = getCustomImageState(boxId);
        const file = event.target.files?.[0] || null;
        if (state.previewUrl) {
          URL.revokeObjectURL(state.previewUrl);
          state.previewUrl = '';
        }
        state.file = file;
        state.position = { x: 0.5, y: 0.5, zoom: 1 };
        state.imageSize = file ? await loadImageSize(file) : null;
        if (file) {
          state.previewUrl = fileToPreviewUrl(file);
        }
        reflowTextBoxes(boxId);
        renderCustomCanvas();
      });
    });

    customCanvas.querySelectorAll('[data-custom-resize]').forEach((handle) => {
      let dragState = null;

      handle.addEventListener('pointerdown', (event) => {
        const itemId = handle.dataset.customResize || '';
        const record = getCustomItemRecord(itemId);
        if (!record || !composeFrame) return;
        event.preventDefault();
        event.stopPropagation();
        selectCustomItem(itemId);
        const frameRect = composeFrame.getBoundingClientRect();
        dragState = {
          pointerId: event.pointerId,
          itemId,
          originX: record.item.x,
          originY: record.item.y,
          originWidth: record.item.width,
          originHeight: record.item.height,
          startX: event.clientX,
          startY: event.clientY,
          frameWidth: frameRect.width,
          frameHeight: frameRect.height,
          type: record.type,
        };
        handle.setPointerCapture?.(event.pointerId);
      });

      handle.addEventListener('pointermove', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        event.preventDefault();
        const record = getCustomItemRecord(dragState.itemId);
        if (!record) return;
        const minimums = getCustomItemMinimums(dragState.type);
        const previousRect = {
          x: record.item.x,
          y: record.item.y,
          width: record.item.width,
          height: record.item.height,
        };
        record.item.width = dragState.originWidth + ((event.clientX - dragState.startX) / dragState.frameWidth);
        record.item.height = dragState.originHeight + ((event.clientY - dragState.startY) / dragState.frameHeight);
        Object.assign(record.item, clampCustomBoxRect(record.item, minimums));
        const safetyOptions = record.type === 'image' ? { ignoreText: true } : {};
        Object.assign(record.item, findNearestSafeBoxPosition(record.item, record.item.id, minimums, safetyOptions));
        if (!isSafeCustomPosition(record.item, record.item.id, safetyOptions)) {
          Object.assign(record.item, previousRect);
        }
        if (record.type === 'image') {
          reflowTextBoxes(record.item.id);
        }
        renderCustomInspector();
        applyAllCustomItemRects();
      });

      const finishDrag = (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        dragState = null;
        handle.releasePointerCapture?.(event.pointerId);
      };

      handle.addEventListener('pointerup', finishDrag);
      handle.addEventListener('pointercancel', finishDrag);
    });

    window.requestAnimationFrame(() => {
      customLayoutState.textBoxes.forEach((box) => {
        fitCustomTextBoxToContent(box.id);
      });
    });
  }

  function applyFixedTemplateLayout(templateId) {
    const layout = getFixedTemplateLayout(templateId);
    if (!layout) return;

    const visibleFields = new Set(layout.texts.map((block) => block.fieldKey));

    Object.values(slotKeyMap).forEach((slot) => {
      if (!slot) return;
      slot.style.display = 'none';
      slot.style.pointerEvents = 'none';
      slot.style.zIndex = '';
      slot.style.left = '';
      slot.style.top = '';
      slot.style.right = 'auto';
      slot.style.bottom = 'auto';
      slot.style.width = '';
      slot.style.height = '';
      slot.style.aspectRatio = 'auto';
      const surface = slot.querySelector('.compose-slot__surface');
      if (surface) {
        surface.style.borderRadius = '0';
        surface.style.pointerEvents = 'auto';
      }
      const removeButton = slot.querySelector('.compose-slot__remove');
      if (removeButton) {
        removeButton.style.zIndex = '';
      }
    });

    layout.images.forEach((slot, index) => {
      const element = slotKeyMap[slot.key];
      if (!element) return;
      element.style.display = 'block';
      element.style.pointerEvents = 'auto';
      element.style.zIndex = String(20 + index);
      element.style.left = `${slot.x * 100}%`;
      element.style.top = `${slot.y * 100}%`;
      element.style.width = `${slot.width * 100}%`;
      element.style.height = `${slot.height * 100}%`;
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      const surface = element.querySelector('.compose-slot__surface');
      if (surface) {
        surface.style.borderRadius = slot.shape === 'arch-right'
          ? '0 999px 999px 0 / 0 50% 50% 0'
          : '0';
        surface.style.pointerEvents = 'auto';
      }
      const removeButton = element.querySelector('.compose-slot__remove');
      if (removeButton) {
        removeButton.style.zIndex = String(40 + index);
      }
    });

    Object.entries(editableKeyMap).forEach(([fieldKey, element]) => {
      if (!element) return;
      element.style.display = 'none';
      element.style.pointerEvents = 'none';
      element.style.zIndex = '';
      element.style.left = '';
      element.style.top = '';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.width = '';
      element.style.height = '';
      element.style.maxHeight = '';
      element.style.minHeight = '';
      element.style.overflow = '';
      element.style.fontSize = '';
      element.style.lineHeight = '';
      element.style.textAlign = '';
      element.style.whiteSpace = '';
      element.removeAttribute('data-compose-exclusion-side');
      element.style.removeProperty('--compose-exclusion-top');
      element.style.removeProperty('--compose-exclusion-width');
      element.style.removeProperty('--compose-exclusion-height');
      element.style.removeProperty('--compose-exclusion-bottom');
      element.style.removeProperty('--compose-fixed-line-height');
      element.style.removeProperty('--compose-fixed-block-height');
      element.classList.remove('compose-editable--page7-lines');
      delete element.dataset.page7RawText;
      element.dataset.singleLine = element.dataset.defaultSingleLine || 'false';
      delete element.dataset.composeBaseFontSize;
      delete element.dataset.composeBaseLineHeight;
      if (!visibleFields.has(fieldKey) && activeFixedTextKey === fieldKey) {
        activeFixedTextKey = null;
      }
    });

    layout.texts.forEach((block, index) => {
      const element = editableKeyMap[block.fieldKey];
      if (!element) return;
      const metrics = getFixedTemplateTextMetrics(block.fieldKey, block);
      element.style.display = 'block';
      element.style.pointerEvents = 'auto';
      element.setAttribute('contenteditable', composeStage === 'edit' ? 'true' : 'false');
      element.style.zIndex = String(60 + index);
      element.style.left = `${block.x * 100}%`;
      element.style.top = `${block.y * 100}%`;
      element.style.width = `${block.width * 100}%`;
      element.style.height = `${block.height * 100}%`;
      element.style.maxHeight = `${block.height * 100}%`;
      element.style.minHeight = '0';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
      element.style.overflow = 'hidden';
      element.style.fontSize = `${Math.round(metrics.fontSize)}px`;
      element.style.lineHeight = `${Math.round(metrics.lineHeight)}px`;
      element.style.textAlign = block.align || 'left';
      element.style.whiteSpace = metrics.maxLines > 1 ? 'pre-wrap' : 'nowrap';
      element.dataset.singleLine = block.singleLine === true
        ? 'true'
        : block.singleLine === false
          ? 'false'
          : metrics.maxLines <= 1
            ? 'true'
            : 'false';
      const exclusion = block.exclusions?.[0];
      if (templateId === 'page7' && (block.fieldKey === 'headline' || block.fieldKey === 'body')) {
        element.classList.add('compose-editable--page7-lines');
        element.removeAttribute('data-compose-exclusion-side');
        element.style.removeProperty('--compose-exclusion-top');
        element.style.removeProperty('--compose-exclusion-width');
        element.style.removeProperty('--compose-exclusion-height');
        element.style.removeProperty('--compose-exclusion-bottom');
        element.dataset.page7RawText = normalizeEditableValue(element, element.dataset.page7RawText || element.innerText).replace(/\n+/g, '');
        renderPage7Lines(element, element.dataset.page7RawText);
      } else {
        element.classList.remove('compose-editable--page7-lines');
        delete element.dataset.page7RawText;
      }
      if (exclusion && !isPage7ConstrainedEditable(element)) {
        element.dataset.composeExclusionSide = exclusion.side;
        const blockPixelHeight = element.getBoundingClientRect().height || (block.height * composeSheet.getBoundingClientRect().height);
        const threeLinePercent = blockPixelHeight > 0
          ? Math.min(100, (metrics.lineHeight * 3 / blockPixelHeight) * 100)
          : 0;
        const defaultTop = (exclusion.offsetTop / block.height) * 100;
        const defaultBottom = ((exclusion.offsetTop + exclusion.height) / block.height) * 100;
        const isPage7 = templateId === 'page7';
        const exclusionTop = isPage7 && block.fieldKey === 'headline'
          ? Math.max(0, 100 - threeLinePercent)
          : defaultTop;
        const exclusionBottom = isPage7 && block.fieldKey === 'body'
          ? Math.min(100, threeLinePercent)
          : defaultBottom;
        const exclusionWidth = isPage7
          ? Math.min(100, (exclusion.width / block.width) * 100 + 6)
          : (exclusion.width / block.width) * 100;
        element.style.setProperty('--compose-fixed-line-height', `${Math.round(metrics.lineHeight)}px`);
        element.style.setProperty('--compose-fixed-block-height', `${blockPixelHeight}px`);
        element.style.setProperty('--compose-exclusion-top', `${exclusionTop}%`);
        element.style.setProperty('--compose-exclusion-width', `${exclusionWidth}%`);
        element.style.setProperty('--compose-exclusion-height', `${(exclusion.height / block.height) * 100}%`);
        element.style.setProperty('--compose-exclusion-bottom', `${exclusionBottom}%`);
      }
    });

    if (roughOverlay) {
      roughOverlay.style.backgroundImage = layout.roughUrl ? `url("${layout.roughUrl}")` : '';
      roughOverlay.hidden = composeStage !== 'edit';
    }

    shapeMasks.forEach((maskElement, index) => {
      const mask = layout.masks[index];
      if (!mask) {
        maskElement.hidden = true;
        maskElement.style.left = '';
        maskElement.style.top = '';
        maskElement.style.width = '';
        maskElement.style.height = '';
        return;
      }
      maskElement.hidden = false;
      maskElement.style.left = `${mask.rect.x * 100}%`;
      maskElement.style.top = `${mask.rect.y * 100}%`;
      maskElement.style.width = `${mask.rect.width * 100}%`;
      maskElement.style.height = `${mask.rect.height * 100}%`;
      maskElement.style.borderRadius = mask.type === 'ellipse-cutout' ? '50%' : '0';
    });

    if (!visibleFields.has(activeFixedTextKey)) {
      closeComposeTextTray();
    } else {
      syncComposeTextTargetState();
      syncComposeTextTray();
    }

    applyComposeTextStyles();
    Object.values(editableKeyMap).forEach((element) => {
      if (!element || element.style.display === 'none') return;
      clampEditable(element);
    });
  }

  function applyCustomLayout() {
    if (!composeSheet || !composeFrame) return;
    const isCustomTemplate = composeSheet.dataset.template === 'page8';

    Object.values(slotKeyMap).forEach((slot) => {
      if (!slot) return;
      slot.style.left = '';
      slot.style.top = '';
      slot.style.width = '';
      slot.style.height = '';
    });

    Object.entries(editableKeyMap).forEach(([key, element]) => {
      if (!element) return;
      element.style.left = '';
      element.style.top = '';
      element.style.width = '';
      element.style.height = '';
      element.style.fontSize = '';
      element.style.lineHeight = '';
      element.style.textAlign = '';
      if (key === 'editor') {
        element.style.right = '';
      }
      if (key === 'body') {
        element.style.bottom = '';
      }
      if (key === 'date') {
        element.style.bottom = '';
      }
    });

    if (customTemplateControls) {
      customTemplateControls.hidden = !isCustomTemplate || composeStage !== 'edit';
    }

    if (!isCustomTemplate) {
      if (customCanvas) {
        customCanvas.hidden = true;
        customCanvas.innerHTML = '';
      }
      applyFixedTemplateLayout(composeSheet.dataset.template);
      return;
    }

    customLayoutState.imageBoxes = normalizePage8ImageBoxes({
      imageBoxes: customLayoutState.imageBoxes,
    });
    customLayoutState.textBoxes = normalizePage8TextBoxes({
      textBoxes: customLayoutState.textBoxes,
    }, page8DraftValues);
    renderCustomCanvas();
  }

  composeRoot.querySelectorAll('input[name="backgroundColor"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      setPreviewBackground();
      focusSelectedColorCard(radio.value);
    });
  });
  setPreviewBackground();
  window.setTimeout(() => {
    focusSelectedColorCard(composeRoot.querySelector('input[name="backgroundColor"]:checked')?.value);
  }, 0);

  composeRoot.querySelectorAll('input[name="templateId"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      setPreviewTemplate(radio.value);
      focusSelectedTemplateCard(radio.value);
    });
  });
  composeRoot.querySelectorAll('[data-compose-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextMode = button.dataset.composeMode === 'custom' ? 'custom' : 'template';
      if (nextMode === 'custom') {
        setPreviewTemplate('page8');
        return;
      }
      const fallbackTemplate = uiState.composeTemplateId && uiState.composeTemplateId !== 'page8'
        ? uiState.composeTemplateId
        : DEFAULT_COMPOSE_TEMPLATE;
      const fallbackRadio = composeRoot.querySelector(`input[name="templateId"][value="${fallbackTemplate}"]`)
        || composeRoot.querySelector('input[name="templateId"]');
      if (fallbackRadio) {
        fallbackRadio.checked = true;
      }
      setPreviewTemplate(fallbackRadio?.value || fallbackTemplate);
      focusSelectedTemplateCard(fallbackRadio?.value || fallbackTemplate);
    });
  });
  setPreviewTemplate(uiState.composeTemplateId || composeRoot.querySelector('input[name="templateId"]:checked')?.value);
  window.setTimeout(() => {
    focusSelectedTemplateCard(uiState.composeTemplateId || composeRoot.querySelector('input[name="templateId"]:checked')?.value);
  }, 0);

  document.querySelectorAll('[data-template-carousel-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      const viewport = document.querySelector('[data-template-carousel]');
      if (!viewport) return;
      const direction = button.dataset.templateCarouselNav === 'next' ? 1 : -1;
      viewport.scrollBy({
        left: viewport.clientWidth * 0.72 * direction,
        behavior: 'smooth',
      });
    });
  });

  document.querySelectorAll('[data-color-carousel-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      const viewport = document.querySelector('[data-color-carousel]');
      if (!viewport) return;
      const direction = button.dataset.colorCarouselNav === 'next' ? 1 : -1;
      viewport.scrollBy({
        left: viewport.clientWidth * 0.72 * direction,
        behavior: 'smooth',
      });
    });
  });

  document.querySelectorAll('[data-compose-stage-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextStage = button.dataset.composeStageNav;
      if (!nextStage) return;
      switchComposeStage(nextStage);
    });
  });

  if (composeStage === 'select') {
    return;
  }

  if (!form) return;

  if (tagToggle && tagPanel) {
    tagToggle.addEventListener('click', () => {
      const nextHidden = !tagPanel.hidden;
      tagPanel.hidden = nextHidden;
      tagToggle.setAttribute('aria-expanded', String(!nextHidden));
    });
  }

  if (previewToggle) {
    previewToggle.addEventListener('click', () => {
      const enabled = !composePage?.classList.contains('is-preview-mode');
      setPreviewMode(Boolean(enabled));
    });
  }

  setPreviewMode(false);
  applyComposeTextStyles();

  if (textTray) {
    textTray.hidden = false;
    applyComposeTextTrayLevel(0, { animate: false });

    textTray.querySelector('[data-compose-text-tray-close]')?.addEventListener('click', () => {
      if (textTrayJustDragged) {
        textTrayJustDragged = false;
        return;
      }
      applyComposeTextTrayLevel(textTrayOpenLevel === 0 ? 100 : 0);
      if (textTrayOpenLevel > 0) {
        restoreActiveComposeTextFocus();
      }
    });

    textTrayLevelButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const nextLevel = Number(button.dataset.composeTextTrayLevel || 100);
        applyComposeTextTrayLevel(nextLevel);
        if (nextLevel > 0) {
          restoreActiveComposeTextFocus();
        }
      });
    });

    textTrayFontButtons.forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
      });
      button.addEventListener('click', () => {
        updateComposeTextStyle({ family: button.dataset.composeTextFont || null });
        restoreActiveComposeTextFocus();
      });
    });

    textTraySizeInput?.addEventListener('input', (event) => {
      updateComposeTextStyle({ scale: Number(event.target.value || 50) / 50 });
    });
    textTraySizeStepButtons.forEach((button) => {
      button.addEventListener('click', () => {
        if (!activeFixedTextKey) return;
        const currentPercent = Math.round(getComposeTextStyleValue(activeFixedTextKey).scale * 50);
        const delta = button.dataset.composeTextSizeStep === 'up' ? 5 : -5;
        const nextPercent = Math.max(50, Math.min(200, currentPercent + delta));
        updateComposeTextStyle({ scale: nextPercent / 50 });
      });
    });

    textTrayChrome?.addEventListener('pointerdown', (event) => {
      if (event.target.closest('[data-compose-text-tray-level]')) return;
      textTrayDragState = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startLevel: textTrayOpenLevel,
        moved: false,
      };
      textTrayJustDragged = false;
      textTray.style.transition = 'none';
      textTrayChrome.setPointerCapture?.(event.pointerId);
    });

    textTrayChrome?.addEventListener('pointermove', (event) => {
      if (!textTrayDragState || textTrayDragState.pointerId !== event.pointerId) return;
      const { bodyHeight } = getComposeTextTrayHeights();
      if (!bodyHeight) return;
      const deltaY = event.clientY - textTrayDragState.startY;
      if (!textTrayDragState.moved && Math.abs(deltaY) >= 4) {
        textTrayDragState.moved = true;
      }
      const levelDelta = (deltaY / bodyHeight) * 100;
      applyComposeTextTrayLevel(textTrayDragState.startLevel - levelDelta, { animate: false });
    });

    const finishTextTrayDrag = (event) => {
      if (!textTrayDragState || textTrayDragState.pointerId !== event.pointerId) return;
      textTrayJustDragged = textTrayDragState.moved;
      textTrayDragState = null;
      textTrayChrome?.releasePointerCapture?.(event.pointerId);
      applyComposeTextTrayLevel(snapComposeTextTrayLevel(textTrayOpenLevel));
    };

    textTrayChrome?.addEventListener('pointerup', finishTextTrayDrag);
    textTrayChrome?.addEventListener('pointercancel', finishTextTrayDrag);
  }

  editables.forEach((element) => {
    const fieldKey = element.dataset.editable;
    if (!fieldKey) return;
    element.addEventListener('pointerdown', () => {
      if (element.getAttribute('contenteditable') !== 'true') return;
      window.setTimeout(() => {
        element.focus();
        openComposeTextTray(fieldKey);
      }, 0);
    });
    element.addEventListener('focus', () => {
      openComposeTextTray(fieldKey);
    });
    element.addEventListener('pointerup', () => {
      openComposeTextTray(fieldKey);
    });
  });

  composePreview?.addEventListener('pointerdown', (event) => {
    if (event.target.closest('[data-editable]')) return;
    if (event.target.closest('[data-compose-text-tray]')) return;
    minimizeComposeTextTray();
  });

  const pretextAddToggle = document.querySelector('[data-pretext-add-toggle]');
  const pretextAddPopover = document.querySelector('[data-pretext-add-popover]');
  const pretextDeleteButton = document.querySelector('[data-pretext-delete]');

  function closePretextAddPopover() {
    if (!pretextAddToggle || !pretextAddPopover) return;
    pretextAddPopover.hidden = true;
    pretextAddToggle.setAttribute('aria-expanded', 'false');
  }

  function openPretextAddPopover() {
    if (!pretextAddToggle || !pretextAddPopover) return;
    pretextAddPopover.hidden = false;
    pretextAddToggle.setAttribute('aria-expanded', 'true');
  }

  if (pretextComposeHost) {
    let pretextCommandId = 0;

    pretextAddToggle?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (!pretextAddPopover) return;
      if (pretextAddPopover.hidden) {
        openPretextAddPopover();
      } else {
        closePretextAddPopover();
      }
    });

    pretextAddPopover?.querySelectorAll('[data-pretext-add-kind]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const kind = button.dataset.pretextAddKind;
        if (!kind) return;
        pretextCommandId += 1;
        activeComposeBridge?.sendCommand?.({
          id: pretextCommandId,
          type: 'add',
          kind,
          align: button.dataset.pretextAddAlign || 'left',
        });
        closePretextAddPopover();
      });
    });

    pretextDeleteButton?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      pretextCommandId += 1;
      activeComposeBridge?.sendCommand?.({
        id: pretextCommandId,
        type: 'delete-selected',
      });
      closePretextAddPopover();
    });

    composeRoot.addEventListener('pointerdown', (event) => {
      if (!pretextAddPopover || pretextAddPopover.hidden) return;
      if (pretextAddToggle?.contains(event.target) || pretextAddPopover.contains(event.target)) return;
      closePretextAddPopover();
    });

    import('../../src/pretextComposeBridge.jsx')
      .then(({ mountComposePretextEditor }) => {
        if (!pretextComposeHost.isConnected) return;
        activeComposeBridge = mountComposePretextEditor(pretextComposeHost, {
          customLayout: composeDraft?.customLayout || {},
          textValues: page8DraftValues,
          backgroundColor: uiState.composeBackgroundColor || composeDraft?.backgroundColor || '#f8f4ee',
        });
      })
      .catch((error) => {
        console.error('Failed to mount pretext compose editor', error);
        pretextComposeHost.innerHTML = '<p class="compose-pretext-host__error">Failed to load the editor.</p>';
      });
    return;
  }

  const textAddButton = composeRoot.querySelector('[data-custom-add="text"]');
  let textAddWrapper = textAddButton?.closest('[data-custom-add-pop]') || null;
  let textAddPopover = textAddWrapper?.querySelector('[data-custom-add-popover]') || null;

  if (textAddButton && !textAddWrapper) {
    textAddWrapper = document.createElement('div');
    textAddWrapper.className = 'compose-custom-add-pop';
    textAddButton.parentElement?.insertBefore(textAddWrapper, textAddButton);
    textAddWrapper.appendChild(textAddButton);
  }

  if (textAddButton && textAddWrapper && !textAddPopover) {
    textAddWrapper.insertAdjacentHTML('afterbegin', `
      <div class="compose-custom-add-popover" data-custom-add-popover hidden>
        <button class="compose-custom-add-popover__option" type="button" data-custom-add-text-align="left" aria-label="Add left aligned text box">
          ${getIcon('alignLeft')}
        </button>
        <button class="compose-custom-add-popover__option" type="button" data-custom-add-text-align="center" aria-label="Add centered text box">
          ${getIcon('alignCenter')}
        </button>
        <button class="compose-custom-add-popover__option" type="button" data-custom-add-text-align="right" aria-label="Add right aligned text box">
          ${getIcon('alignRight')}
        </button>
      </div>
    `);
    textAddPopover = textAddWrapper.querySelector('[data-custom-add-popover]');
    textAddButton.setAttribute('aria-haspopup', 'true');
    textAddButton.setAttribute('aria-expanded', 'false');
  }

  function closeTextAddPopover() {
    if (!textAddPopover || !textAddButton) return;
    textAddPopover.hidden = true;
    textAddWrapper?.classList.remove('is-open');
    textAddButton.setAttribute('aria-expanded', 'false');
  }

  function openTextAddPopover() {
    if (!textAddPopover || !textAddButton) return;
    textAddPopover.hidden = false;
    textAddWrapper?.classList.add('is-open');
    textAddButton.setAttribute('aria-expanded', 'true');
  }

  composeRoot.querySelectorAll('[data-custom-add]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const action = button.dataset.customAdd;
      if (composeSheet?.dataset.template !== 'page8') return;
      if (action === 'image') {
        closeTextAddPopover();
        const nextImage = {
          id: createCustomId('image'),
          x: 0.14,
          y: 0.18,
          width: 0.28,
          height: 0.22,
        };
        customLayoutState.imageBoxes = [
          ...customLayoutState.imageBoxes,
          clampCustomBoxRect(nextImage, PAGE8_MIN_IMAGE_SIZE),
        ];
        customLayoutState.selectedId = nextImage.id;
        getCustomImageState(nextImage.id);
        reflowTextBoxes(nextImage.id);
        renderCustomCanvas();
        return;
      }

      if (!textAddPopover) return;
      if (textAddPopover.hidden) {
        openTextAddPopover();
      } else {
        closeTextAddPopover();
      }
    });
  });

  textAddPopover?.querySelectorAll('[data-custom-add-text-align]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      if (composeSheet?.dataset.template !== 'page8') return;
      createCustomTextBox(button.dataset.customAddTextAlign || 'left');
      closeTextAddPopover();
    });
  });

  composeRoot.addEventListener('pointerdown', (event) => {
    if (!textAddPopover || textAddPopover.hidden) return;
    if (textAddWrapper?.contains(event.target)) return;
    closeTextAddPopover();
  });

  [
    { inputId: 'imageInputPrimary', stateKey: 'primary' },
    { inputId: 'imageInputSecondary', stateKey: 'secondary' },
    { inputId: 'imageInputAccent', stateKey: 'accent' },
    { inputId: 'imageInputDetail', stateKey: 'detail' },
  ].forEach(({ inputId, stateKey }) => {
    const slot = document.querySelector(`[data-slot="${inputId}"]`);
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('change', async (event) => {
        const file = event.target.files?.[0] || null;
        selectedFiles[stateKey].file = file ? await fileToWebpDataUrl(file, { maxWidth: 1600, quality: 0.9 }) : null;
        selectedFiles[stateKey].position = { x: 0.5, y: 0.5 };
        selectedFiles[stateKey].imageSize = file ? await loadImageSize(file) : null;
        previewUrls[inputId] = selectedFiles[stateKey].file || '';
        setPreviewImage(inputId);
        updateSlotPosition(inputId);
        persistComposeDraft({ standardFiles: serializeStandardFiles() });
      });

      const removeButton = document.querySelector(`[data-slot-remove="${inputId}"]`);
      if (removeButton) {
        removeButton.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          previewUrls[inputId] = '';
          selectedFiles[stateKey] = { file: null, position: { x: 0.5, y: 0.5 }, imageSize: null };
          input.value = '';
          setPreviewImage(inputId);
          persistComposeDraft({ standardFiles: serializeStandardFiles() });
        });
      }
    }

    if (slot) {
      let dragState = null;

      slot.addEventListener('pointerdown', (event) => {
        if (composePage?.classList.contains('is-preview-mode')) return;
        if (composeSheet?.dataset.template === 'page8') {
          const boxState = customLayoutState.imageBoxes[stateKey];
          if (!boxState || !composeFrame) return;
          event.preventDefault();
          event.stopPropagation();
          const frameRect = composeFrame.getBoundingClientRect();
          dragState = {
            pointerId: event.pointerId,
            mode: 'move-box',
            startX: event.clientX,
            startY: event.clientY,
            originX: boxState.x,
            originY: boxState.y,
            frameWidth: frameRect.width,
            frameHeight: frameRect.height,
          };
          slot.classList.add('is-dragging');
          slot.setPointerCapture?.(event.pointerId);
          return;
        }
        if (!selectedFiles[stateKey].file) return;
        event.preventDefault();
        event.stopPropagation();
        dragState = {
          pointerId: event.pointerId,
          mode: 'pan-image',
          startX: event.clientX,
          startY: event.clientY,
          originX: selectedFiles[stateKey].position.x,
          originY: selectedFiles[stateKey].position.y,
        };
        slot.classList.add('is-dragging');
        slot.setPointerCapture?.(event.pointerId);
      });

      slot.addEventListener('pointermove', (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        event.preventDefault();
        if (dragState.mode === 'move-box') {
          const nextX = dragState.originX + ((event.clientX - dragState.startX) / dragState.frameWidth);
          const nextY = dragState.originY + ((event.clientY - dragState.startY) / dragState.frameHeight);
          const boxState = customLayoutState.imageBoxes[stateKey];
          boxState.x = Math.min(PAGE8_BOUNDS.x + PAGE8_BOUNDS.width - boxState.width, Math.max(PAGE8_BOUNDS.x, nextX));
          boxState.y = Math.min(PAGE8_BOUNDS.y + PAGE8_BOUNDS.height - boxState.height, Math.max(PAGE8_BOUNDS.y, nextY));
          applyCustomLayout();
          return;
        }
        const slotRect = slot.getBoundingClientRect();
        const size = selectedFiles[stateKey].imageSize;
        if (!size) return;

        const imageRatio = size.width / size.height;
        const slotRatio = slotRect.width / slotRect.height;
        const renderedWidth = imageRatio > slotRatio ? slotRect.height * imageRatio : slotRect.width;
        const renderedHeight = imageRatio > slotRatio ? slotRect.height : slotRect.width / imageRatio;
        const overflowX = Math.max(0, renderedWidth - slotRect.width);
        const overflowY = Math.max(0, renderedHeight - slotRect.height);
        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;

        selectedFiles[stateKey].position.x = overflowX ? Math.min(1, Math.max(0, dragState.originX - (deltaX / overflowX))) : 0.5;
        selectedFiles[stateKey].position.y = overflowY ? Math.min(1, Math.max(0, dragState.originY - (deltaY / overflowY))) : 0.5;
        updateSlotPosition(inputId);
        persistComposeDraft({ standardFiles: serializeStandardFiles() });
      });

      const finishDrag = (event) => {
        if (!dragState || dragState.pointerId !== event.pointerId) return;
        dragState = null;
        slot.classList.remove('is-dragging');
        slot.releasePointerCapture?.(event.pointerId);
      };

      slot.addEventListener('pointerup', finishDrag);
      slot.addEventListener('pointercancel', finishDrag);
    }

    setPreviewImage(inputId);
    updateSlotPosition(inputId);
  });

  applyCustomLayout();

  editables.forEach((element) => {
    element.dataset.previousValue = getEditableText(element);

    element.addEventListener('beforeinput', (event) => {
      if (element.dataset.singleLine === 'true' && (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak')) {
        event.preventDefault();
      }
    });

    element.addEventListener('paste', (event) => {
      event.preventDefault();
      const pastedText = event.clipboardData?.getData('text/plain')?.replace(/\r/g, '') ?? '';
      const normalizedText = element.dataset.singleLine === 'true'
        ? pastedText.replace(/\n+/g, ' ')
        : pastedText;
      if (!normalizedText) return;
      insertPlainText(element, normalizedText);
      clampEditable(element);
      placeCaretAtEnd(element);
    });

    element.addEventListener('input', () => {
      const rawValue = getEditableText(element);
      clampEditable(element);
      if (isPage7ConstrainedEditable(element) || getEditableText(element) !== rawValue) {
        placeCaretAtEnd(element);
      }
    });

    element.addEventListener('blur', () => {
      normalizeEditableContent(element);
      clampEditable(element);
    });
  });

  function saveDraftAndOpenProfile(snapshot) {
    const draftSnapshot = snapshot || buildComposeDraftSnapshot();
    const savedDraft = upsertDraft({
      id: uiState.composeDraftId || undefined,
      title: buildComposeCaption(draftSnapshot) || draftSnapshot.headline || 'Untitled',
      composeData: createComposeWorkingDraft(draftSnapshot),
    });
    uiState.composeDraftId = savedDraft.id;
    uiState.composeReturnState = null;
    uiState.composeWorkingDraft = null;
    uiState.composeEditingPostId = null;
    uiState.screen = 'profile';
    uiState.profileAuthor = null;
    uiState.profileSection = 'drafts';
    uiState.profileFindQuery = '';
    uiState.profileFindTags = [];
    uiState.profileFindMonth = '';
    render();
  }

  document.querySelectorAll('[data-save-compose-draft]').forEach((button) => {
    button.addEventListener('click', () => {
      saveDraftAndOpenProfile();
    });
  });

  document.querySelectorAll('[data-save-compose-image]').forEach((button) => {
    button.addEventListener('click', async () => {
      const draftSnapshot = buildComposeDraftSnapshot();
      const values = {
        templateId: draftSnapshot.templateId,
        backgroundColor: draftSnapshot.backgroundColor,
        text: draftSnapshot.text,
        headline: draftSnapshot.headline,
        subhead: draftSnapshot.subhead,
        intro: draftSnapshot.intro,
        body: draftSnapshot.body,
        date: draftSnapshot.date,
        editor: draftSnapshot.editor,
        textStyles: draftSnapshot.textStyles,
        customLayout: draftSnapshot.customLayout,
      };
      const imageData = await renderComposeTemplate(values, draftSnapshot.standardFiles, {});
      if (!imageData) return;
      const link = document.createElement('a');
      const stamp = new Date().toISOString().slice(0, 10).replaceAll('-', '');
      link.href = imageData;
      link.download = `burn-page-${stamp}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  });

  if (composeStage !== 'tags') {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const draftSnapshot = buildComposeDraftSnapshot();
    const values = {
      templateId: draftSnapshot.templateId,
      backgroundColor: draftSnapshot.backgroundColor,
      text: draftSnapshot.text,
      headline: draftSnapshot.headline,
      subhead: draftSnapshot.subhead,
      intro: draftSnapshot.intro,
      body: draftSnapshot.body,
      date: draftSnapshot.date,
      editor: draftSnapshot.editor,
      textStyles: draftSnapshot.textStyles,
      customLayout: draftSnapshot.customLayout,
    };
    const imageData = await renderComposeTemplate(values, draftSnapshot.standardFiles, {});
    const profileName = String(getState().profile?.name || 'you').trim() || 'you';

    if (uiState.composeEditingPostId) {
      updatePost(uiState.composeEditingPostId, {
        caption: buildComposeCaption(values),
        imageData,
        fixedTags: draftSnapshot.fixedTags,
        freeTags: draftSnapshot.freeTags,
        composeData: {
          ...values,
          fixedTags: draftSnapshot.fixedTags,
          freeTags: draftSnapshot.freeTags,
          standardFiles: draftSnapshot.standardFiles,
        },
      });
    } else {
      addPost({
        authorName: profileName,
        caption: buildComposeCaption(values),
        imageData,
        fixedTags: draftSnapshot.fixedTags,
        freeTags: draftSnapshot.freeTags,
        composeData: {
          ...values,
          fixedTags: draftSnapshot.fixedTags,
          freeTags: draftSnapshot.freeTags,
          standardFiles: draftSnapshot.standardFiles,
        },
      });
    }

    if (uiState.composeDraftId) {
      deleteDraft(uiState.composeDraftId);
      uiState.composeDraftId = null;
    }

    uiState.screen = 'timeline';
    uiState.timelineTab = 'recommended';
    uiState.composeStage = 'select';
    uiState.composeWorkingDraft = null;
    render();
  });
}

function bindMagazineEvents() {
  const form = document.getElementById('issueForm');
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const postIds = formData.getAll('issuePostIds').map((id) => String(id));
    if (!postIds.length) return;

    saveIssue({
      title: String(formData.get('title')).trim(),
      subtitle: String(formData.get('subtitle') || '').trim(),
      tone: String(formData.get('tone') || 'soft'),
      postIds,
    });

    renderScreen();
  });
}

function bindProfileEvents() {
  bindPostInteractions(document.getElementById('screenArea'));

  function loadImageSize(file) {
    return new Promise((resolve) => {
      const image = new Image();
      const url = URL.createObjectURL(file);
      image.onload = () => {
        resolve({ width: image.naturalWidth, height: image.naturalHeight });
        URL.revokeObjectURL(url);
      };
      image.onerror = () => {
        resolve(null);
        URL.revokeObjectURL(url);
      };
      image.src = url;
    });
  }

  document.querySelectorAll('[data-profile-avatar-upload]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      uiState.profileExpanded = true;
      uiState.profileSection = 'edit';
      renderScreen();
      window.setTimeout(() => {
        document.getElementById('profileAvatarInput')?.click();
      }, 0);
    });
  });

  document.querySelectorAll('[data-profile-open-edit]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.profileSection = 'edit';
      renderScreen();
    });
  });

  document.querySelectorAll('[data-profile-section]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.profileSection = button.dataset.profileSection;
      renderScreen();
    });
  });

  document.querySelectorAll('[data-profile-library-tab], [data-profile-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextTab = button.dataset.profileTab || button.dataset.profileLibraryTab || 'pages';
      uiState.profileSection = nextTab;
      renderScreen();
    });
  });

  document.querySelectorAll('[data-profile-find-tag]').forEach((button) => {
    button.addEventListener('click', () => {
      const tag = button.dataset.profileFindTag;
      uiState.profileFindTags = uiState.profileFindTags.includes(tag)
        ? uiState.profileFindTags.filter((item) => item !== tag)
        : [...uiState.profileFindTags, tag];
      renderScreen();
    });
  });

  document.querySelectorAll('[data-profile-find-month]').forEach((button) => {
    button.addEventListener('click', () => {
      const month = button.dataset.profileFindMonth || '';
      uiState.profileFindMonth = uiState.profileFindMonth === month ? '' : month;
      renderScreen();
    });
  });

  document.querySelectorAll('[data-profile-find-clear]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.profileFindQuery = '';
      uiState.profileFindTags = [];
      uiState.profileFindMonth = '';
      renderScreen();
    });
  });

  const profileFindInput = document.getElementById('profileFindInput');
  if (profileFindInput) {
    profileFindInput.addEventListener('input', (event) => {
      uiState.profileFindQuery = event.target.value;
      const cursor = event.target.selectionStart;
      renderScreen();
      const nextInput = document.getElementById('profileFindInput');
      if (nextInput) {
        nextInput.focus();
        nextInput.setSelectionRange(cursor, cursor);
      }
    });
  }

  document.querySelectorAll('[data-open-draft]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      openComposeDraft(button.dataset.openDraft);
    });
  });

  document.querySelectorAll('[data-toggle-draft-menu]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const targetId = button.dataset.toggleDraftMenu;
      document.querySelectorAll('[data-draft-actions]').forEach((menu) => {
        const shouldOpen = menu.dataset.draftActions === targetId && menu.hidden;
        menu.hidden = !shouldOpen;
        if (menu.dataset.draftActions === targetId) {
          button.setAttribute('aria-expanded', String(shouldOpen));
        }
      });
    });
  });

  document.querySelectorAll('[data-publish-draft]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.stopPropagation();
      button.disabled = true;
      await publishComposeDraft(button.dataset.publishDraft);
    });
  });

  document.querySelectorAll('[data-delete-draft]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      deleteDraft(button.dataset.deleteDraft);
      renderScreen();
    });
  });

  const avatarInput = document.getElementById('profileAvatarInput');
  const cropper = document.getElementById('avatarCropper');
  const cropSurface = document.getElementById('avatarCropSurface');
  const cropImage = document.getElementById('avatarCropImage');

  function syncCropPreview() {
    if (!cropper || !cropImage) return;
    if (!profileAvatarDraft.file || !profileAvatarDraft.previewUrl) {
      cropper.hidden = true;
      cropImage.removeAttribute('src');
      return;
    }

    cropper.hidden = false;
    cropImage.src = profileAvatarDraft.previewUrl;
    cropImage.style.objectPosition = `${profileAvatarDraft.crop.x * 100}% ${profileAvatarDraft.crop.y * 100}%`;
    cropImage.style.transform = `scale(${profileAvatarDraft.crop.zoom})`;
  }

  if (avatarInput) {
    avatarInput.addEventListener('change', async (event) => {
      const file = event.target.files?.[0] || null;
      if (profileAvatarDraft.previewUrl) {
        URL.revokeObjectURL(profileAvatarDraft.previewUrl);
        profileAvatarDraft.previewUrl = '';
      }
      profileAvatarDraft.file = file;
      profileAvatarDraft.imageSize = file ? await loadImageSize(file) : null;
      profileAvatarDraft.crop = { x: 0.5, y: 0.5, zoom: 1 };
      if (file) {
        profileAvatarDraft.previewUrl = fileToPreviewUrl(file);
      }
      uiState.profileAvatarCropOpen = Boolean(file);
      renderScreen();
    });
  }

  if (cropSurface) {
    let dragState = null;

    cropSurface.addEventListener('pointerdown', (event) => {
      if (!profileAvatarDraft.file) return;
      dragState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        originX: profileAvatarDraft.crop.x,
        originY: profileAvatarDraft.crop.y,
      };
      cropSurface.classList.add('is-dragging');
      cropSurface.setPointerCapture?.(event.pointerId);
    });

    cropSurface.addEventListener('pointermove', (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId || !profileAvatarDraft.imageSize) return;
      const rect = cropSurface.getBoundingClientRect();
      const { width, height } = profileAvatarDraft.imageSize;
      const imageRatio = width / height;
      const cropRatio = rect.width / rect.height;
      const baseRenderedWidth = imageRatio > cropRatio ? rect.height * imageRatio : rect.width;
      const baseRenderedHeight = imageRatio > cropRatio ? rect.height : rect.width / imageRatio;
      const renderedWidth = baseRenderedWidth * profileAvatarDraft.crop.zoom;
      const renderedHeight = baseRenderedHeight * profileAvatarDraft.crop.zoom;
      const overflowX = Math.max(0, renderedWidth - rect.width);
      const overflowY = Math.max(0, renderedHeight - rect.height);
      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      profileAvatarDraft.crop.x = overflowX ? Math.min(1, Math.max(0, dragState.originX - (deltaX / overflowX))) : 0.5;
      profileAvatarDraft.crop.y = overflowY ? Math.min(1, Math.max(0, dragState.originY - (deltaY / overflowY))) : 0.5;
      syncCropPreview();
    });

    const finishDrag = (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      dragState = null;
      cropSurface.classList.remove('is-dragging');
      cropSurface.releasePointerCapture?.(event.pointerId);
    };

    cropSurface.addEventListener('pointerup', finishDrag);
    cropSurface.addEventListener('pointercancel', finishDrag);
  }

  syncCropPreview();

  const form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const avatarData = profileAvatarDraft.file
        ? await cropFileToCirclePngDataUrl(profileAvatarDraft.file, profileAvatarDraft.crop, { size: 320 })
        : getState().profile.avatarData;
      updateProfile({
        name: String(formData.get('name')).trim(),
        bio: String(formData.get('bio')).trim(),
        avatarData,
      });
      resetProfileAvatarDraft();
      uiState.profileSection = 'pages';
      uiState.profileExpanded = true;
      renderScreen();
    });
  }

  document.querySelectorAll('[data-follow-author]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleFollow(button.dataset.followAuthor);
      renderScreen();
    });
  });
}

function bindPostDetailEvents() {
  bindPostInteractions(document.getElementById('screenArea'));

  document.querySelectorAll('[data-close-post-detail]').forEach((button) => {
    button.addEventListener('click', () => {
      closePostDetail();
    });
  });
}

function bindModalEvents() {
  document.querySelectorAll('[data-close-preview]').forEach((element) => {
    element.addEventListener('click', () => {
      uiState.previewPostId = null;
      renderModals();
    });
  });

  document.querySelectorAll('[data-close-comments]').forEach((element) => {
    element.addEventListener('click', () => {
      uiState.commentPostId = null;
      renderModals();
    });
  });

  document.querySelectorAll('[data-delete-post]').forEach((button) => {
    button.addEventListener('click', () => {
      const postId = button.dataset.deletePost;
      if (!postId) return;
      const post = getActivePost(postId);
      if (!isOwnPost(post)) return;
      if (!window.confirm('この投稿を削除しますか？')) return;

      deletePost(postId);
      if (uiState.previewPostId === postId) {
        uiState.previewPostId = null;
      }
      if (uiState.commentPostId === postId) {
        uiState.commentPostId = null;
      }
      if (uiState.screen === 'post') {
        closePostDetail();
        return;
      }
      renderScreen();
    });
  });

  document.querySelectorAll('[data-comment-form]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const input = form.querySelector('input[name="comment"]');
      addComment(form.dataset.commentForm, input.value);
      uiState.commentPostId = form.dataset.commentForm;
      renderModals();
      renderScreen();
    });
  });
}

function bindPageEvents() {
  bindScreenNavigationEvents();
  switch (uiState.screen) {
    case 'home':
      bindTimelineEvents();
      break;
    case 'timeline':
      bindTimelineEvents();
      break;
    case 'search':
      bindSearchEvents();
      break;
    case 'invite':
      bindInviteEvents();
      break;
    case 'compose':
      bindComposeEvents();
      break;
    case 'magazine':
      bindMagazineEvents();
      break;
    case 'profile':
      bindProfileEvents();
      break;
    case 'post':
      bindPostDetailEvents();
      break;
    default:
      break;
  }
}

export function bootLegacyApp(root = document.getElementById('app')) {
  if (!root) {
    throw new Error('bootLegacyApp requires an app root element.');
  }
  app = root;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' && !systemThemeMediaQuery) {
    systemThemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = () => {
      if (uiState.homeTheme === 'system') {
        render();
      }
    };
    if (typeof systemThemeMediaQuery.addEventListener === 'function') {
      systemThemeMediaQuery.addEventListener('change', handleSystemThemeChange);
    } else if (typeof systemThemeMediaQuery.addListener === 'function') {
      systemThemeMediaQuery.addListener(handleSystemThemeChange);
    }
  }
  render();
  return { render };
}

if (typeof window !== 'undefined' && !window.__MEMORIES_REACT_HOST__) {
  const fallbackRoot = document.getElementById('app');
  if (fallbackRoot) {
    bootLegacyApp(fallbackRoot);
  }
}
