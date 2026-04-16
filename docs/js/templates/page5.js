export const page5Template = {
  id: 'page5',
  label: 'Page 5',
  description: 'Template 5',
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
      x: frame.x + (frame.width * 0.49),
      y: frame.y + (frame.height * 0.12),
      width: frame.width * 0.34,
      height: frame.height * 0.42,
      radius: 0,
    };

    const secondarySlot = {
      x: frame.x + (frame.width * 0.12),
      y: frame.y + (frame.height * 0.74),
      width: frame.width * 0.25,
      height: frame.height * 0.16,
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

    ctx.font = '600 50px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.12,
      maxWidth: frame.width * 0.21,
      lineHeight: 54,
      maxLines: 3,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.265,
      maxWidth: frame.width * 0.21,
      lineHeight: 34,
      maxLines: 3,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.intro || defaults.intro, {
      x: frame.x + frame.width * 0.12,
      y: frame.y + frame.height * 0.42,
      maxWidth: frame.width * 0.21,
      lineHeight: 34,
      maxLines: 5,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.51,
      y: frame.y + frame.height * 0.69,
      maxWidth: frame.width * 0.24,
      lineHeight: 34,
      maxLines: 4,
    });

    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.51,
      y: frame.y + frame.height * 0.89,
      maxWidth: frame.width * 0.14,
      lineHeight: 30,
      maxLines: 1,
    });

    const editorText = values.editor || defaults.editor;
    const editorMaxWidth = frame.width * 0.15;
    const editorX = frame.x + (frame.width * 0.88) - Math.min(editorMaxWidth, ctx.measureText(editorText).width);

    addWrappedText(ctx, editorText, {
      x: editorX,
      y: frame.y + frame.height * 0.89,
      maxWidth: editorMaxWidth,
      lineHeight: 30,
      maxLines: 1,
    });
  },
};
