export const page4Template = {
  id: 'page4',
  label: 'Page 4',
  description: 'Template 4',
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
      x: frame.x + (frame.width * 0.11),
      y: frame.y + (frame.height * 0.59),
      width: frame.width * 0.34,
      height: frame.height * 0.25,
      radius: 0,
    };

    const secondarySlot = {
      x: frame.x + (frame.width * 0.59),
      y: frame.y + (frame.height * 0.13),
      width: frame.width * 0.24,
      height: frame.height * 0.29,
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

    ctx.font = '600 52px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.11,
      y: frame.y + frame.height * 0.11,
      maxWidth: frame.width * 0.28,
      lineHeight: 58,
      maxLines: 2,
    });

    ctx.font = '500 27px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.11,
      y: frame.y + frame.height * 0.205,
      maxWidth: frame.width * 0.28,
      lineHeight: 34,
      maxLines: 2,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.intro || defaults.intro, {
      x: frame.x + frame.width * 0.11,
      y: frame.y + frame.height * 0.295,
      maxWidth: frame.width * 0.28,
      lineHeight: 34,
      maxLines: 4,
    });

    ctx.font = '500 26px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.58,
      y: frame.y + frame.height * 0.55,
      maxWidth: frame.width * 0.2,
      lineHeight: 34,
      maxLines: 4,
    });

    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.58,
      y: frame.y + frame.height * 0.87,
      maxWidth: frame.width * 0.14,
      lineHeight: 30,
      maxLines: 1,
    });

    const editorText = values.editor || defaults.editor;
    const editorMaxWidth = frame.width * 0.15;
    const editorX = frame.x + (frame.width * 0.88) - Math.min(editorMaxWidth, ctx.measureText(editorText).width);

    addWrappedText(ctx, editorText, {
      x: editorX,
      y: frame.y + frame.height * 0.87,
      maxWidth: editorMaxWidth,
      lineHeight: 30,
      maxLines: 1,
    });
  },
};
