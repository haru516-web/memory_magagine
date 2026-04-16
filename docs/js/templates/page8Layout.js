export const PAGE8_BOUNDS = { x: 0.06, y: 0.06, width: 0.88, height: 0.88 };

export const PAGE8_DEFAULT_OPTIONS = {
  densityMode: 'whitespace',
  recoveryMode: 'restore',
};

export const PAGE8_DEFAULT_IMAGE_BOXES = {
  primary: { x: 0.08, y: 0.16, width: 0.4, height: 0.3 },
  secondary: { x: 0.58, y: 0.12, width: 0.24, height: 0.2 },
  accent: { x: 0.56, y: 0.58, width: 0.26, height: 0.18 },
};

const TEXT_SPECS = {
  headline: {
    x: 0.08, y: 0.07, width: 0.46, height: 0.1,
    fontSize: 78, lineHeight: 82, minScale: 0.58, maxLines: 2, align: 'left',
  },
  subhead: {
    x: 0.08, y: 0.16, width: 0.48, height: 0.07,
    fontSize: 30, lineHeight: 40, minScale: 0.72, maxLines: 2, align: 'left',
  },
  intro: {
    x: 0.08, y: 0.52, width: 0.28, height: 0.18,
    fontSize: 28, lineHeight: 38, minScale: 0.7, maxLines: 4, align: 'left',
  },
  body: {
    x: 0.62, y: 0.42, width: 0.22, height: 0.24,
    fontSize: 27, lineHeight: 38, minScale: 0.68, maxLines: 5, align: 'left',
  },
  date: {
    x: 0.08, y: 0.91, width: 0.22, height: 0.04,
    fontSize: 24, lineHeight: 30, minScale: 0.88, maxLines: 1, align: 'left',
  },
  editor: {
    x: 0.66, y: 0.91, width: 0.2, height: 0.04,
    fontSize: 24, lineHeight: 30, minScale: 0.88, maxLines: 1, align: 'right',
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cloneRect(rect) {
  return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
}

function expandRect(rect, gap) {
  return {
    x: rect.x - gap,
    y: rect.y - gap,
    width: rect.width + (gap * 2),
    height: rect.height + (gap * 2),
  };
}

function overlaps(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function containsRect(bounds, rect) {
  return (
    rect.x >= bounds.x &&
    rect.y >= bounds.y &&
    rect.x + rect.width <= bounds.x + bounds.width &&
    rect.y + rect.height <= bounds.y + bounds.height
  );
}

function moveRect(rect, x, y) {
  return { ...rect, x, y };
}

function scoreCandidate(candidate, preferred, densityMode) {
  const dx = candidate.x - preferred.x;
  const dy = candidate.y - preferred.y;
  const distance = Math.abs(dx) + Math.abs(dy);
  const whitespaceBias = densityMode === 'whitespace' ? Math.abs(dy) * 0.3 : 0;
  const fillBias = densityMode === 'fill' ? ((candidate.y + candidate.height) * 0.08) : 0;
  return distance + whitespaceBias - fillBias;
}

function resolveTextBlock(spec, colliders, options, previousResolved) {
  const gap = options.densityMode === 'fill' ? 0.018 : 0.032;
  const baseRect = { x: spec.x, y: spec.y, width: spec.width, height: spec.height };
  let scale = options.recoveryMode === 'keep' && previousResolved ? previousResolved.scale : 1;
  let preferredRect = options.recoveryMode === 'keep' && previousResolved ? cloneRect(previousResolved.rect) : cloneRect(baseRect);

  for (let attempt = 0; attempt < 18; attempt += 1) {
    const rect = {
      x: preferredRect.x,
      y: preferredRect.y,
      width: preferredRect.width,
      height: preferredRect.height * scale,
    };

    const expandedRect = expandRect(rect, gap);
    const conflicting = colliders.find((collider) => overlaps(expandedRect, collider));
    if (!conflicting && containsRect(PAGE8_BOUNDS, rect)) {
      return { rect, scale };
    }

    const candidates = [
      moveRect(rect, conflicting ? conflicting.x + conflicting.width + gap : rect.x, rect.y),
      moveRect(rect, rect.x, conflicting ? conflicting.y + conflicting.height + gap : rect.y),
      moveRect(rect, conflicting ? conflicting.x - rect.width - gap : rect.x, rect.y),
      moveRect(rect, rect.x, conflicting ? conflicting.y - rect.height - gap : rect.y),
    ]
      .map((candidate) => ({
        ...candidate,
        x: clamp(candidate.x, PAGE8_BOUNDS.x, PAGE8_BOUNDS.x + PAGE8_BOUNDS.width - candidate.width),
        y: clamp(candidate.y, PAGE8_BOUNDS.y, PAGE8_BOUNDS.y + PAGE8_BOUNDS.height - candidate.height),
      }))
      .filter((candidate) => containsRect(PAGE8_BOUNDS, candidate))
      .filter((candidate) => !colliders.some((collider) => overlaps(expandRect(candidate, gap), collider)));

    if (candidates.length) {
      candidates.sort((a, b) => scoreCandidate(a, baseRect, options.densityMode) - scoreCandidate(b, baseRect, options.densityMode));
      preferredRect = candidates[0];
      continue;
    }

    if (scale > spec.minScale) {
      scale = Math.max(spec.minScale, scale - 0.08);
      preferredRect = cloneRect(baseRect);
      continue;
    }
  }

  return {
    rect: cloneRect(baseRect),
    scale: spec.minScale,
  };
}

export function normalizePage8Options(customLayout = {}) {
  return {
    densityMode: customLayout.densityMode === 'fill' ? 'fill' : PAGE8_DEFAULT_OPTIONS.densityMode,
    recoveryMode: customLayout.recoveryMode === 'keep' ? 'keep' : PAGE8_DEFAULT_OPTIONS.recoveryMode,
  };
}

export function normalizePage8ImageBoxes(customLayout = {}) {
  const next = {};
  Object.entries(PAGE8_DEFAULT_IMAGE_BOXES).forEach(([key, defaults]) => {
    const incoming = customLayout.imageBoxes?.[key] || {};
    next[key] = {
      x: clamp(Number.isFinite(incoming.x) ? incoming.x : defaults.x, PAGE8_BOUNDS.x, PAGE8_BOUNDS.x + PAGE8_BOUNDS.width - defaults.width),
      y: clamp(Number.isFinite(incoming.y) ? incoming.y : defaults.y, PAGE8_BOUNDS.y, PAGE8_BOUNDS.y + PAGE8_BOUNDS.height - defaults.height),
      width: defaults.width,
      height: defaults.height,
    };
  });
  return next;
}

export function computePage8ResolvedLayout(customLayout = {}, previousResolved = null) {
  const options = normalizePage8Options(customLayout);
  const imageBoxes = normalizePage8ImageBoxes(customLayout);
  const imageRects = Object.values(imageBoxes).map((box) => cloneRect(box));
  const textBlocks = {};
  const occupied = [...imageRects];

  Object.entries(TEXT_SPECS).forEach(([key, spec]) => {
    const previous = previousResolved?.textBlocks?.[key] || null;
    const resolved = resolveTextBlock(spec, occupied, options, previous);
    textBlocks[key] = {
      ...resolved,
      fontSize: spec.fontSize * resolved.scale,
      lineHeight: spec.lineHeight * resolved.scale,
      maxLines: spec.maxLines,
      align: spec.align,
    };
    occupied.push(expandRect(resolved.rect, options.densityMode === 'fill' ? 0.012 : 0.02));
  });

  return {
    options,
    imageBoxes,
    textBlocks,
  };
}

export function page8RectToPercent(rect) {
  return {
    left: `${rect.x * 100}%`,
    top: `${rect.y * 100}%`,
    width: `${rect.width * 100}%`,
    height: `${rect.height * 100}%`,
  };
}

export function mapPage8RectToFrame(frame, rect) {
  return {
    x: frame.x + (frame.width * rect.x),
    y: frame.y + (frame.height * rect.y),
    width: frame.width * rect.width,
    height: frame.height * rect.height,
    radius: 0,
  };
}
