export const page6Template = {
  id: 'page6',
  label: 'Page 6',
  description: 'Template 6',
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
      x: frame.x + (frame.width * 0.2),
      y: frame.y + (frame.height * 0.30),
      width: frame.width * 0.46,
      height: frame.height * 0.36,
      radius: 20,
    };

    const secondarySlot = {
      x: frame.x + (frame.width * 0.12),
      y: frame.y + (frame.height * 0.075),
      width: frame.width * 0.2,
      height: frame.height * 0.14,
      radius: 24,
    };

    const accentSlot = {
      x: frame.x + (frame.width * 0.69),
      y: frame.y + (frame.height * 0.80),
      width: frame.width * 0.15,
      height: frame.height * 0.1,
      radius: 22,
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

    ctx.font = '600 48px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.5,
      y: frame.y + frame.height * 0.10,
      maxWidth: frame.width * 0.2,
      lineHeight: 52,
      maxLines: 2,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.5,
      y: frame.y + frame.height * 0.18,
      maxWidth: frame.width * 0.2,
      lineHeight: 34,
      maxLines: 3,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.intro || defaults.intro, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.74,
      maxWidth: frame.width * 0.22,
      lineHeight: 34,
      maxLines: 4,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.44,
      y: frame.y + frame.height * 0.74,
      maxWidth: frame.width * 0.14,
      lineHeight: 34,
      maxLines: 4,
    });

    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.905,
      maxWidth: frame.width * 0.16,
      lineHeight: 30,
      maxLines: 1,
    });

    const editorText = values.editor || defaults.editor;
    const editorMaxWidth = frame.width * 0.14;
    const editorX = frame.x + (frame.width * 0.88) - Math.min(editorMaxWidth, ctx.measureText(editorText).width);

    addWrappedText(ctx, editorText, {
      x: editorX,
      y: frame.y + frame.height * 0.905,
      maxWidth: editorMaxWidth,
      lineHeight: 30,
      maxLines: 1,
    });
  },
};
