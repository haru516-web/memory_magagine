export const page7Template = {
  id: 'page7',
  label: 'Page 7',
  description: 'Template 7',
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
      x: frame.x + (frame.width * 0.12),
      y: frame.y + (frame.height * 0.15),
      width: frame.width * 0.3,
      height: frame.height * 0.18,
      radius: 18,
    };

    const secondarySlot = {
      x: frame.x + (frame.width * 0.56),
      y: frame.y + (frame.height * 0.48),
      width: frame.width * 0.3,
      height: frame.height * 0.18,
      radius: 18,
    };

    const accentSlot = {
      x: frame.x + (frame.width * 0.12),
      y: frame.y + (frame.height * 0.75),
      width: frame.width * 0.3,
      height: frame.height * 0.18,
      radius: 18,
    };

    if (files.primary.file) {
      await drawFileCover(ctx, files.primary.file, primarySlot, files.primary.position);
    } else {
      drawSlotPlaceholder(ctx, primarySlot);
    }

    if (files.secondary.file) {
      await drawFileCover(ctx, files.secondary.file, secondarySlot, files.secondary.position);
    } else {
      drawSlotPlaceholder(ctx, secondarySlot);
    }

    if (files.accent?.file) {
      await drawFileCover(ctx, files.accent.file, accentSlot, files.accent.position);
    } else {
      drawSlotPlaceholder(ctx, accentSlot);
    }

    ctx.font = '600 44px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.58,
      y: frame.y + frame.height * 0.16,
      maxWidth: frame.width * 0.19,
      lineHeight: 48,
      maxLines: 2,
    });

    ctx.font = '500 25px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.58,
      y: frame.y + frame.height * 0.245,
      maxWidth: frame.width * 0.19,
      lineHeight: 32,
      maxLines: 3,
    });

    ctx.font = '500 25px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.intro || defaults.intro, {
      x: frame.x + frame.width * 0.15,
      y: frame.y + frame.height * 0.41,
      maxWidth: frame.width * 0.2,
      lineHeight: 32,
      maxLines: 4,
    });

    ctx.font = '500 25px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.59,
      y: frame.y + frame.height * 0.77,
      maxWidth: frame.width * 0.19,
      lineHeight: 32,
      maxLines: 4,
    });

    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.58,
      y: frame.y + frame.height * 0.91,
      maxWidth: frame.width * 0.12,
      lineHeight: 30,
      maxLines: 1,
    });

    const editorText = values.editor || defaults.editor;
    const editorMaxWidth = frame.width * 0.14;
    const editorX = frame.x + (frame.width * 0.88) - Math.min(editorMaxWidth, ctx.measureText(editorText).width);

    addWrappedText(ctx, editorText, {
      x: editorX,
      y: frame.y + frame.height * 0.91,
      maxWidth: editorMaxWidth,
      lineHeight: 30,
      maxLines: 1,
    });
  },
};
