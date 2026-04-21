export const page9Template = {
  id: 'page9',
  label: 'Page 9',
  description: 'Template 9',
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

    const primarySlot = {
      x: frame.x + (frame.width * 0.16),
      y: frame.y + (frame.height * 0.28),
      width: frame.width * 0.68,
      height: frame.height * 0.44,
      radius: 0,
    };

    if (files.primary.file) {
      await drawFileCover(ctx, files.primary.file, primarySlot, files.primary.position);
    } else {
      drawSlotPlaceholder(ctx, primarySlot);
    }

    ctx.textAlign = 'center';

    ctx.font = '600 38px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.5,
      y: frame.y + frame.height * 0.15,
      maxWidth: frame.width * 0.18,
      lineHeight: 42,
      maxLines: 2,
    });

    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.5,
      y: frame.y + frame.height * 0.225,
      maxWidth: frame.width * 0.64,
      lineHeight: 36,
      maxLines: 3,
    });

    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.5,
      y: frame.y + frame.height * 0.76,
      maxWidth: frame.width * 0.64,
      lineHeight: 36,
      maxLines: 3,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.5,
      y: frame.y + frame.height * 0.86,
      maxWidth: frame.width * 0.18,
      lineHeight: 32,
      maxLines: 2,
    });

    ctx.textAlign = 'left';
  },
};
