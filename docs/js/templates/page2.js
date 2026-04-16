export const page2Template = {
  id: 'page2',
  label: 'Page 2',
  description: 'Template 2',
  async render(ctx, values, files, helpers) {
    const {
      addWrappedText,
      clipRoundedRect,
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
      x: frame.x + (frame.width * 0.138),
      y: frame.y + (frame.height * 0.142),
      width: frame.width * 0.724,
      height: frame.height * 0.374,
      radius: 0,
    };

    if (files.primary.file) {
      await drawFileCover(ctx, files.primary.file, primarySlot, files.primary.position);
    } else {
      drawSlotPlaceholder(ctx, primarySlot);
    }

    ctx.font = '600 60px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.142,
      y: frame.y + frame.height * 0.565,
      maxWidth: frame.width * 0.66,
      lineHeight: 66,
      maxLines: 2,
    });

    ctx.font = '500 30px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.142,
      y: frame.y + frame.height * 0.634,
      maxWidth: frame.width * 0.68,
      lineHeight: 40,
      maxLines: 2,
    });

    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.intro || defaults.intro, {
      x: frame.x + frame.width * 0.142,
      y: frame.y + frame.height * 0.698,
      maxWidth: frame.width * 0.66,
      lineHeight: 38,
      maxLines: 4,
    });

    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.142,
      y: frame.y + frame.height * 0.792,
      maxWidth: frame.width * 0.66,
      lineHeight: 38,
      maxLines: 4,
    });

    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.142,
      y: frame.y + frame.height * 0.948,
      maxWidth: frame.width * 0.28,
      lineHeight: 30,
      maxLines: 1,
    });

    const editorText = values.editor || defaults.editor;
    ctx.font = '500 24px "Noto Sans JP", sans-serif';
    const editorMaxWidth = frame.width * 0.28;
    const editorX = frame.x + (frame.width * 0.86) - Math.min(editorMaxWidth, ctx.measureText(editorText).width);

    addWrappedText(ctx, editorText, {
      x: editorX,
      y: frame.y + frame.height * 0.948,
      maxWidth: editorMaxWidth,
      lineHeight: 30,
      maxLines: 1,
    });
  },
};
