export const page1Template = {
  id: 'page1',
  label: 'Page 1',
  description: 'Template 1',
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

    const secondarySlot = {
      x: frame.x + frame.width * 0.55,
      y: frame.y + frame.height * 0.125,
      width: frame.width * 0.36,
      height: frame.width * 0.36,
      radius: 0,
    };

    const primarySlot = {
      x: frame.x + frame.width * 0.08,
      y: frame.y + frame.height * 0.48,
      width: frame.width * 0.45,
      height: frame.height * 0.39,
      radius: 0,
    };

    if (files.secondary.file) {
      await drawFileCover(ctx, files.secondary.file, secondarySlot, files.secondary.position);
    } else {
      drawSlotPlaceholder(ctx, secondarySlot);
    }

    if (files.primary.file) {
      await drawFileCover(ctx, files.primary.file, primarySlot, files.primary.position);
    } else {
      drawSlotPlaceholder(ctx, primarySlot);
    }

    ctx.font = '600 78px "Cormorant Garamond", "Times New Roman", serif';
    addWrappedText(ctx, values.headline || defaults.headline, {
      x: frame.x + frame.width * 0.07,
      y: frame.y + frame.height * 0.058,
      maxWidth: frame.width * 0.7,
      lineHeight: 82,
      maxLines: 2,
    });

    ctx.font = '500 32px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.subhead || defaults.subhead, {
      x: frame.x + frame.width * 0.07,
      y: frame.y + frame.height * 0.132,
      maxWidth: frame.width * 0.7,
      lineHeight: 42,
      maxLines: 3,
    });

    ctx.font = '500 33px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.intro || defaults.intro, {
      x: frame.x + frame.width * 0.085,
      y: frame.y + frame.height * 0.215,
      maxWidth: frame.width * 0.37,
      lineHeight: 48,
      maxLines: 4,
    });

    ctx.font = '500 31px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.body || defaults.body, {
      x: frame.x + frame.width * 0.585,
      y: frame.y + frame.height * 0.625,
      maxWidth: frame.width * 0.245,
      lineHeight: 46,
      maxLines: 6,
    });

    ctx.font = '500 28px "Noto Sans JP", sans-serif';
    addWrappedText(ctx, values.date || defaults.date, {
      x: frame.x + frame.width * 0.08,
      y: frame.y + frame.height * 0.895,
      maxWidth: frame.width * 0.31,
      lineHeight: 34,
      maxLines: 1,
    });

    const editorText = values.editor || defaults.editor;
    const editorMaxWidth = frame.width * 0.32;
    const editorX = frame.x + frame.width * 0.92 - Math.min(editorMaxWidth, ctx.measureText(editorText).width);

    addWrappedText(ctx, editorText, {
      x: editorX,
      y: frame.y + frame.height * 0.895,
      maxWidth: editorMaxWidth,
      lineHeight: 34,
      maxLines: 1,
    });
  },
};
