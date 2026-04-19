import type { ChangeEvent } from 'react'
import type { EditorBox, ImageBox, TextBox } from '../types'

type InspectorProps = {
  selected: EditorBox | null
  cropMode: boolean
  onUpdateText: (patch: Partial<TextBox['data']>) => void
  onUpdateImage: (patch: Partial<ImageBox['data']>) => void
  onConvertKind: (kind: 'title' | 'body') => void
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void
}

export function Inspector({ selected, cropMode, onUpdateText, onUpdateImage, onConvertKind, onUpload }: InspectorProps) {
  return (
    <aside className="inspector">
      <div className="inspector__eyebrow">Pretext-inspired editorial controls</div>
      <h2 className="inspector__title">Inspector</h2>
      {!selected ? (
        <p className="inspector__empty">
          ボックスを選択すると、ここで本文・タイトル・画像の設定を編集できます。
        </p>
      ) : selected.kind === 'image' ? (
        <div className="inspector__section">
          <div className="inspector__label">Image box</div>
          <label className="inspector__stack">
            <span>Upload image</span>
            <input type="file" accept="image/*" onChange={onUpload} />
          </label>
          <label className="inspector__stack">
            <span>Zoom</span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={selected.data.zoom}
              onChange={(event) => onUpdateImage({ zoom: Number(event.target.value) })}
            />
          </label>
          <p className="inspector__hint">
            {cropMode ? 'Crop mode 中は画像内部をドラッグしてトリミング位置を調整します。' : 'Crop ボタンを押すと、画像内部ドラッグがトリミング操作になります。'}
          </p>
        </div>
      ) : (
        <div className="inspector__section">
          <div className="inspector__label">Text box</div>
          <div className="segmented-control">
            <button
              type="button"
              className={selected.kind === 'title' ? 'is-active' : ''}
              onClick={() => onConvertKind('title')}
            >
              Title
            </button>
            <button
              type="button"
              className={selected.kind === 'body' ? 'is-active' : ''}
              onClick={() => onConvertKind('body')}
            >
              Body
            </button>
          </div>
          <label className="inspector__stack">
            <span>Text</span>
            <textarea
              rows={10}
              value={selected.data.text}
              onChange={(event) => onUpdateText({ text: event.target.value })}
            />
          </label>
          <div className="inspector__grid">
            <label className="inspector__stack">
              <span>Font size</span>
              <input
                type="number"
                value={selected.data.fontSize}
                min={14}
                max={96}
                onChange={(event) => onUpdateText({ fontSize: Number(event.target.value) })}
              />
            </label>
            <label className="inspector__stack">
              <span>Line height</span>
              <input
                type="number"
                value={selected.data.lineHeight}
                min={16}
                max={100}
                onChange={(event) => onUpdateText({ lineHeight: Number(event.target.value) })}
              />
            </label>
          </div>
          <div className="inspector__grid">
            <label className="inspector__stack">
              <span>Align</span>
              <select
                value={selected.data.align}
                onChange={(event) => onUpdateText({ align: event.target.value as TextBox['data']['align'] })}
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </label>
            <label className="inspector__stack">
              <span>Padding</span>
              <input
                type="number"
                value={selected.data.padding}
                min={8}
                max={48}
                onChange={(event) => onUpdateText({ padding: Number(event.target.value) })}
              />
            </label>
          </div>
          <p className="inspector__hint">
            テキスト高さは Pretext で先に計算し、他ボックスとの接触時は幅・高さを再計算してページ内で押し戻します。
          </p>
        </div>
      )}
    </aside>
  )
}
