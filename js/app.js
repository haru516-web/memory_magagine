import { renderBottomNav } from './components/bottomNav.js';
import { renderCommentsModal } from './components/modals.js';
import { getState, addPost, deletePost, toggleLike, toggleSave, addComment, addImpression, updateProfile, toggleFollow, saveIssue } from './core/store.js';
import { renderOpening } from './pages/opening.js';
import { renderTimeline } from './pages/timeline.js';
import { renderSearch } from './pages/search.js';
import { renderCompose } from './pages/compose.js';
import { renderMagazine } from './pages/magazine.js';
import { renderProfile } from './pages/profile.js';
import { renderPostDetail } from './pages/postDetail.js';
import { DEFAULT_COMPOSE_TEMPLATE, getComposeTemplateById } from './templates/index.js';
import { cropFileToCirclePngDataUrl, fileToPreviewUrl } from './utils/image.js';

const uiState = {
  screen: 'opening',
  timelineTab: 'recommended',
  searchQuery: '',
  searchTags: [],
  previewPostId: null,
  commentPostId: null,
  profileEditOpen: false,
  profileAuthor: null,
  profileSection: null,
  profileExpanded: true,
  profileOrbitRotation: 0,
  profileOrbitDragSuppressUntil: 0,
  profileAvatarCropOpen: false,
  bottomNavExpanded: false,
  composeTemplateId: DEFAULT_COMPOSE_TEMPLATE,
  openingTapGuardUntil: 0,
  postReturnScreen: 'timeline',
  postReturnProfileAuthor: null,
};

const composePreviewDefaults = {
  headline: 'A quiet date story',
  subhead: 'A small title line drifting across the page',
  intro: 'short intro\nshort intro\nshort intro',
  body: 'Write a soft paragraph here.\nAdd the memory you want to keep.',
  date: '2026.04.14',
  editor: '編集者：haru',
};

const app = document.getElementById('app');
let openingSequenceId = 0;
const profileAvatarDraft = {
  file: null,
  previewUrl: '',
  imageSize: null,
  crop: { x: 0.5, y: 0.5, zoom: 1 },
};

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
    case 'timeline':
      return renderTimeline(state, uiState);
    case 'search':
      return renderSearch(state, uiState);
    case 'compose':
      return renderCompose(uiState.composeTemplateId);
    case 'magazine':
      return renderMagazine(state);
    case 'profile':
      return renderProfile(state, uiState);
    case 'post':
      return renderPostDetail(getActivePost(uiState.previewPostId), { canDelete: isOwnPost(getActivePost(uiState.previewPostId)) });
    default:
      return renderTimeline(state, uiState);
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
  app.innerHTML = `
    <div class="app-shell">
      <main class="screen-area" id="screenArea"></main>
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

function navigate(screen) {
  if (screen !== 'profile') {
    resetProfileAvatarDraft();
  }
  uiState.screen = screen;
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  if (screen === 'profile') {
    resetProfileAvatarDraft();
    uiState.profileAuthor = null;
    uiState.profileSection = null;
    uiState.profileExpanded = true;
    uiState.profileOrbitRotation = 0;
  }
  if (screen !== 'profile') {
    uiState.profileEditOpen = false;
    uiState.profileAuthor = null;
  }
  render();
}

function enterTimelineFromOpening() {
  uiState.bottomNavExpanded = false;
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  uiState.openingTapGuardUntil = Date.now() + 700;
  uiState.postReturnScreen = 'timeline';
  uiState.postReturnProfileAuthor = null;
  navigate('timeline');
}

function openProfile(authorName) {
  resetProfileAvatarDraft();
  uiState.screen = 'profile';
  uiState.previewPostId = null;
  uiState.commentPostId = null;
  uiState.profileEditOpen = false;
  uiState.profileAuthor = authorName || null;
  uiState.profileSection = null;
  uiState.profileExpanded = true;
  uiState.profileOrbitRotation = 0;
  render();
}

function openPostDetail(postId) {
  uiState.postReturnScreen = uiState.screen;
  uiState.postReturnProfileAuthor = uiState.profileAuthor;
  uiState.screen = 'post';
  uiState.previewPostId = postId;
  uiState.commentPostId = null;
  render();
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
  const serifFont = '"Cormorant Garamond", "Times New Roman", serif';
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const finalFontSize = Math.min(width * 0.34, height * 0.68, 168 * ratio);
  const finalFont = `500 ${finalFontSize}px ${serifFont}`;
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

  function drawFinalWord(alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(wordCanvas, 0, 0);
    ctx.restore();
  }

  function drawRippleWord(alpha = 1, progress = 0) {
    const centerY = height * 0.52;
    const phase = progress * Math.PI * 0.9;
    const rippleStrength = finalFontSize * 0.018 * (1 - (progress * 0.32));
    const driftX = Math.sin(phase * 0.82) * rippleStrength * 0.55;
    const driftY = Math.cos(phase * 0.68) * rippleStrength * 0.42;
    const scale = 1 + (Math.sin(progress * Math.PI * 0.8) * 0.004);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate((width / 2) + driftX, centerY + driftY);
    ctx.scale(scale, scale);
    ctx.drawImage(wordCanvas, -width / 2, -height * 0.52);
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
  const logoText = ['L', 'A', 'N', 'I'];
  const logoSpacing = finalFontSize * 0.06;
  wordCtx.font = finalFont;
  const glyphWidths = logoText.map((glyph) => wordCtx.measureText(glyph).width);
  const totalWordWidth = glyphWidths.reduce((sum, glyphWidth) => sum + glyphWidth, 0) + (logoSpacing * (logoText.length - 1));
  const wordStartX = (width / 2) - (totalWordWidth / 2);
  const wordCenterY = height * 0.52;
  wordCtx.fillStyle = textColor;
  wordCtx.font = finalFont;
  wordCtx.textAlign = 'left';
  wordCtx.textBaseline = 'middle';
  let logoCursorX = wordStartX;
  const logoGlyphs = logoText.map((glyph, index) => {
    const glyphWidth = glyphWidths[index];
    const targetX = logoCursorX;
    logoCursorX += glyphWidth + logoSpacing;
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
    wordCtx.fillText(glyph, logoGlyphs[index].targetX, wordCenterY);
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
      ctx.globalAlpha = alpha;
      ctx.fillStyle = textColor;
      ctx.font = finalFont;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(glyph.glyph, x, y);
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
  document.querySelectorAll('[data-nav-toggle]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.bottomNavExpanded = !uiState.bottomNavExpanded;
      render();
    });
  });

  document.querySelectorAll('[data-nav]').forEach((button) => {
    button.addEventListener('click', () => {
      navigate(button.dataset.nav);
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

function bindTimelineEvents() {
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      uiState.timelineTab = button.dataset.tab;
      renderScreen();
    });
  });
  bindPostInteractions(document.getElementById('screenArea'));
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

function buildComposeCaption(values) {
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
  const bitmap = await createImageBitmap(file);
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

async function renderComposeTemplate(values, files) {
  const width = 1240;
  const height = 1754;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = values.backgroundColor || '#f8f4ee';
  ctx.fillRect(0, 0, width, height);
  const template = getComposeTemplateById(values.templateId);
  await template.render(ctx, values, files, {
    addWrappedText,
    clipRoundedRect,
    drawFileCover,
    drawSlotPlaceholder,
    defaults: composePreviewDefaults,
  });

  return canvas.toDataURL('image/webp', 0.92);
}

function bindComposeEvents() {
  const form = document.getElementById('composeForm');
  if (!form) return;

  const composePage = document.querySelector('.page--compose');
  const composeSheet = document.getElementById('composeSheet');
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
  const editables = Array.from(document.querySelectorAll('[data-editable]'));

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
  }

  function getEditableValue(name) {
    const target = document.querySelector(`[data-editable="${name}"]`);
    if (!target) return '';
    return target.innerText.replace(/\r/g, '').trim();
  }

  function setPreviewBackground() {
    if (!composeSheet) return;
    const checked = form.querySelector('input[name="backgroundColor"]:checked');
    composeSheet.style.setProperty('--sheet-bg', checked?.value || '#f8f4ee');
  }

  function setPreviewTemplate(templateId) {
    if (!composeSheet) return;
    const nextTemplateId = templateId || DEFAULT_COMPOSE_TEMPLATE;
    composeSheet.dataset.template = nextTemplateId;
    uiState.composeTemplateId = nextTemplateId;
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

  form.querySelectorAll('input[name="backgroundColor"]').forEach((radio) => {
    radio.addEventListener('change', setPreviewBackground);
  });
  setPreviewBackground();

  form.querySelectorAll('input[name="templateId"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      setPreviewTemplate(radio.value);
    });
  });
  setPreviewTemplate(uiState.composeTemplateId || form.querySelector('input[name="templateId"]:checked')?.value);

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
        if (!selectedFiles[stateKey].file || composePage?.classList.contains('is-preview-mode')) return;
        dragState = {
          pointerId: event.pointerId,
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

    const values = {
      templateId: String(formData.get('templateId') || uiState.composeTemplateId || DEFAULT_COMPOSE_TEMPLATE),
      backgroundColor: String(formData.get('backgroundColor') || '#f8f4ee'),
      headline: getEditableValue('headline'),
      subhead: getEditableValue('subhead'),
      intro: getEditableValue('intro'),
      body: getEditableValue('body'),
      date: getEditableValue('date'),
      editor: getEditableValue('editor'),
    };

    const imageData = await renderComposeTemplate(values, selectedFiles);
    const profileName = String(getState().profile?.name || 'you').trim() || 'you';

    addPost({
      authorName: profileName,
      caption: buildComposeCaption(values),
      imageData,
      fixedTags,
      freeTags,
    });

    uiState.screen = 'timeline';
    uiState.timelineTab = 'recommended';
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
      if (Date.now() < uiState.profileOrbitDragSuppressUntil) {
        return;
      }
      uiState.profileSection = button.dataset.profileSection;
      renderScreen();
    });
  });

  const orbit = document.querySelector('[data-profile-orbit]');
  if (orbit) {
    const applyOrbitRotation = (rotation) => {
      orbit.style.setProperty('--orbit-rotation', `${rotation}deg`);
      orbit.querySelectorAll('[data-orbit-angle]').forEach((node) => {
        const baseAngle = Number(node.dataset.orbitAngle || 0);
        node.style.setProperty('--node-counter-angle', `${-(baseAngle + rotation)}deg`);
      });
    };

    applyOrbitRotation(uiState.profileOrbitRotation || 0);

    let dragState = null;
    const getPointerAngle = (event) => {
      const rect = orbit.getBoundingClientRect();
      const centerX = rect.left + (rect.width / 2);
      const centerY = rect.top + (rect.height / 2);
      return Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);
    };

    const normalizeAngleDelta = (value) => {
      let delta = value;
      while (delta > 180) delta -= 360;
      while (delta < -180) delta += 360;
      return delta;
    };

    orbit.addEventListener('pointerdown', (event) => {
      dragState = {
        pointerId: event.pointerId,
        startAngle: getPointerAngle(event),
        startRotation: uiState.profileOrbitRotation || 0,
        moved: false,
      };
      orbit.classList.add('is-rotating');
      orbit.setPointerCapture?.(event.pointerId);
    });

    orbit.addEventListener('pointermove', (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      const delta = normalizeAngleDelta(getPointerAngle(event) - dragState.startAngle);
      if (Math.abs(delta) > 3) {
        dragState.moved = true;
      }
      uiState.profileOrbitRotation = dragState.startRotation + delta;
      applyOrbitRotation(uiState.profileOrbitRotation);
    });

    const finishOrbitDrag = (event) => {
      if (!dragState || dragState.pointerId !== event.pointerId) return;
      if (dragState.moved) {
        uiState.profileOrbitDragSuppressUntil = Date.now() + 160;
      }
      dragState = null;
      orbit.classList.remove('is-rotating');
      orbit.releasePointerCapture?.(event.pointerId);
    };

    orbit.addEventListener('pointerup', finishOrbitDrag);
    orbit.addEventListener('pointercancel', finishOrbitDrag);
  }

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
  switch (uiState.screen) {
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
