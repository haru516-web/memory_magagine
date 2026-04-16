import { computePage8ResolvedLayout, mapPage8RectToFrame } from './page8Layout.js';

export const page8Template = {
  id: 'page8',
  label: 'Page 8',
  description: 'Custom free layout',
  async render(ctx, values, files, helpers) {
    const {
      addWrappedText,
      drawFileCover,
      drawSlotPlaceholder,
      defaults,
    } = helpers;

    const frame = {
      x: 84,
      y: 84,
      width: 1240 - 168,
      height: 1754 - 168,
    };

    const resolved = computePage8ResolvedLayout(values.customLayout || {});

    ctx.fillStyle = '#191514';
    ctx.textBaseline = 'top';

    const fileMap = {
      primary: files.primary,
      secondary: files.secondary,
      accent: files.accent,
    };

    for (const [key, box] of Object.entries(resolved.imageBoxes)) {
      const slotRect = mapPage8RectToFrame(frame, box);
      if (fileMap[key]?.file) {
        await drawFileCover(ctx, fileMap[key].file, slotRect, fileMap[key].position);
      } else {
        drawSlotPlaceholder(ctx, slotRect);
      }
    }

    const textValues = {
      headline: values.headline || defaults.headline,
      subhead: values.subhead || defaults.subhead,
      intro: values.intro || defaults.intro,
      body: values.body || defaults.body,
      date: values.date || defaults.date,
      editor: values.editor || defaults.editor,
    };

    Object.entries(resolved.textBlocks).forEach(([key, block]) => {
      const rect = mapPage8RectToFrame(frame, block.rect);
      ctx.textAlign = block.align;
      ctx.font = `${key === 'headline' ? '600' : '500'} ${Math.round(block.fontSize)}px ${key === 'headline' ? '"Cormorant Garamond", "Times New Roman", serif' : '"Noto Sans JP", sans-serif'}`;
      const startX = block.align === 'right' ? rect.x + rect.width : rect.x;
      addWrappedText(ctx, textValues[key], {
        x: startX,
        y: rect.y,
        maxWidth: rect.width,
        lineHeight: block.lineHeight,
        maxLines: block.maxLines,
      });
    });
  },
};
