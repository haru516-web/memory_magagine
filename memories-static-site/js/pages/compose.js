import { TAG_GROUPS, TAG_GROUP_LABELS } from '../data/tags.js';
import { COMPOSE_TEMPLATES, DEFAULT_COMPOSE_TEMPLATE } from '../templates/index.js';
import { getIcon } from '../components/icons.js';

const TEMPLATE_COLORS = [
  { value: '#f8f4ee', label: 'Ivory' },
  { value: '#f4e5de', label: 'Blush' },
  { value: '#ece4d8', label: 'Sand' },
  { value: '#e5ece7', label: 'Sage' },
];

function renderGroup(groupKey, options) {
  return `
    <section class="compose-group compose-group--tags">
      <div class="compose-group__head">
        <h3>${TAG_GROUP_LABELS[groupKey]}</h3>
      </div>
      <div class="tag-select-grid">
        ${options.map((tag) => `
          <label class="tag-check">
            <input type="checkbox" name="fixedTags" value="${tag}" />
            <span>${tag}</span>
          </label>
        `).join('')}
      </div>
    </section>
  `;
}

function renderPalette() {
  return TEMPLATE_COLORS.map((color, index) => `
    <label class="color-chip">
      <input type="radio" name="backgroundColor" value="${color.value}" ${index === 0 ? 'checked' : ''} />
      <span class="color-chip__swatch" style="--swatch:${color.value}"></span>
      <span class="color-chip__label">${color.label}</span>
    </label>
  `).join('');
}

function renderTemplatePicker(selectedTemplateId = DEFAULT_COMPOSE_TEMPLATE) {
  return COMPOSE_TEMPLATES.map((template) => `
    <label class="template-option">
      <input type="radio" name="templateId" value="${template.id}" ${selectedTemplateId === template.id ? 'checked' : ''} />
      <span class="template-option__preview template-option__preview--${template.id}" aria-hidden="true"></span>
      <span class="template-option__body">
        <strong class="template-option__title">${template.label}</strong>
        <span class="template-option__copy">${template.description}</span>
      </span>
    </label>
  `).join('');
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

export function renderCompose(selectedTemplateId = DEFAULT_COMPOSE_TEMPLATE) {
  return `
    <section class="page page--compose">
      <header class="page-header page-header--compose">
        <div>
          <p class="page-header__mini">template editor</p>
          <h2 class="page-header__title">Compose</h2>
        </div>
        <button class="button button--ghost compose-preview-toggle" type="button" data-toggle-compose-preview aria-pressed="false">
          preview
        </button>
      </header>

      <form class="compose-form" id="composeForm">
        <section class="compose-preview">
          <div class="compose-sheet" id="composeSheet" data-template="${selectedTemplateId}" style="--sheet-bg:#f8f4ee;">
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
              >A quiet date story</div>
              <div
                class="compose-sheet__subhead compose-editable"
                data-editable="subhead"
                data-placeholder="subhead"
                data-max-chars="56"
                data-single-line="true"
                contenteditable="true"
                spellcheck="false"
              >A small title line drifting across the page</div>
              <div
                class="compose-sheet__notes compose-editable"
                data-editable="intro"
                data-placeholder="notes"
                data-max-chars="72"
                contenteditable="true"
                spellcheck="false"
              >short intro
short intro
short intro</div>
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
              >Write a soft paragraph here.
Add the memory you want to keep.</div>
              <div
                class="compose-sheet__date compose-editable"
                data-editable="date"
                data-placeholder="date"
                data-max-chars="18"
                data-single-line="true"
                contenteditable="true"
                spellcheck="false"
              >2026.04.14</div>
              <div
                class="compose-sheet__editor compose-editable"
                data-editable="editor"
                data-placeholder="editor"
                data-max-chars="24"
                data-single-line="true"
                contenteditable="true"
                spellcheck="false"
              >編集者：haru</div>
            </div>
          </div>
        </section>

        <section class="compose-group">
          <div class="compose-group__head">
            <h3>Template</h3>
          </div>
          <div class="template-option-grid">
            ${renderTemplatePicker(selectedTemplateId)}
          </div>
        </section>

        <section class="compose-group">
          <div class="compose-group__head">
            <h3>Background</h3>
          </div>
          <div class="color-chip-grid">
            ${renderPalette()}
          </div>
        </section>

        <section class="compose-disclosure">
          <button class="compose-disclosure__button" type="button" data-toggle-compose-tags aria-expanded="false">
            タグ
          </button>
          <div class="compose-disclosure__panel" data-compose-tags hidden>
            ${Object.entries(TAG_GROUPS).map(([groupKey, options]) => renderGroup(groupKey, options)).join('')}
            <section class="compose-group compose-group--tags">
              <div class="compose-group__head">
                <h3>Free Tags</h3>
              </div>
              <label class="field">
                <input class="field__input" type="text" name="freeTags" placeholder="cafe, spring, film" />
              </label>
            </section>
          </div>
        </section>

        <button class="button button--primary button--full" type="submit">Post This Layout</button>
      </form>
    </section>
  `;
}
