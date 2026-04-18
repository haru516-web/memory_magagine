import { computePage8ResolvedLayout, mapPage8RectToFrame } from './page8Layout.js';

export const page8Template = {
  id: 'page8',
  label: 'Page 8',
  description: 'Custom free layout',
  async render(ctx, values, files, helpers) {
    const {
      addWrappedText,
      drawFileCover,
    } = helpers;

    const frame = {
      x: 84,
      y: 84,
      width: 1240 - 168,
      height: 1754 - 168,
    };

    const resolved = computePage8ResolvedLayout(values.customLayout || {}, values);

    ctx.fillStyle = '#191514';
    ctx.textBaseline = 'top';

    const fileMap = helpers.page8Files || {};

    for (const box of resolved.imageBoxes) {
      const slotRect = mapPage8RectToFrame(frame, box);
      if (fileMap[box.id]?.file) {
        await drawFileCover(ctx, fileMap[box.id].file, slotRect, fileMap[box.id].position);
      }
    }

    resolved.textBoxes.forEach((box) => {
      const rect = mapPage8RectToFrame(frame, box);
      const fontFamily = box.family === 'serif'
        ? '"Cormorant Garamond", "Times New Roman", serif'
        : '"Noto Sans JP", sans-serif';
      ctx.textAlign = box.align;
      ctx.font = `${box.weight} ${Math.round(frame.width * box.fontSize)}px ${fontFamily}`;
      const startX = box.align === 'right'
        ? rect.x + rect.width
        : box.align === 'center'
          ? rect.x + (rect.width / 2)
          : rect.x;
      addWrappedText(ctx, box.text || '', {
        x: startX,
        y: rect.y,
        maxWidth: rect.width,
        lineHeight: frame.width * box.fontSize * box.lineHeight,
        maxLines: Math.max(1, Math.floor(rect.height / Math.max(12, frame.width * box.fontSize * box.lineHeight))),
      });
    });
  },
};
