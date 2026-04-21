export const page10Template = {
  id: 'page10',
  label: 'Page 10',
  description: 'Template 10',
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

    ctx.fillStyle = '#191514';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';

    const primarySlot = {
      x: frame.x + (frame.width * 0.22),
      y: frame.y + (frame.height * 0.14),
      width: frame.width * 0.56,
      height: frame.height * 0.56,
      radius: 0,
    };

    if (files.primary.file) {
      await drawFileCover(ctx, files.primary.file, primarySlot, files.primary.position);
    } else {
      drawSlotPlaceholder(ctx, primarySlot);
    }

    ctx.font = '600 32px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.04,
      y: frame.y + frame.height * 0.065,
      maxWidth: frame.width * 0.18,
      lineHeight: 38,
      maxLines: 2,
    });

    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.16,
      y: frame.y + frame.height * 0.74,
      maxWidth: frame.width * 0.68,
      lineHeight: 36,
      maxLines: 2,
    });

    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.intro || defaults.intro, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.825,
      maxWidth: frame.width * 0.76,
      lineHeight: 36,
      maxLines: 2,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.91,
      maxWidth: frame.width * 0.22,
      lineHeight: 32,
      maxLines: 3,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.39,
      y: frame.y + frame.height * 0.91,
      maxWidth: frame.width * 0.22,
      lineHeight: 32,
      maxLines: 3,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.editor || defaults.editor, {
      x: frame.x + frame.width * 0.66,
      y: frame.y + frame.height * 0.91,
      maxWidth: frame.width * 0.22,
      lineHeight: 32,
      maxLines: 3,
    });
  },
};
