import { TAG_GROUPS, TAG_GROUP_LABELS } from '../data/tags.js';
import { COMPOSE_TEMPLATES, DEFAULT_COMPOSE_TEMPLATE } from '../templates/index.js';
import { getIcon } from '../components/icons.js';

const TEMPLATE_COLORS = [
  { value: '#f8f4ee', label: 'Ivory' },
  { value: '#f4e5de', label: 'Blush' },
  { value: '#ece4d8', label: 'Sand' },
  { value: '#e5ece7', label: 'Sage' },
];

function renderComposeBackButton(actionAttr) {
  return `
    <button class="button button--ghost page-back page-back--icon" type="button" ${actionAttr} aria-label="Back">
      ${getIcon('returnLeft')}
    </button>
  `;
}

function renderComposeAddPopoverButton() {
  return `
    <div class="compose-header-add" data-pretext-add>
      <button
        class="button button--ghost page-back page-back--icon compose-add-button"
        type="button"
        data-pretext-add-toggle
        aria-label="Add layout element"
        aria-haspopup="true"
        aria-expanded="false"
      >
        ${getIcon('compose')}
      </button>
      <div class="compose-header-add__popover" data-pretext-add-popover hidden>
        <div class="compose-header-add__row">
          <span class="compose-header-add__label">Title</span>
          <div class="compose-header-add__align">
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="title" data-pretext-add-align="left" aria-label="Add left aligned title">${getIcon('alignLeft')}</button>
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="title" data-pretext-add-align="center" aria-label="Add centered title">${getIcon('alignCenter')}</button>
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="title" data-pretext-add-align="right" aria-label="Add right aligned title">${getIcon('alignRight')}</button>
          </div>
        </div>
        <div class="compose-header-add__row">
          <span class="compose-header-add__label">Body</span>
          <div class="compose-header-add__align">
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="body" data-pretext-add-align="left" aria-label="Add left aligned body">${getIcon('alignLeft')}</button>
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="body" data-pretext-add-align="center" aria-label="Add centered body">${getIcon('alignCenter')}</button>
            <button type="button" class="compose-header-add__option" data-pretext-add-kind="body" data-pretext-add-align="right" aria-label="Add right aligned body">${getIcon('alignRight')}</button>
          </div>
        </div>
        <div class="compose-header-add__row compose-header-add__row--image">
          <span class="compose-header-add__label">Image</span>
          <button type="button" class="compose-header-add__image" data-pretext-add-kind="image">
            ${getIcon('image')}
            <span>Image</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderComposeDeleteButton() {
  return `
    <button
      class="button button--ghost page-back page-back--icon compose-delete-button"
      type="button"
      data-pretext-delete
      aria-label="Delete selected element"
    >
      ${getIcon('trash')}
    </button>
  `;
}

function renderComposeTagsButton(isEditing) {
  return `
    <button class="button button--primary compose-header-tags-button" type="button" data-compose-stage-nav="tags">
      ${isEditing ? 'Update Tags' : 'タグへ進む'}
    </button>
  `;
}

function renderGroup(groupKey, options, selectedTags = []) {
  return `
    <section class="compose-group compose-group--tags">
      <div class="compose-group__head">
        <h3>${TAG_GROUP_LABELS[groupKey]}</h3>
      </div>
      <div class="tag-select-grid">
        ${options.map((tag) => `
          <label class="tag-check">
            <input type="checkbox" name="fixedTags" value="${tag}" ${selectedTags.includes(tag) ? 'checked' : ''} />
            <span>${tag}</span>
          </label>
        `).join('')}
      </div>
    </section>
  `;
}

function renderTemplatePicker(selectedTemplateId = DEFAULT_COMPOSE_TEMPLATE) {
  return `
    <div class="template-carousel">
      <button class="template-carousel__nav" type="button" data-template-carousel-nav="prev" aria-label="Previous template">&larr;</button>
      <div class="template-carousel__viewport" data-template-carousel>
        <div class="template-thumb-track">
          ${COMPOSE_TEMPLATES.map((template) => `
            <label class="template-thumb ${selectedTemplateId === template.id ? 'is-active' : ''}">
              <input type="radio" name="templateId" value="${template.id}" ${selectedTemplateId === template.id ? 'checked' : ''} />
              <span class="template-thumb__preview template-option__preview template-option__preview--${template.id}" aria-hidden="true"></span>
            </label>
          `).join('')}
        </div>
      </div>
      <button class="template-carousel__nav" type="button" data-template-carousel-nav="next" aria-label="Next template">&rarr;</button>
    </div>
  `;
}

function renderColorPicker(selectedBackground) {
  return `
    <div class="color-picker-inline">
      <div class="color-chip-track color-chip-track--inline" data-color-carousel>
        ${TEMPLATE_COLORS.map((color) => `
          <label class="color-chip color-chip--inline ${selectedBackground === color.value ? 'is-active' : ''}" title="${color.label}">
            <input type="radio" name="backgroundColor" value="${color.value}" ${selectedBackground === color.value ? 'checked' : ''} />
            <span class="color-chip__swatch" style="--swatch:${color.value}"></span>
            <span class="color-chip__label">${color.label}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `;
}

function renderUploadSlot({ id, slotClass }) {
  return `
    <div class="compose-slot ${slotClass}" data-slot="${id}">
      <input class="field__file" id="${id}" type="file" accept="image/*" />
      <label class="compose-slot__surface" for="${id}">
        <div class="compose-slot__image" data-slot-image="${id}" hidden></div>
        <div class="compose-slot__placeholder" data-slot-placeholder="${id}">
          <span class="compose-slot__plus">${getIcon('compose')}</span>
        </div>
      </label>
      <button class="compose-slot__remove" type="button" data-slot-remove="${id}" hidden aria-label="remove image">&times;</button>
    </div>
  `;
}

function renderStaticSlot(slotClass) {
  return `
    <div class="compose-slot ${slotClass}">
      <div class="compose-slot__surface">
        <div class="compose-slot__placeholder">
          <span class="compose-slot__plus">${getIcon('compose')}</span>
        </div>
      </div>
    </div>
  `;
}

function renderComposeSheet(values, selectedId, selectedBackground, options = {}) {
  const { editable = false, interactiveSlots = false } = options;
  const isCustomTemplate = selectedId === 'page8';
  const baseClass = editable ? 'compose-sheet' : 'compose-sheet compose-sheet--locked';
  const sheetClass = isCustomTemplate ? `${baseClass} compose-sheet--custom` : baseClass;
  const editableAttr = editable ? 'true' : 'false';

  if (isCustomTemplate) {
    return `
      <div class="${sheetClass}" id="composeSheet" data-template="${selectedId}" style="--sheet-bg:${selectedBackground};">
        <div class="compose-sheet__frame">
          <div class="compose-custom-canvas" data-custom-canvas hidden></div>
        </div>
      </div>
    `;
  }

  return `
    <div class="${sheetClass}" id="composeSheet" data-template="${selectedId}" style="--sheet-bg:${selectedBackground};">
      <div class="compose-sheet__frame">
        <div class="compose-sheet__outline" aria-hidden="true"></div>
        <div class="compose-sheet__footer-bar" aria-hidden="true"></div>
        <div class="compose-custom-canvas" data-custom-canvas hidden></div>
        <div
          class="compose-sheet__headline compose-editable"
          data-editable="headline"
          data-placeholder="headline"
          data-max-chars="42"
          data-single-line="true"
          contenteditable="${editableAttr}"
          spellcheck="false"
        >${values.headline}</div>
        <div
          class="compose-sheet__subhead compose-editable"
          data-editable="subhead"
          data-placeholder="subhead"
          data-max-chars="56"
          data-single-line="true"
          contenteditable="${editableAttr}"
          spellcheck="false"
        >${values.subhead}</div>
        <div
          class="compose-sheet__notes compose-editable"
          data-editable="intro"
          data-placeholder="notes"
          data-max-chars="72"
          contenteditable="${editableAttr}"
          spellcheck="false"
        >${values.intro}</div>
        ${interactiveSlots
          ? renderUploadSlot({ id: 'imageInputSecondary', slotClass: 'compose-slot--secondary' })
          : renderStaticSlot('compose-slot--secondary')}
        ${interactiveSlots
          ? renderUploadSlot({ id: 'imageInputAccent', slotClass: 'compose-slot--accent' })
          : renderStaticSlot('compose-slot--accent')}
        ${interactiveSlots
          ? renderUploadSlot({ id: 'imageInputPrimary', slotClass: 'compose-slot--primary' })
          : renderStaticSlot('compose-slot--primary')}
        <div
          class="compose-sheet__body compose-editable"
          data-editable="body"
          data-placeholder="body"
          data-max-chars="120"
          contenteditable="${editableAttr}"
          spellcheck="false"
        >${values.body}</div>
        <div
          class="compose-sheet__date compose-editable"
          data-editable="date"
          data-placeholder="date"
          data-max-chars="18"
          data-single-line="true"
          contenteditable="${editableAttr}"
          spellcheck="false"
        >${values.date}</div>
        <div
          class="compose-sheet__editor compose-editable"
          data-editable="editor"
          data-placeholder="editor"
          data-max-chars="24"
          data-single-line="true"
          contenteditable="${editableAttr}"
          spellcheck="false"
        >${values.editor}</div>
      </div>
    </div>
  `;
}

function renderTagPanel(selectedFixedTags, freeTagsValue) {
  return `
    <section class="compose-disclosure compose-disclosure--inline">
      <button class="compose-disclosure__button" type="button" data-toggle-compose-tags aria-expanded="false">
        タグ
      </button>
      <div class="compose-disclosure__panel" data-compose-tags hidden>
        ${Object.entries(TAG_GROUPS).map(([groupKey, options]) => renderGroup(groupKey, options, selectedFixedTags)).join('')}
        <section class="compose-group compose-group--tags">
          <div class="compose-group__head">
            <h3>Free Tags</h3>
          </div>
          <label class="field">
            <input class="field__input" type="text" name="freeTags" placeholder="cafe, spring, film" value="${freeTagsValue}" />
          </label>
        </section>
      </div>
    </section>
  `;
}

function renderTagsStagePanel(selectedFixedTags, freeTagsValue) {
  return `
    <section class="compose-group compose-group--tags-stage">
      <div class="compose-group__head">
        <h3>Tags</h3>
      </div>
      ${Object.entries(TAG_GROUPS).map(([groupKey, options]) => renderGroup(groupKey, options, selectedFixedTags)).join('')}
      <section class="compose-group compose-group--tags compose-group--tags-nested">
        <div class="compose-group__head">
          <h3>Free Tags</h3>
        </div>
        <label class="field">
          <input class="field__input" type="text" name="freeTags" placeholder="cafe, spring, film" value="${freeTagsValue}" />
        </label>
      </section>
    </section>
  `;
}

function renderSelectionScreen({ values, selectedId, selectedBackground, headerMini, headerTitle }) {
  return `
    <section class="page page--compose page--compose--select" data-compose-stage="select">
      <header class="page-header page-header--with-back page-header--compose">
        ${renderComposeBackButton('data-close-compose')}
        <div>
          <p class="page-header__mini">${headerMini}</p>
          <h2 class="page-header__title">${headerTitle}</h2>
        </div>
      </header>

      <section class="compose-select-shell">
        <section class="compose-preview compose-preview--select">
          ${renderComposeSheet(values, selectedId, selectedBackground, { editable: false, interactiveSlots: false })}
        </section>

        <section class="compose-group compose-group--template compose-group--template-select">
          <div class="compose-group__head compose-group__head--template compose-group__head--template-select">
            <h3>Template</h3>
            ${renderColorPicker(selectedBackground)}
            <button class="button button--primary compose-confirm-button" type="button" data-compose-stage-nav="edit">編集する</button>
          </div>
          ${renderTemplatePicker(selectedId)}
        </section>
      </section>
    </section>
  `;
}

function renderEditorScreen({ values, selectedId, selectedBackground, isEditing, headerMini, headerTitle }) {
  return `
    <section class="page page--compose page--compose--edit ${selectedId === 'page8' ? 'page--compose--edit--page8' : ''}" data-compose-stage="edit">
      <header class="page-header page-header--with-back page-header--compose">
        <div class="page-header__actions page-header__actions--compose">
          ${renderComposeBackButton('data-compose-stage-nav="select"')}
          ${selectedId === 'page8' ? renderComposeAddPopoverButton() : ''}
          ${selectedId === 'page8' ? renderComposeDeleteButton() : ''}
          ${selectedId === 'page8' ? renderComposeTagsButton(isEditing) : ''}
        </div>
        <div>
          <p class="page-header__mini">${headerMini}</p>
          <h2 class="page-header__title">${headerTitle}</h2>
        </div>
      </header>

      <form class="compose-form compose-form--edit" id="composeForm">
        <section class="compose-editor compose-editor--focus ${selectedId === 'page8' ? 'compose-editor--page8' : ''}">
          <section class="compose-preview compose-preview--editor ${selectedId === 'page8' ? 'compose-preview--page8' : ''}">
            ${selectedId === 'page8'
              ? `
                <div class="compose-pretext-host compose-pretext-host--page8" data-compose-pretext-host></div>
              `
              : renderComposeSheet(values, selectedId, selectedBackground, { editable: true, interactiveSlots: true })}
          </section>
        </section>
        ${selectedId === 'page8' ? '' : `
          <div class="compose-flow-actions compose-flow-actions--editor">
            <button class="button button--primary compose-submit-button" type="button" data-compose-stage-nav="tags">${isEditing ? 'Update Tags' : 'タグへ進む'}</button>
          </div>
        `}
        <section class="compose-custom-tools" data-custom-template-controls hidden ${selectedId === 'page8' ? 'style="display:none"' : ''}>
          <div class="compose-custom-tools__header">
            <p class="compose-custom-tools__eyebrow">Pretext-inspired editorial controls</p>
            <h3 class="compose-custom-tools__title">Custom Layout</h3>
            <p class="compose-custom-tools__hint">画像はフレーム移動とクロップを切替、文字はタイトル/本文プリセットと行間・余白を調整できます。</p>
          </div>
          <div class="compose-custom-tools__buttons">
            <button class="button button--ghost" type="button" data-custom-add="image">画像追加</button>
            <button class="button button--ghost" type="button" data-custom-add="text">文字追加</button>
          </div>
          <section class="compose-custom-inspector" data-custom-inspector></section>
        </section>
      </form>
    </section>
  `;
}

function renderTagScreen({ selectedId, selectedBackground, selectedFixedTags, freeTagsValue, submitLabel, isEditing, headerMini, headerTitle }) {
  return `
    <section class="page page--compose page--compose--tags" data-compose-stage="tags">
      <header class="page-header page-header--with-back page-header--compose">
        ${renderComposeBackButton('data-compose-stage-nav="edit"')}
        <div>
          <p class="page-header__mini">${headerMini}</p>
          <h2 class="page-header__title">${headerTitle}</h2>
        </div>
      </header>

      <form class="compose-form compose-form--tags" id="composeForm">
        <section class="compose-tag-stage">
          ${renderTagsStagePanel(selectedFixedTags, freeTagsValue)}
        </section>
        <div class="compose-flow-actions">
          <button class="button button--ghost compose-draft-button" type="button" data-save-compose-draft>Save Draft</button>
          <button class="button button--primary compose-submit-button" type="submit">${submitLabel}</button>
        </div>
      </form>
    </section>
  `;
}

export function renderCompose(selectedTemplateId = DEFAULT_COMPOSE_TEMPLATE) {
  const options = typeof selectedTemplateId === 'object'
    ? selectedTemplateId
    : { selectedTemplateId };
  const draft = options.draft || {};
  const values = {
    headline: draft.headline || 'text',
    subhead: draft.subhead || 'text',
    intro: draft.intro || 'text',
    body: draft.body || 'text',
    date: draft.date || 'text',
    editor: draft.editor || '編集者：haru',
  };
  const selectedId = options.selectedTemplateId || draft.templateId || DEFAULT_COMPOSE_TEMPLATE;
  const selectedBackground = options.selectedBackground || draft.backgroundColor || '#f8f4ee';
  const selectedFixedTags = Array.isArray(draft.fixedTags) ? draft.fixedTags : [];
  const freeTagsValue = Array.isArray(draft.freeTags) ? draft.freeTags.join(', ') : (draft.freeTags || '');
  const submitLabel = options.isEditing ? 'Update Post' : 'Post This Layout';
  const headerMini = options.isEditing ? 'post editor' : 'template editor';
  const headerTitle = options.isEditing ? 'Edit Post' : 'Compose';
  const stage = options.stage || 'select';

  if (stage === 'select') {
    return renderSelectionScreen({
      values,
      selectedId,
      selectedBackground,
      headerMini,
      headerTitle,
    });
  }

  if (stage === 'tags') {
    return renderTagScreen({
      selectedId,
      selectedBackground,
      selectedFixedTags,
      freeTagsValue,
      submitLabel,
      isEditing: Boolean(options.isEditing),
      headerMini,
      headerTitle,
    });
  }

  return renderEditorScreen({
    values,
    selectedId,
    selectedBackground,
    isEditing: Boolean(options.isEditing),
    headerMini,
    headerTitle,
  });
}
