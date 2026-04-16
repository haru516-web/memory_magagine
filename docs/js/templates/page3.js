export const page3Template = {
  id: 'page3',
  label: 'Page 3',
  description: 'Template 3',
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
      x: frame.x + (frame.width * 0.14),
      y: frame.y + (frame.height * 0.22),
      width: frame.width * 0.58,
      height: frame.height * 0.36,
      radius: 0,
    };

    const secondarySlot = {
      x: frame.x + (frame.width * 0.74),
      y: frame.y + (frame.height * 0.72),
      width: frame.width * 0.14,
      height: frame.height * 0.15,
      radius: 0,
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

    ctx.font = '600 58px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.075,
      maxWidth: frame.width * 0.66,
      lineHeight: 64,
      maxLines: 2,
    });

    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.145,
      maxWidth: frame.width * 0.66,
      lineHeight: 36,
      maxLines: 2,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.intro || defaults.intro, {
      x: frame.x + frame.width * 0.13,
      y: frame.y + frame.height * 0.675,
      maxWidth: frame.width * 0.32,
      lineHeight: 34,
      maxLines: 4,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.13,
      y: frame.y + frame.height * 0.79,
      maxWidth: frame.width * 0.32,
      lineHeight: 34,
      maxLines: 3,
    });

    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.13,
      y: frame.y + frame.height * 0.915,
      maxWidth: frame.width * 0.2,
      lineHeight: 30,
      maxLines: 1,
    });

    const editorText = values.editor || defaults.editor;
    const editorMaxWidth = frame.width * 0.16;
    const editorX = frame.x + (frame.width * 0.9) - Math.min(editorMaxWidth, ctx.measureText(editorText).width);

    addWrappedText(ctx, editorText, {
      x: editorX,
      y: frame.y + frame.height * 0.915,
      maxWidth: editorMaxWidth,
      lineHeight: 30,
      maxLines: 1,
    });
  },
};
