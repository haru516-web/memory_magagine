import { renderBottomNav } from './components/bottomNav.js';
import { renderCommentsModal } from './components/modals.js';
import { getIcon } from './components/icons.js';
import { getState, addPost, updatePost, deletePost, toggleLike, toggleSave, addComment, addImpression, updateProfile, toggleFollow, saveIssue } from './core/store.js';
import { renderOpening } from './pages/opening.js';
import { renderHome, renderTimeline } from './pages/timeline.js';
import { renderSearch } from './pages/search.js';
import { renderCompose } from './pages/compose.js';
import { renderMagazine } from './pages/magazine.js';
import { renderProfile } from './pages/profile.js';
import { renderPostDetail } from './pages/postDetail.js';
import { DEFAULT_COMPOSE_TEMPLATE, getComposeTemplateById } from './templates/index.js';
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
import { cropFileToCirclePngDataUrl, fileToPreviewUrl } from './utils/image.js';

const uiState = {
  screen: 'opening',
  timelineOverlay: null,
  timelineTab: 'recommended',
  timelinePan: { x: -360, y: -220 },
  searchQuery: '',
  searchTags: [],
  homeTheme: 'light',
  homeCoreState: 'default',
  homeCoreTapTimestamps: [],
  previewPostId: null,
  commentPostId: null,
  profileEditOpen: false,
  profileAuthor: null,
  profileSection: null,
  profileLibraryTab: 'liked',
  profileExpanded: true,
  profileOrbitRotation: 0,
  profileOrbitDragSuppressUntil: 0,
  profileAvatarCropOpen: false,
  composeStage: 'select',
  composeTemplateId: DEFAULT_COMPOSE_TEMPLATE,
  composeBackgroundColor: '#f8f4ee',
  composeEditingPostId: null,
  openingTapGuardUntil: 0,
  postReturnScreen: 'timeline',
  postReturnProfileAuthor: null,
  profileReturnState: null,
  composeReturnState: null,
};

const composePreviewDefaults = {
  headline: 'text',
  subhead: 'text',
  intro: 'text',
  body: 'text',
  date: 'text',
  editor: '編集者：haru',
};

const app = document.getElementById('app');
let openingSequenceId = 0;
let homeCoreTransitionTimer = null;
const profileAvatarDraft = {
  file: null,
  previewUrl: '',
  imageSize: null,
  crop: { x: 0.5, y: 0.5, zoom: 1 },
};

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

function getPageHtml() {
  const state = getState();
  switch (uiState.screen) {
    case 'home':
      return renderHome(state, uiState);
    case 'timeline':
      return renderTimeline(state, uiState);
    case 'search':
      return renderSearch(state, uiState);
    case 'compose':
      return renderCompose({
        stage: uiState.composeStage,
        selectedTemplateId: uiState.composeTemplateId,
        selectedBackground: uiState.composeBackgroundColor,
        draft: getActivePost(uiState.composeEditingPostId)?.composeData || null,
        isEditing: Boolean(uiState.composeEditingPostId),
      });
    case 'magazine':
      return renderMagazine(state);
    case 'profile':
      return renderProfile(state, uiState);
    case 'post':
      return renderPostDetail(getActivePost(uiState.previewPostId), { canDelete: isOwnPost(getActivePost(uiState.previewPostId)) });
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
  const shellClasses = ['app-shell'];
  const screenAreaClasses = ['screen-area'];
  const themeName = uiState.homeTheme === 'dark' ? 'dark' : 'light';

  shellClasses.push(`app-shell--theme-${themeName}`);

  if (uiState.screen === 'home') {
    shellClasses.push('app-shell--home');
    screenAreaClasses.push('screen-area--home');
  } else if (uiState.screen === 'timeline') {
    shellClasses.push('app-shell--timeline');
    screenAreaClasses.push('screen-area--timeline');
  } else if (uiState.screen === 'search') {
    screenAreaClasses.push('screen-area--search');
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
  if (uiState.screen === 'opening') {
    app.innerHTML = renderOpening();
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
    uiState.composeStage = 'edit';
    uiState.composeBackgroundColor = '#f8f4ee';
    uiState.composeReturnState = null;
  }
  uiState.screen = screen;
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  if (screen === 'compose') {
    uiState.composeStage = 'edit';
    uiState.composeBackgroundColor = '#f8f4ee';
  }
  if (screen === 'profile') {
    resetProfileAvatarDraft();
    uiState.profileAuthor = null;
    uiState.profileSection = 'identity';
    uiState.profileLibraryTab = 'liked';
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
  navigate('home');
}

function openProfile(authorName) {
  resetProfileAvatarDraft();
  uiState.profileReturnState = captureViewState();
  uiState.screen = 'profile';
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  uiState.profileEditOpen = false;
  uiState.profileAuthor = authorName || null;
  uiState.profileSection = authorName ? null : 'identity';
  uiState.profileLibraryTab = 'liked';
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
  render();
}

function openPostEdit(postId) {
  const post = getActivePost(postId);
  if (!post || !isOwnPost(post)) return;
  uiState.composeReturnState = captureViewState();
  uiState.composeEditingPostId = postId;
  uiState.composeStage = 'edit';
  uiState.composeTemplateId = post.composeData?.templateId || DEFAULT_COMPOSE_TEMPLATE;
  uiState.composeBackgroundColor = post.composeData?.backgroundColor || '#f8f4ee';
  uiState.screen = 'compose';
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  render();
}

function closeCompose() {
  const snapshot = uiState.composeReturnState;
  uiState.composeReturnState = null;
  restoreViewState(snapshot, 'home');
}

function closePostDetail() {
  uiState.screen = uiState.postReturnScreen || 'timeline';
  uiState.commentPostId = null;
  uiState.profileEditOpen = false;
  uiState.profileAuthor = uiState.screen === 'profile' ? uiState.postReturnProfileAuthor : null;
  render();
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

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;
  startOpeningSequence(canvas, sequenceId, prefersReducedMotion);
}

function startOpeningSequence(canvas, sequenceId, prefersReducedMotion) {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = width;
  canvas.height = height;

  const textColor = '#171311';
  const serifFont = '"Zen Old Mincho", "Cormorant Garamond", "Times New Roman", serif';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const finalFontSize = Math.min(width * 0.29, height * 0.56, 156 * ratio);
  const finalFont = `700 ${finalFontSize}px ${serifFont}`;
  const flowDuration = prefersReducedMotion ? 1300 : 3000;
  const settleDuration = prefersReducedMotion ? 420 : 760;
  const revealDuration = prefersReducedMotion ? 320 : 620;
  const holdDuration = prefersReducedMotion ? 720 : 2100;
  const disperseDuration = prefersReducedMotion ? 1800 : 5200;
  const totalDuration = flowDuration + settleDuration + revealDuration + holdDuration + disperseDuration;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
  if (sequenceId !== openingSequenceId) return;

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

  function drawWordmarkGlyph(targetCtx, glyph, x, y, alpha = 1) {
    targetCtx.save();
    targetCtx.globalAlpha = alpha;
    targetCtx.font = finalFont;
    targetCtx.textAlign = 'left';
    targetCtx.textBaseline = 'middle';
    targetCtx.lineJoin = 'round';
    targetCtx.lineCap = 'round';
    targetCtx.lineWidth = Math.max(2.4 * ratio, finalFontSize * 0.08);
    targetCtx.strokeStyle = 'rgba(255, 250, 244, 0.92)';
    targetCtx.strokeText(glyph, x, y);

    targetCtx.shadowColor = 'rgba(120, 83, 66, 0.18)';
    targetCtx.shadowBlur = finalFontSize * 0.08;
    targetCtx.shadowOffsetY = finalFontSize * 0.03;
    targetCtx.fillStyle = textColor;
    targetCtx.fillText(glyph, x, y);
    targetCtx.restore();
  }

  function drawFinalWord(alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(wordCanvas, 0, 0);
    ctx.restore();
  }

  function drawRippleWord(alpha = 1, progress = 0) {
    const centerY = height * 0.5;
    const phase = progress * Math.PI * 0.9;
    const rippleStrength = finalFontSize * 0.018 * (1 - (progress * 0.32));
    const driftX = Math.sin(phase * 0.82) * rippleStrength * 0.55;
    const driftY = Math.cos(phase * 0.68) * rippleStrength * 0.42;
    const scale = 1 + (Math.sin(progress * Math.PI * 0.8) * 0.004);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate((width / 2) + driftX, centerY + driftY);
    ctx.scale(scale, scale);
    ctx.drawImage(wordCanvas, -width / 2, -height * 0.5);
    ctx.restore();

    ctx.save();
    const maxRadius = Math.hypot(width, height);
    const minRadius = finalFontSize * 0.42;
    ctx.lineWidth = Math.max(1 * ratio, finalFontSize * 0.008);
    for (let ring = 0; ring < 3; ring += 1) {
      const ringProgress = clamp((progress * 0.56) - (ring * 0.18), 0, 1);
      if (ringProgress <= 0 || ringProgress >= 1) continue;
      ctx.globalAlpha = ((1 - ringProgress) ** 1.4) * 0.12 * alpha;
      ctx.strokeStyle = textColor;
      ctx.beginPath();
      ctx.arc(
        width / 2,
        centerY,
        minRadius + (ringProgress * (maxRadius - minRadius)),
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  const wordCanvas = document.createElement('canvas');
  wordCanvas.width = width;
  wordCanvas.height = height;
  const wordCtx = wordCanvas.getContext('2d');
  if (!wordCtx) return;
  const logoText = ['V', 'e', 'l', 'n', 'a'];
  const logoSpacing = finalFontSize * 0.025;
  const logoPairAdjustments = [-finalFontSize * 0.05, 0, 0, 0];
  wordCtx.font = finalFont;
  const glyphWidths = logoText.map((glyph) => wordCtx.measureText(glyph).width);
  const totalWordWidth = glyphWidths.reduce((sum, glyphWidth) => sum + glyphWidth, 0)
    + (logoSpacing * (logoText.length - 1))
    + logoPairAdjustments.reduce((sum, adjustment) => sum + adjustment, 0);
  const wordStartX = (width / 2) - (totalWordWidth / 2);
  const wordCenterY = height * 0.5;
  wordCtx.fillStyle = textColor;
  wordCtx.font = finalFont;
  wordCtx.textAlign = 'left';
  wordCtx.textBaseline = 'middle';
  let logoCursorX = wordStartX;
  const logoGlyphs = logoText.map((glyph, index) => {
    const glyphWidth = glyphWidths[index];
    const targetX = logoCursorX;
    logoCursorX += glyphWidth + logoSpacing + (logoPairAdjustments[index] || 0);
    const fromLeft = index < 2;
    return {
      glyph,
      targetX,
      targetY: wordCenterY,
      startX: fromLeft
        ? -glyphWidth - (Math.random() * width * 0.16) - (index * finalFontSize * 0.18)
        : width + (Math.random() * width * 0.16) + ((logoText.length - index) * finalFontSize * 0.18),
      startY: wordCenterY + ((Math.random() - 0.5) * finalFontSize * 0.42),
      driftX: (Math.random() - 0.5) * finalFontSize * 0.12,
      driftY: (Math.random() - 0.5) * finalFontSize * 0.08,
      enterArc: (Math.random() - 0.5) * finalFontSize * 0.32,
      delay: index * 0.055,
      alpha: 0.72 + Math.random() * 0.18,
      width: glyphWidth,
    };
  });

  logoText.forEach((glyph, index) => {
    drawWordmarkGlyph(wordCtx, glyph, logoGlyphs[index].targetX, wordCenterY);
  });

  const streamLetters = [];
  const streamCount = prefersReducedMotion
    ? Math.max(28, Math.round(width / 20))
    : Math.max(120, Math.round(width / 5.5));
  const orbitBaseRadiusX = (totalWordWidth * 0.52) + (finalFontSize * 0.16);
  const orbitBaseRadiusY = (finalFontSize * 0.56);

  for (let index = 0; index < streamCount; index += 1) {
    const orbitBand = index % 7;
    const orbitScale = 0.86 + (orbitBand * 0.28) + (Math.random() * 0.14);
    const direction = Math.random() < 0.5 ? 1 : -1;
    const spreadBias = orbitBand >= 4 ? 1.35 : 1;
    streamLetters.push({
      glyph: alphabet[Math.floor(Math.random() * alphabet.length)],
      size: (Math.max(width, height) * 0.024) + Math.random() * (Math.max(width, height) * 0.034),
      angularSpeed: (prefersReducedMotion ? 0.00022 : 0.0004) * (0.82 + Math.random() * 0.72) * direction,
      radiusX: Math.min((width * 0.64), orbitBaseRadiusX * orbitScale * spreadBias),
      radiusY: Math.min((height * 0.42), orbitBaseRadiusY * (0.86 + (orbitBand * 0.2) + (Math.random() * 0.14)) * spreadBias),
      wobble: finalFontSize * (0.03 + Math.random() * 0.05),
      wobbleSpeed: 0.0012 + Math.random() * 0.0016,
      alpha: prefersReducedMotion ? 0.16 + Math.random() * 0.1 : 0.24 + Math.random() * 0.18,
      seed: Math.random() * Math.PI * 2,
    });
  }

  const start = performance.now();

  function drawOrbitLetters(elapsed, fadeAmount, pass = 'back') {
    streamLetters.forEach((letter) => {
      const orbitAngle = (elapsed * letter.angularSpeed) + letter.seed;
      const depth = Math.sin(orbitAngle);
      const isFront = depth > 0;
      if ((pass === 'front' && !isFront) || (pass === 'back' && isFront)) return;

      const wobbleX = Math.sin((elapsed * letter.wobbleSpeed) + (letter.seed * 1.4)) * letter.wobble;
      const wobbleY = Math.cos((elapsed * letter.wobbleSpeed * 0.82) + (letter.seed * 0.9)) * letter.wobble * 0.72;
      const x = (width / 2) + (Math.cos(orbitAngle) * letter.radiusX) + wobbleX;
      const y = wordCenterY + (depth * letter.radiusY) + wobbleY;
      const depthScale = isFront ? (1 + (depth * 0.22)) : (0.74 + ((depth + 1) * 0.08));
      const alpha = letter.alpha * fadeAmount * (isFront ? (0.72 + (depth * 0.42)) : 0.18);
      if (alpha <= 0.015) return;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = textColor;
      ctx.font = `500 ${letter.size * depthScale}px ${serifFont}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(letter.glyph, x, y);
      ctx.restore();
    });
  }

  function frame(now) {
    if (sequenceId !== openingSequenceId) return;

    const elapsed = now - start;
    const flowProgress = easeOutCubic(getPhaseProgress(elapsed, 0, flowDuration));
    const settleProgress = easeInOutCubic(getPhaseProgress(elapsed, flowDuration * 0.58, settleDuration));
    const revealProgress = easeInOutCubic(getPhaseProgress(elapsed, flowDuration + settleDuration, revealDuration));
    const fadeStreamsProgress = getPhaseProgress(elapsed, flowDuration + (settleDuration * 0.3), revealDuration);
    const disperseProgress = easeInOutCubic(
      getPhaseProgress(elapsed, flowDuration + settleDuration + revealDuration + holdDuration, disperseDuration),
    );

    ctx.clearRect(0, 0, width, height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;

    drawOrbitLetters(elapsed, Math.max(0, 1 - fadeStreamsProgress), 'back');

    logoGlyphs.forEach((glyph, index) => {
      const localProgress = clamp((flowProgress - glyph.delay) / (1 - glyph.delay), 0, 1);
      if (localProgress <= 0.001) return;

      const travel = easeOutCubic(localProgress);
      const arcStrength = (1 - travel) * glyph.enterArc;
      const x = lerp(glyph.startX, glyph.targetX, travel) + (glyph.driftX * (1 - travel));
      const y = lerp(glyph.startY, glyph.targetY, travel) + Math.sin((travel * Math.PI) + (index * 0.35)) * arcStrength + (glyph.driftY * (1 - travel));
      const assemblyFade = 1 - clamp((revealProgress - 0.24) / 0.76, 0, 1);
      const alpha = Math.min(0.96, (0.22 + (travel * glyph.alpha) + (settleProgress * 0.18))) * assemblyFade;
      if (alpha <= 0.02) return;

      ctx.save();
      drawWordmarkGlyph(ctx, glyph.glyph, x, y, alpha);
      ctx.restore();
    });

    ctx.globalAlpha = 1;
    const revealAlpha = clamp((revealProgress - 0.18) / 0.82, 0, 1);
    const dissolveFade = Math.max(0, 1 - (disperseProgress ** 2.1));
    const wordAlpha = revealAlpha * dissolveFade;
    if (disperseProgress > 0.001) {
      drawRippleWord(wordAlpha, disperseProgress);
    } else {
      drawFinalWord(wordAlpha);
    }
    drawOrbitLetters(elapsed, Math.max(0, 1 - fadeStreamsProgress), 'front');

    if (elapsed < totalDuration) {
      requestAnimationFrame(frame);
      return;
    }

    if (sequenceId === openingSequenceId) {
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
      getActiveKey: () => uiState.profileSection || 'identity',
      applySelection: (key) => {
        uiState.profileSection = key;
        if (uiState.profileSection === 'library') {
          uiState.profileLibraryTab = uiState.profileLibraryTab || 'liked';
        }
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
      uiState.homeTheme = uiState.homeTheme === 'dark' ? 'light' : 'dark';
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

function buildComposeCaption(values) {
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
  } = options;

  const lines = [];
  const paragraphs = String(text || '').split('\n');

  paragraphs.forEach((paragraph) => {
    const hasSpaces = /\s/.test(paragraph.trim());
    const units = hasSpaces
      ? paragraph.split(/\s+/).filter(Boolean)
      : Array.from(paragraph);
    const separator = hasSpaces ? ' ' : '';

    if (!units.length) {
      lines.push('');
      return;
    }

    let current = '';
    units.forEach((unit) => {
      const next = current ? `${current}${separator}${unit}` : unit;
      if (ctx.measureText(next).width <= maxWidth || !current) {
        current = next;
        return;
      }
      lines.push(current);
      current = unit;
    });

    if (current) {
      lines.push(current);
    }
  });

  lines.slice(0, maxLines).forEach((line, index) => {
    ctx.fillText(line, x, y + index * lineHeight);
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

  if (imageRatio > rectRatio) {
    sw = bitmap.height * rectRatio;
    sx = (bitmap.width - sw) * Math.min(1, Math.max(0, position.x ?? 0.5));
  } else {
    sh = bitmap.width / rectRatio;
    sy = (bitmap.height - sh) * Math.min(1, Math.max(0, position.y ?? 0.5));
  }

  ctx.save();
  clipRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, rect.radius);
  ctx.clip();
  ctx.drawImage(bitmap, sx, sy, sw, sh, rect.x, rect.y, rect.width, rect.height);
  ctx.restore();
  bitmap.close?.();
}

function drawSlotPlaceholder(ctx, rect) {
  ctx.save();
  ctx.lineWidth = 4;
  ctx.strokeStyle = 'rgba(34, 28, 25, 0.88)';
  clipRoundedRect(ctx, rect.x, rect.y, rect.width, rect.height, rect.radius);
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
  const customCanvas = composeSheet?.querySelector('[data-custom-canvas]') || null;
  const composeDraft = getActivePost(uiState.composeEditingPostId)?.composeData || null;
  const page8DraftValues = {
    ...composePreviewDefaults,
    ...(composeDraft || {}),
  };
  const previewUrls = {
    imageInputPrimary: '',
    imageInputSecondary: '',
    imageInputAccent: '',
  };
  const selectedFiles = {
    primary: { file: null, position: { x: 0.5, y: 0.5 }, imageSize: null },
    secondary: { file: null, position: { x: 0.5, y: 0.5 }, imageSize: null },
    accent: { file: null, position: { x: 0.5, y: 0.5 }, imageSize: null },
  };
  const tagToggle = document.querySelector('[data-toggle-compose-tags]');
  const tagPanel = document.querySelector('[data-compose-tags]');
  const previewToggle = document.querySelector('[data-toggle-compose-preview]');
  const customTemplateControls = document.querySelector('[data-custom-template-controls]');
  const customInspector = document.querySelector('[data-custom-inspector]');
  const editables = Array.from(document.querySelectorAll('[data-editable]'));
  const customLayoutState = {
    options: normalizePage8Options(composeDraft?.customLayout || {}),
    imageBoxes: normalizePage8ImageBoxes(composeDraft?.customLayout || {}),
    textBoxes: normalizePage8TextBoxes(composeDraft?.customLayout || {}, page8DraftValues),
    selectedId: null,
  };
  const customImageFiles = {};
  const editableKeyMap = {
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
  };

  const switchComposeStage = (nextStage) => {
    uiState.composeStage = nextStage;
    render();
  };

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

  function updateSlotPosition(inputId) {
    const slotImage = document.querySelector(`[data-slot-image="${inputId}"]`);
    const stateKey = inputId === 'imageInputPrimary'
      ? 'primary'
      : inputId === 'imageInputSecondary'
        ? 'secondary'
        : 'accent';
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
      customImageFiles[boxId] = { file: null, position: { x: 0.5, y: 0.5 }, imageSize: null, previewUrl: '' };
    }
    return customImageFiles[boxId];
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

  function clampEditable(element) {
    const maxChars = Number(element.dataset.maxChars || 0);
    const value = element.innerText.replace(/\r/g, '');
    if (!element.dataset.previousValue) {
      element.dataset.previousValue = value;
    }

    if ((maxChars && value.length > maxChars) || element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1) {
      element.innerText = element.dataset.previousValue;
      return;
    }

    element.dataset.previousValue = value.trim() ? value : '';
  }

  function getEditableText(element) {
    return element.innerText.replace(/\r/g, '');
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
    return target.innerText.replace(/\r/g, '').trim();
  }

  function setPreviewBackground() {
    if (!composeSheet) return;
    const checked = composeRoot.querySelector('input[name="backgroundColor"]:checked');
    const nextBackground = checked?.value || uiState.composeBackgroundColor || '#f8f4ee';
    uiState.composeBackgroundColor = nextBackground;
    composeSheet.style.setProperty('--sheet-bg', nextBackground);
    composeRoot.querySelectorAll('.color-chip').forEach((chip) => {
      const input = chip.querySelector('input[name="backgroundColor"]');
      chip.classList.toggle('is-active', Boolean(input?.checked));
    });
  }

  function setPreviewTemplate(templateId) {
    if (!composeSheet) return;
    const nextTemplateId = templateId || DEFAULT_COMPOSE_TEMPLATE;
    composeSheet.dataset.template = nextTemplateId;
    uiState.composeTemplateId = nextTemplateId;
    composeRoot.querySelectorAll('.template-thumb').forEach((card) => {
      const input = card.querySelector('input[name="templateId"]');
      card.classList.toggle('is-active', input?.value === nextTemplateId);
    });
    const isCustomTemplate = nextTemplateId === 'page8';
    if (customTemplateControls) {
      customTemplateControls.hidden = true;
    }
    composeSheet.classList.toggle('compose-sheet--custom', isCustomTemplate);
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
    if (!slotImage || !slotPlaceholder || !removeButton) return;

    if (previewUrls[inputId]) {
      slotImage.style.backgroundImage = `url("${previewUrls[inputId]}")`;
      slotImage.hidden = false;
      slotPlaceholder.hidden = true;
      removeButton.hidden = false;
      return;
    }

    slotImage.style.backgroundImage = '';
    slotImage.hidden = true;
    slotPlaceholder.hidden = false;
    removeButton.hidden = true;
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
      customInspector.innerHTML = `
        <p class="compose-custom-inspector__title">Image Box</p>
        <p class="compose-custom-inspector__note">画像面をタップで差し替え。移動は上部バー、サイズ変更は右下ハンドルです。</p>
        <div class="compose-custom-inspector__meta">
          <span>W ${(record.item.width * 100).toFixed(0)}%</span>
          <span>H ${(record.item.height * 100).toFixed(0)}%</span>
        </div>
        <div class="compose-custom-inspector__segmented">
          <button type="button" data-custom-control="delete">Delete</button>
        </div>
      `;
    } else {
      customInspector.innerHTML = `
      <p class="compose-custom-inspector__title">Text Box</p>
      <label class="compose-custom-inspector__field">
        <span>Text</span>
        <textarea class="compose-custom-inspector__textarea" data-custom-control="text">${escapeHtml(record.item.text)}</textarea>
      </label>
      <label class="compose-custom-inspector__field">
        <span>Size</span>
        <input class="compose-custom-inspector__range" data-custom-control="fontSize" type="range" min="14" max="54" value="${Math.round(record.item.fontSize * 520)}" />
      </label>
      <label class="compose-custom-inspector__field">
        <span>Weight</span>
        <input class="compose-custom-inspector__range" data-custom-control="weight" type="range" min="400" max="700" step="100" value="${record.item.weight}" />
      </label>
      <div class="compose-custom-inspector__field">
        <span>Align</span>
        <div class="compose-custom-inspector__segmented">
          <button type="button" data-custom-align="left" class="${record.item.align === 'left' ? 'is-active' : ''}">Left</button>
          <button type="button" data-custom-align="center" class="${record.item.align === 'center' ? 'is-active' : ''}">Center</button>
          <button type="button" data-custom-align="right" class="${record.item.align === 'right' ? 'is-active' : ''}">Right</button>
        </div>
      </div>
      <div class="compose-custom-inspector__field">
        <span>Typeface</span>
        <div class="compose-custom-inspector__segmented">
          <button type="button" data-custom-family="sans" class="${record.item.family === 'sans' ? 'is-active' : ''}">Sans</button>
          <button type="button" data-custom-family="serif" class="${record.item.family === 'serif' ? 'is-active' : ''}">Serif</button>
          <button type="button" data-custom-control="delete">Delete</button>
        </div>
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
      });

      customInspector.querySelector('[data-custom-control="fontSize"]')?.addEventListener('input', (event) => {
        const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
        if (!nextRecord || nextRecord.type !== 'text') return;
        nextRecord.item.fontSize = Number(event.target.value) / 520;
        renderCustomCanvas();
      });

      customInspector.querySelector('[data-custom-control="weight"]')?.addEventListener('input', (event) => {
        const nextRecord = customLayoutState.selectedId ? getCustomItemRecord(customLayoutState.selectedId) : null;
        if (!nextRecord || nextRecord.type !== 'text') return;
        nextRecord.item.weight = Number(event.target.value);
        renderCustomCanvas();
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
          nextRecord.item.weight = nextRecord.item.family === 'serif'
            ? Math.max(500, nextRecord.item.weight)
            : Math.min(600, nextRecord.item.weight);
          renderCustomCanvas();
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
      const selectedClass = `${customLayoutState.selectedId === box.id ? ' is-selected' : ''}${hasImage ? '' : ' is-empty'}`;
      const surfaceMarkup = hasImage
        ? `<div class="compose-custom-item__image" style="background-image:url('${state.previewUrl}');background-position:${(state.position.x || 0.5) * 100}% ${(state.position.y || 0.5) * 100}%;"></div>`
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
            style="text-align:${box.align};font-size:${Math.max(11, box.fontSize * 520)}px;line-height:${box.lineHeight};font-family:${box.family === 'serif' ? `'Cormorant Garamond', 'Times New Roman', serif` : `'Noto Sans JP', sans-serif`};font-weight:${box.weight};"
          >${escapeHtml(box.text)}</div>
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
        const textSurface = event.target.closest('[data-custom-text]');
        const imageState = record.type === 'image' ? getCustomImageState(itemId) : null;
        selectCustomItem(itemId);
        const frameRect = composeFrame.getBoundingClientRect();
        dragState = {
          pointerId: event.pointerId,
          itemId,
          mode: 'move',
          originX: record.item.x,
          originY: record.item.y,
          startX: event.clientX,
          startY: event.clientY,
          frameWidth: frameRect.width,
          frameHeight: frameRect.height,
          type: record.type,
          targetSurface: record.type === 'image' && !(imageState?.previewUrl || imageState?.file)
            ? event.target.closest('[data-custom-surface]')
            : null,
          targetText: textSurface,
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
        state.position = { x: 0.5, y: 0.5 };
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

  composeRoot.querySelectorAll('[data-custom-add]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const action = button.dataset.customAdd;
      if (composeSheet?.dataset.template !== 'page8') return;
      if (action === 'image') {
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

      const nextText = findSafeTextPosition({
        id: createCustomId('text'),
        text: 'text',
        isDefaultText: true,
        x: 0.18,
        y: 0.2,
        width: 0.28,
        height: 0.12,
        fontSize: 0.028,
        lineHeight: 1.35,
        align: 'left',
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
    });
  });

  [
    { inputId: 'imageInputPrimary', stateKey: 'primary' },
    { inputId: 'imageInputSecondary', stateKey: 'secondary' },
    { inputId: 'imageInputAccent', stateKey: 'accent' },
  ].forEach(({ inputId, stateKey }) => {
    const slot = document.querySelector(`[data-slot="${inputId}"]`);
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', async (event) => {
      const file = event.target.files?.[0] || null;
      selectedFiles[stateKey].file = file;
      selectedFiles[stateKey].position = { x: 0.5, y: 0.5 };
      selectedFiles[stateKey].imageSize = file ? await loadImageSize(file) : null;
      if (previewUrls[inputId]) {
        URL.revokeObjectURL(previewUrls[inputId]);
        previewUrls[inputId] = '';
      }
      if (file) {
        previewUrls[inputId] = fileToPreviewUrl(file);
      }
      setPreviewImage(inputId);
      updateSlotPosition(inputId);
    });

    const removeButton = document.querySelector(`[data-slot-remove="${inputId}"]`);
    if (removeButton) {
      removeButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (previewUrls[inputId]) {
          URL.revokeObjectURL(previewUrls[inputId]);
          previewUrls[inputId] = '';
        }
        selectedFiles[stateKey] = { file: null, position: { x: 0.5, y: 0.5 }, imageSize: null };
        input.value = '';
        setPreviewImage(inputId);
      });
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
        return;
      }

      const maxChars = Number(element.dataset.maxChars || 0);
      if (!maxChars || !event.inputType.startsWith('insert')) return;

      const currentLength = getEditableText(element).length;
      const selectedLength = getSelectionLengthWithin(element);
      const incomingLength = event.data?.length ?? 1;
      if ((currentLength - selectedLength + incomingLength) > maxChars) {
        event.preventDefault();
      }
    });

    element.addEventListener('paste', (event) => {
      event.preventDefault();
      const pastedText = event.clipboardData?.getData('text/plain')?.replace(/\r/g, '') ?? '';
      const normalizedText = element.dataset.singleLine === 'true'
        ? pastedText.replace(/\n+/g, ' ')
        : pastedText;

      const maxChars = Number(element.dataset.maxChars || 0);
      const currentLength = getEditableText(element).length;
      const selectedLength = getSelectionLengthWithin(element);
      const availableLength = maxChars
        ? Math.max(0, maxChars - (currentLength - selectedLength))
        : normalizedText.length;
      const nextText = normalizedText.slice(0, availableLength);
      if (!nextText) return;
      insertPlainText(element, nextText);
      element.dataset.previousValue = getEditableText(element);
    });

    element.addEventListener('input', () => {
      const maxChars = Number(element.dataset.maxChars || 0);
      const value = getEditableText(element);
      if (maxChars && value.length > maxChars) {
        element.innerText = element.dataset.previousValue || '';
        placeCaretAtEnd(element);
        return;
      }
      element.dataset.previousValue = value;
    });

    element.addEventListener('blur', () => {
      normalizeEditableContent(element);
      clampEditable(element);
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const fixedTags = formData.getAll('fixedTags').map((tag) => String(tag));
    const freeTags = String(formData.get('freeTags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const isCustomTemplate = composeSheet?.dataset.template === 'page8';
    const normalizedCustomLayout = isCustomTemplate
      ? computePage8ResolvedLayout({
        ...customLayoutState.options,
        imageBoxes: customLayoutState.imageBoxes,
        textBoxes: customLayoutState.textBoxes.map((box) => ({
          ...box,
          text: String(box.text || '').replace(/\r/g, ''),
        })),
      }, page8DraftValues)
      : null;

    const values = {
      templateId: String(formData.get('templateId') || uiState.composeTemplateId || DEFAULT_COMPOSE_TEMPLATE),
      backgroundColor: String(formData.get('backgroundColor') || uiState.composeBackgroundColor || '#f8f4ee'),
      headline: getEditableValue('headline'),
      subhead: getEditableValue('subhead'),
      intro: getEditableValue('intro'),
      body: getEditableValue('body'),
      date: getEditableValue('date'),
      editor: getEditableValue('editor'),
      customLayout: normalizedCustomLayout,
    };

    const page8Files = normalizedCustomLayout
      ? Object.fromEntries(normalizedCustomLayout.imageBoxes.map((box) => [box.id, getCustomImageState(box.id)]))
      : {};
    const imageData = await renderComposeTemplate(values, selectedFiles, { page8Files });
    const profileName = String(getState().profile?.name || 'you').trim() || 'you';

    if (uiState.composeEditingPostId) {
      updatePost(uiState.composeEditingPostId, {
        caption: buildComposeCaption(values),
        imageData,
        fixedTags,
        freeTags,
        composeData: {
          ...values,
          fixedTags,
          freeTags,
        },
      });
    } else {
      addPost({
        authorName: profileName,
        caption: buildComposeCaption(values),
        imageData,
        fixedTags,
        freeTags,
        composeData: {
          ...values,
          fixedTags,
          freeTags,
        },
      });
    }

    uiState.screen = 'timeline';
    uiState.timelineTab = 'recommended';
    uiState.composeStage = 'edit';
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

  document.querySelectorAll('[data-profile-section]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.profileSection = button.dataset.profileSection;
      if (uiState.profileSection === 'library') {
        uiState.profileLibraryTab = uiState.profileLibraryTab || 'liked';
      }
      renderScreen();
    });
  });

  document.querySelectorAll('[data-profile-library-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.profileLibraryTab = button.dataset.profileLibraryTab || 'liked';
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
      uiState.profileSection = null;
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
      bindHomeEvents();
      break;
    case 'timeline':
      bindTimelineEvents();
      break;
    case 'search':
      bindSearchEvents();
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

render();
