import { TAG_GROUPS, TAG_GROUP_LABELS } from '../data/tags.js';
import { COMPOSE_TEMPLATES, DEFAULT_COMPOSE_TEMPLATE } from '../templates/index.js';
import { getIcon } from '../components/icons.js';
import { PAGE8_DEFAULT_OPTIONS } from '../templates/page8Layout.js';

const TEMPLATE_COLORS = [
  { value: '#f8f4ee', label: 'Ivory' },
  { value: '#f4e5de', label: 'Blush' },
  { value: '#ece4d8', label: 'Sand' },
  { value: '#e5ece7', label: 'Sage' },
];

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
    <div class="template-carousel template-carousel--color">
      <button class="template-carousel__nav" type="button" data-color-carousel-nav="prev" aria-label="Previous color">&larr;</button>
      <div class="template-carousel__viewport" data-color-carousel>
        <div class="color-chip-track">
          ${TEMPLATE_COLORS.map((color) => `
            <label class="color-chip ${selectedBackground === color.value ? 'is-active' : ''}">
              <input type="radio" name="backgroundColor" value="${color.value}" ${selectedBackground === color.value ? 'checked' : ''} />
              <span class="color-chip__swatch" style="--swatch:${color.value}"></span>
              <span class="color-chip__label">${color.label}</span>
            </label>
          `).join('')}
        </div>
      </div>
      <button class="template-carousel__nav" type="button" data-color-carousel-nav="next" aria-label="Next color">&rarr;</button>
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

function renderPage8Controls(customLayout = {}) {
  const densityMode = customLayout.densityMode || PAGE8_DEFAULT_OPTIONS.densityMode;
  const recoveryMode = customLayout.recoveryMode || PAGE8_DEFAULT_OPTIONS.recoveryMode;

  return `
    <section class="compose-group compose-group--custom" data-custom-template-controls hidden>
      <div class="compose-group__head">
        <h3>Custom Layout</h3>
      </div>
      <div class="custom-layout-options">
        <fieldset class="custom-layout-fieldset">
          <legend>Text Flow</legend>
          <label class="tag-check">
            <input type="radio" name="customDensityMode" value="fill" ${densityMode === 'fill' ? 'checked' : ''} />
            <span>画面全部を埋めたい</span>
          </label>
          <label class="tag-check">
            <input type="radio" name="customDensityMode" value="whitespace" ${densityMode === 'whitespace' ? 'checked' : ''} />
            <span>余白を使いたい</span>
          </label>
        </fieldset>
        <fieldset class="custom-layout-fieldset">
          <legend>Text Recovery</legend>
          <label class="tag-check">
            <input type="radio" name="customRecoveryMode" value="restore" ${recoveryMode === 'restore' ? 'checked' : ''} />
            <span>画像を戻したら文字も戻す</span>
          </label>
          <label class="tag-check">
            <input type="radio" name="customRecoveryMode" value="keep" ${recoveryMode === 'keep' ? 'checked' : ''} />
            <span>その状態を維持する</span>
          </label>
        </fieldset>
        <p class="custom-layout-hint">Page 8 では画像ボックスをページ内で動かすと、文字が被らない位置へ自動で移動し、必要なら文字サイズも小さくなります。</p>
      </div>
    </section>
  `;
}

export function renderCompose(selectedTemplateId = DEFAULT_COMPOSE_TEMPLATE) {
  const options = typeof selectedTemplateId === 'object'
    ? selectedTemplateId
    : { selectedTemplateId };
  const draft = options.draft || {};
  const values = {
    headline: draft.headline || 'A quiet date story',
    subhead: draft.subhead || 'A small title line drifting across the page',
    intro: draft.intro || 'short intro\nshort intro\nshort intro',
    body: draft.body || 'Write a soft paragraph here.\nAdd the memory you want to keep.',
    date: draft.date || '2026.04.14',
    editor: draft.editor || '編集者：haru',
  };
  const selectedId = options.selectedTemplateId || draft.templateId || DEFAULT_COMPOSE_TEMPLATE;
  const selectedBackground = draft.backgroundColor || '#f8f4ee';
  const customLayout = draft.customLayout || PAGE8_DEFAULT_OPTIONS;
  const selectedFixedTags = Array.isArray(draft.fixedTags) ? draft.fixedTags : [];
  const freeTagsValue = Array.isArray(draft.freeTags) ? draft.freeTags.join(', ') : (draft.freeTags || '');
  const submitLabel = options.isEditing ? 'Update Post' : 'Post This Layout';
  const headerMini = options.isEditing ? 'post editor' : 'template editor';
  const headerTitle = options.isEditing ? 'Edit Post' : 'Compose';

  return `
    <section class="page page--compose">
      <header class="page-header page-header--compose">
        <div>
          <p class="page-header__mini">${headerMini}</p>
          <h2 class="page-header__title">${headerTitle}</h2>
        </div>
        <button class="button button--ghost compose-preview-toggle" type="button" data-toggle-compose-preview aria-pressed="false">
          preview
        </button>
      </header>

      <form class="compose-form" id="composeForm">
        <section class="compose-preview">
          <div class="compose-sheet" id="composeSheet" data-template="${selectedId}" style="--sheet-bg:${selectedBackground};">
            <div class="compose-sheet__frame">
              <div class="compose-sheet__outline" aria-hidden="true"></div>
              <div class="compose-sheet__footer-bar" aria-hidden="true"></div>
              <div
                class="compose-sheet__headline compose-editable"
                data-editable="headline"
                data-placeholder="headline"
                data-max-chars="42"
                data-single-line="true"
                contenteditable="true"
                spellcheck="false"
              >${values.headline}</div>
              <div
                class="compose-sheet__subhead compose-editable"
                data-editable="subhead"
                data-placeholder="subhead"
                data-max-chars="56"
                data-single-line="true"
                contenteditable="true"
                spellcheck="false"
              >${values.subhead}</div>
              <div
                class="compose-sheet__notes compose-editable"
                data-editable="intro"
                data-placeholder="notes"
                data-max-chars="72"
                contenteditable="true"
                spellcheck="false"
              >${values.intro}</div>
              ${renderUploadSlot({
                id: 'imageInputSecondary',
                slotClass: 'compose-slot--secondary',
              })}
              ${renderUploadSlot({
                id: 'imageInputAccent',
                slotClass: 'compose-slot--accent',
              })}
              ${renderUploadSlot({
                id: 'imageInputPrimary',
                slotClass: 'compose-slot--primary',
              })}
              <div
                class="compose-sheet__body compose-editable"
                data-editable="body"
                data-placeholder="body"
                data-max-chars="120"
                contenteditable="true"
                spellcheck="false"
              >${values.body}</div>
              <div
                class="compose-sheet__date compose-editable"
                data-editable="date"
                data-placeholder="date"
                data-max-chars="18"
                data-single-line="true"
                contenteditable="true"
                spellcheck="false"
              >${values.date}</div>
              <div
                class="compose-sheet__editor compose-editable"
                data-editable="editor"
                data-placeholder="editor"
                data-max-chars="24"
                data-single-line="true"
                contenteditable="true"
                spellcheck="false"
              >${values.editor}</div>
            </div>
          </div>
        </section>

        <section class="compose-group">
          <div class="compose-group__head">
            <h3>Template</h3>
          </div>
          ${renderTemplatePicker(selectedId)}
        </section>

        <section class="compose-group">
          <div class="compose-group__head">
            <h3>Background</h3>
          </div>
          ${renderColorPicker(selectedBackground)}
        </section>

        ${renderPage8Controls(customLayout)}

        <section class="compose-disclosure">
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

        <button class="button button--primary button--full" type="submit">${submitLabel}</button>
      </form>
    </section>
  `;
}
