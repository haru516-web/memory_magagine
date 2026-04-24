const DESIGN_WIDTH = 1240;
const DESIGN_HEIGHT = 1754;

export const FIXED_TEMPLATE_SAFE_AREA = {
  x: 0.06,
  y: 0.06,
  width: 0.88,
  height: 0.88,
};

export const FIXED_TEMPLATE_SLOT_KEYS = ['primary', 'secondary', 'accent', 'detail'];

const TEXT_KEY_ORDERS = {
  1: ['body'],
  2: ['headline', 'body'],
  3: ['headline', 'intro', 'body'],
  4: ['headline', 'subhead', 'intro', 'body'],
  5: ['headline', 'subhead', 'intro', 'body', 'date'],
  6: ['headline', 'subhead', 'intro', 'body', 'date', 'editor'],
};

function roughAsset(fileName) {
  return new URL(`../../references/template_roughs/${fileName}`, import.meta.url).href;
}

function rawRect(x1, y1, x2, y2) {
  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
}

function pickTextKeys(count) {
  return TEXT_KEY_ORDERS[count] || TEXT_KEY_ORDERS[6];
}

const RAW_FIXED_TEMPLATE_LAYOUTS = {
  page1: {
    roughUrl: roughAsset('3.png'),
    images: [
      rawRect(0.1011, 0.0, 1.0, 0.6285),
      rawRect(0.1004, 0.7890, 0.4038, 0.9520),
    ],
    texts: [
      rawRect(0.2327, 0.6670, 0.8670, 0.7710),
      rawRect(0.5304, 0.8055, 0.8989, 0.9520),
    ],
  },
  page2: {
    roughUrl: roughAsset('4.png'),
    images: [
      rawRect(0.0530, 0.0555, 0.4717, 0.2360),
      rawRect(0.5021, 0.0555, 0.9477, 0.5150),
      rawRect(0.4731, 0.5385, 0.9477, 0.7195),
      rawRect(0.0523, 0.6375, 0.4052, 0.9445),
    ],
    texts: [
      rawRect(0.0530, 0.2600, 0.4717, 0.3670),
      rawRect(0.2348, 0.3905, 0.4717, 0.4975),
      rawRect(0.4349, 0.7395, 0.9470, 0.9445),
    ],
  },
  page3: {
    roughUrl: roughAsset('5.png'),
    images: [
      rawRect(0.0651, 0.0460, 0.4837, 0.2975),
      rawRect(0.1782, 0.3385, 0.4837, 0.5540),
      rawRect(0.5679, 0.7630, 0.9356, 0.9540),
    ],
    texts: [
      rawRect(0.5679, 0.0460, 0.9356, 0.7225),
      rawRect(0.2412, 0.5940, 0.4837, 0.9540),
    ],
  },
  page4: {
    roughUrl: roughAsset('6.png'),
    images: [
      rawRect(0.0877, 0.1605, 0.5071, 0.4120),
      rawRect(0.0877, 0.4420, 0.9123, 0.9365),
    ],
    texts: [
      rawRect(0.0877, 0.0635, 0.4569, 0.1310),
      rawRect(0.5431, 0.2410, 0.9123, 0.4120),
    ],
  },
  page5: {
    roughUrl: roughAsset('7.png'),
    images: [
      rawRect(0.0792, 0.1745, 0.4823, 0.9290),
    ],
    texts: [
      rawRect(0.0785, 0.0710, 0.4823, 0.1385),
      rawRect(0.5184, 0.0710, 0.9215, 0.9290),
    ],
  },
  page6: {
    roughUrl: roughAsset('8.png'),
    images: [
      rawRect(0.1004, 0.5415, 0.4653, 0.6925),
      rawRect(0.5347, 0.5415, 0.8996, 0.6925),
    ],
    texts: [
      rawRect(0.1011, 0.1380, 0.8996, 0.4125),
      rawRect(0.1011, 0.4330, 0.8989, 0.4950),
      rawRect(0.1011, 0.7120, 0.4653, 0.8620),
      rawRect(0.5347, 0.7120, 0.8996, 0.8620),
    ],
  },
  page7: {
    roughUrl: roughAsset('9.png'),
    images: [
      rawRect(0.5354, 0.1065, 0.8777, 0.4700),
      rawRect(0.1004, 0.5300, 0.4427, 0.8935),
    ],
    texts: [
      rawRect(0.1011, 0.1065, 0.4427, 0.4700),
      rawRect(0.5347, 0.5300, 0.8777, 0.8935),
    ],
    masks: [
      {
        type: 'ellipse-cutout',
        rect: rawRect(0.3570, 0.3925, 0.6430, 0.6075),
      },
    ],
  },
  page9: {
    roughUrl: roughAsset('10.png'),
    images: [
      {
        ...rawRect(0.0552, 0.2795, 0.4632, 0.9015),
        shape: 'arch-right',
      },
    ],
    texts: [
      rawRect(0.1011, 0.0975, 0.8996, 0.2440),
      rawRect(0.1952, 0.2800, 0.9455, 0.9025),
    ],
  },
  page10: {
    roughUrl: roughAsset('11.png'),
    images: [
      rawRect(0.0651, 0.0395, 0.3324, 0.9605),
      rawRect(0.3798, 0.2940, 0.9349, 0.5380),
    ],
    texts: [
      rawRect(0.3791, 0.0385, 0.6337, 0.2600),
      rawRect(0.6810, 0.0395, 0.9349, 0.2610),
      rawRect(0.3791, 0.5710, 0.6337, 0.9605),
      rawRect(0.6810, 0.5705, 0.9349, 0.9605),
    ],
  },
};

const normalizedLayoutCache = new Map();

function normalizeLayoutSource(templateId) {
  const source = RAW_FIXED_TEMPLATE_LAYOUTS[templateId];
  if (!source) return null;

  const textKeys = pickTextKeys(source.texts.length);
  const layout = {
    id: templateId,
    roughUrl: source.roughUrl,
    safeArea: { ...FIXED_TEMPLATE_SAFE_AREA },
    images: source.images.map((rect, index) => ({
      key: FIXED_TEMPLATE_SLOT_KEYS[index],
      ...rect,
    })),
    texts: source.texts.map((rect, index) => ({
      fieldKey: textKeys[index],
      ...rect,
      align: rect.align || 'left',
    })),
    masks: (source.masks || []).map((mask) => ({
      ...mask,
      rect: { ...mask.rect },
    })),
  };
  return layout;
}

export function getFixedTemplateLayout(templateId) {
  if (!normalizedLayoutCache.has(templateId)) {
    normalizedLayoutCache.set(templateId, normalizeLayoutSource(templateId));
  }
  return normalizedLayoutCache.get(templateId) || null;
}

export function getFixedTemplateTextMetrics(fieldKey, rect) {
  const boxHeight = rect.height * DESIGN_HEIGHT;
  const sharedFontSize = (28 / 1.5) * 0.5;
  const sharedLineRatio = 1.35;
  const presets = {
    headline: {
      weight: 600,
      fallbackStack: '"Cormorant Garamond", "Times New Roman", serif',
      size: sharedFontSize,
      lineRatio: sharedLineRatio,
    },
    subhead: {
      weight: 500,
      fallbackStack: '"Noto Sans JP", sans-serif',
      size: sharedFontSize,
      lineRatio: sharedLineRatio,
    },
    intro: {
      weight: 500,
      fallbackStack: '"Noto Sans JP", sans-serif',
      size: sharedFontSize,
      lineRatio: sharedLineRatio,
    },
    body: {
      weight: 500,
      fallbackStack: '"Noto Sans JP", sans-serif',
      size: sharedFontSize,
      lineRatio: sharedLineRatio,
    },
    date: {
      weight: 500,
      fallbackStack: '"Noto Sans JP", sans-serif',
      size: sharedFontSize,
      lineRatio: sharedLineRatio,
    },
    editor: {
      weight: 500,
      fallbackStack: '"Noto Sans JP", sans-serif',
      size: sharedFontSize,
      lineRatio: sharedLineRatio,
    },
  };
  const preset = presets[fieldKey] || presets.body;
  const fontSize = preset.size;
  const lineHeight = Math.max(fontSize * preset.lineRatio, fontSize + 4);
  const maxLines = Math.max(1, Math.floor((boxHeight + (fontSize * 0.2)) / lineHeight));
  return {
    fontSize,
    lineHeight,
    maxLines,
    weight: preset.weight,
    fallbackStack: preset.fallbackStack,
  };
}

export async function renderFixedTemplate(ctx, templateId, values, files, helpers) {
  const layout = getFixedTemplateLayout(templateId);
  if (!layout) return;

  const {
    addWrappedText,
    drawFileCover,
    drawSlotPlaceholder,
    defaults,
    getTextFontStack,
  } = helpers;

  ctx.fillStyle = '#191514';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  for (const slot of layout.images) {
    const fileState = files?.[slot.key];
    const rect = {
      x: slot.x * DESIGN_WIDTH,
      y: slot.y * DESIGN_HEIGHT,
      width: slot.width * DESIGN_WIDTH,
      height: slot.height * DESIGN_HEIGHT,
      radius: 0,
      shape: slot.shape || 'rect',
    };
    if (fileState?.file) {
      await drawFileCover(ctx, fileState.file, rect, fileState.position);
    } else {
      drawSlotPlaceholder(ctx, rect);
    }
  }

  for (const block of layout.texts) {
    const text = values?.[block.fieldKey] || defaults?.[block.fieldKey] || '';
    const metrics = getFixedTemplateTextMetrics(block.fieldKey, block);
    ctx.save();
    ctx.textAlign = block.align || 'left';
    ctx.font = `${metrics.weight} ${Math.round(metrics.fontSize)}px ${getTextFontStack(block.fieldKey, metrics.fallbackStack)}`;
    addWrappedText(ctx, text, {
      x: (block.align || 'left') === 'center'
        ? (block.x + (block.width / 2)) * DESIGN_WIDTH
        : block.x * DESIGN_WIDTH,
      y: block.y * DESIGN_HEIGHT,
      maxWidth: block.width * DESIGN_WIDTH,
      lineHeight: metrics.lineHeight,
      maxLines: metrics.maxLines,
    });
    ctx.restore();
  }

  if (layout.masks.length) {
    ctx.save();
    ctx.fillStyle = values.backgroundColor || '#f8f4ee';
    layout.masks.forEach((mask) => {
      const rect = {
        x: mask.rect.x * DESIGN_WIDTH,
        y: mask.rect.y * DESIGN_HEIGHT,
        width: mask.rect.width * DESIGN_WIDTH,
        height: mask.rect.height * DESIGN_HEIGHT,
      };
      if (mask.type === 'ellipse-cutout') {
        ctx.beginPath();
        ctx.ellipse(
          rect.x + (rect.width / 2),
          rect.y + (rect.height / 2),
          rect.width / 2,
          rect.height / 2,
          0,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    });
    ctx.restore();
  }
}
