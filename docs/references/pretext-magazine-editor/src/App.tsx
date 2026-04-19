import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent as ReactPointerEvent } from 'react'
import { DEFAULT_BODY_TEXT, DEFAULT_TITLE_TEXT, PAGE_HEIGHT, PAGE_WIDTH } from './constants'
import { Inspector } from './components/Inspector'
import { Toolbar } from './components/Toolbar'
import type { DragMode, EditorBox, ImageBox, ResizeHandle, TextBox } from './types'
import { applyResize, rectOf, sortByZ, translateRect } from './utils/geometry'
import { normalizeBoxes } from './utils/editorLayout'
import { flowTextLines } from './utils/textFlow'

function uid() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

function maxZ(boxes: EditorBox[]) {
  return boxes.reduce((max, box) => Math.max(max, box.zIndex), 0)
}

function createTitleBox(zIndex: number): TextBox {
  return {
    id: uid(),
    kind: 'title',
    x: 48,
    y: 54,
    width: 596,
    height: 140,
    minWidth: 220,
    minHeight: 90,
    zIndex,
    data: {
      text: DEFAULT_TITLE_TEXT,
      fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, serif',
      fontSize: 48,
      fontWeight: 700,
      lineHeight: 54,
      letterSpacing: 0,
      padding: 12,
      color: '#111111',
      align: 'left',
    },
  }
}

function createBodyBox(zIndex: number): TextBox {
  return {
    id: uid(),
    kind: 'body',
    x: 52,
    y: 238,
    width: 356,
    height: 420,
    minWidth: 200,
    minHeight: 140,
    zIndex,
    data: {
      text: DEFAULT_BODY_TEXT,
      fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, serif',
      fontSize: 22,
      fontWeight: 400,
      lineHeight: 34,
      letterSpacing: 0,
      padding: 14,
      color: '#121212',
      align: 'left',
    },
  }
}

function createImageBox(zIndex: number): ImageBox {
  return {
    id: uid(),
    kind: 'image',
    x: 454,
    y: 252,
    width: 274,
    height: 356,
    minWidth: 140,
    minHeight: 140,
    zIndex,
    data: {
      src: null,
      cropX: 0,
      cropY: 0,
      zoom: 1,
    },
  }
}

function createInitialBoxes() {
  const title = createTitleBox(1)
  const body = createBodyBox(2)
  const image = createImageBox(3)
  return normalizeBoxes([title, body, image], body.id)
}

type AppProps = {
  embedded?: boolean
  initialBoxes?: EditorBox[]
  onBoxesChange?: (boxes: EditorBox[]) => void
  onImageUploadTransform?: (file: File) => Promise<string>
}

function cloneEditorBox(box: EditorBox): EditorBox {
  if (box.kind === 'image') {
    return {
      ...box,
      data: { ...box.data },
    }
  }

  return {
    ...box,
    data: { ...box.data },
  }
}

function localObstacles(target: TextBox, boxes: EditorBox[]) {
  return boxes
    .filter((box) => box.id !== target.id)
    .map((box) => ({
      x: box.x - target.x,
      y: box.y - target.y,
      width: box.width,
      height: box.height,
    }))
}

function handlePositions() {
  return [
    'nw', 'n', 'ne',
    'w',        'e',
    'sw', 's', 'se',
  ] as ResizeHandle[]
}

export default function App({ embedded = false, initialBoxes, onBoxesChange, onImageUploadTransform }: AppProps = {}) {
  const [boxes, setBoxes] = useState<EditorBox[]>(() => initialBoxes ?? createInitialBoxes())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dragMode, setDragMode] = useState<DragMode>({ type: 'idle' })
  const [cropMode, setCropMode] = useState(false)
  const [embeddedScale, setEmbeddedScale] = useState(1)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null)
  const canvasAreaRef = useRef<HTMLDivElement | null>(null)
  const pageRef = useRef<HTMLDivElement | null>(null)
  const hiddenUploadInputRef = useRef<HTMLInputElement | null>(null)
  const inlineEditorRef = useRef<HTMLTextAreaElement | null>(null)
  const dragFrameRef = useRef<number | null>(null)
  const dragPointerRef = useRef<{ clientX: number, clientY: number } | null>(null)
  const lastTextTapRef = useRef<{ id: string, time: number } | null>(null)
  const activePointerTargetRef = useRef<HTMLElement | null>(null)
  const activePointerIdRef = useRef<number | null>(null)

  const selected = useMemo(() => boxes.find((box) => box.id === selectedId) ?? null, [boxes, selectedId])

  const toPagePoint = (clientX: number, clientY: number) => {
    const rect = pageRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: ((clientX - rect.left) / rect.width) * PAGE_WIDTH,
      y: ((clientY - rect.top) / rect.height) * PAGE_HEIGHT,
    }
  }

  const bringToFront = (id: string, sourceBoxes = boxes) => {
    const nextZ = maxZ(sourceBoxes) + 1
    return sourceBoxes.map((box) => (box.id === id ? { ...box, zIndex: nextZ } : box))
  }

  const selectBox = (id: string) => {
    setSelectedId(id)
    setBoxes((prev) => bringToFront(id, prev))
  }

  const addBox = (kind: 'title' | 'body' | 'image') => {
    setBoxes((prev) => {
      const z = maxZ(prev) + 1
      const nextBox = kind === 'title' ? createTitleBox(z) : kind === 'body' ? createBodyBox(z) : createImageBox(z)
      const next = normalizeBoxes([...prev, nextBox], nextBox.id)
      setSelectedId(nextBox.id)
      return next
    })
  }

  const updateSelectedText = (patch: Partial<TextBox['data']>) => {
    if (!selectedId) return
    setBoxes((prev) =>
      normalizeBoxes(
        prev.map((box) =>
          box.id === selectedId && box.kind !== 'image'
            ? { ...box, data: { ...box.data, ...patch } }
            : box,
        ),
        selectedId,
      ),
    )
  }

  const updateSelectedImage = (patch: Partial<ImageBox['data']>) => {
    if (!selectedId) return
    setBoxes((prev) =>
      normalizeBoxes(
        prev.map((box) =>
          box.id === selectedId && box.kind === 'image'
            ? { ...box, data: { ...box.data, ...patch } }
            : box,
        ),
        selectedId,
      ),
    )
  }

  const convertSelectedKind = (kind: 'title' | 'body') => {
    if (!selectedId) return
    setBoxes((prev) =>
      normalizeBoxes(
        prev.map((box) => {
          if (box.id !== selectedId || box.kind === 'image') return box
          return {
            ...box,
            kind,
            minHeight: kind === 'title' ? 90 : 140,
            data: {
              ...box.data,
              fontSize: kind === 'title' ? Math.max(38, box.data.fontSize) : Math.min(24, box.data.fontSize),
              fontWeight: kind === 'title' ? 700 : 400,
              lineHeight: kind === 'title' ? Math.max(44, box.data.lineHeight) : Math.min(36, box.data.lineHeight),
              align: kind === 'title' ? 'left' : box.data.align,
            },
          }
        }),
        selectedId,
      ),
    )
  }

  const deleteSelected = () => {
    if (!selectedId) return
    setBoxes((prev) => prev.filter((box) => box.id !== selectedId))
    setSelectedId(null)
    setEditingTextId(null)
    setCropMode(false)
  }

  const openUploadPicker = (boxId: string) => {
    setSelectedId(boxId)
    setEditingTextId(null)
    setUploadTargetId(boxId)
    hiddenUploadInputRef.current?.click()
  }

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    const targetId = uploadTargetId ?? selectedId
    if (!file || !targetId) return
    const dataUrl = onImageUploadTransform
      ? await onImageUploadTransform(file)
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
    setSelectedId(targetId)
    setBoxes((prev) =>
      normalizeBoxes(
        prev.map((box) =>
          box.id === targetId && box.kind === 'image'
            ? { ...box, data: { ...box.data, src: dataUrl } }
            : box,
        ),
        targetId,
      ),
    )
    setUploadTargetId(null)
    event.target.value = ''
  }

  const handleTextBoxTap = (box: TextBox) => {
    const now = Date.now()
    const previousTap = lastTextTapRef.current
    if (previousTap && previousTap.id === box.id && now - previousTap.time < 320) {
      setSelectedId(box.id)
      setEditingTextId(box.id)
      lastTextTapRef.current = null
      return
    }
    lastTextTapRef.current = { id: box.id, time: now }
  }

  const beginBoxInteraction = (box: EditorBox, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (box.kind !== 'image' && editingTextId === box.id) return
    setEditingTextId(null)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    activePointerTargetRef.current = event.currentTarget
    activePointerIdRef.current = event.pointerId
    selectBox(box.id)
    const point = toPagePoint(event.clientX, event.clientY)
    if (cropMode && box.kind === 'image') {
      setDragMode({
        type: 'crop',
        startX: point.x,
        startY: point.y,
        originCropX: box.data.cropX,
        originCropY: box.data.cropY,
      })
      return
    }

    setDragMode({
      type: 'move',
      startX: point.x,
      startY: point.y,
      origin: rectOf(box),
    })
  }

  const beginResize = (box: EditorBox, handle: ResizeHandle, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    activePointerTargetRef.current = event.currentTarget
    activePointerIdRef.current = event.pointerId
    selectBox(box.id)
    const point = toPagePoint(event.clientX, event.clientY)
    setDragMode({
      type: 'resize',
      handle,
      startX: point.x,
      startY: point.y,
      origin: rectOf(box),
    })
  }

  useEffect(() => {
    if (dragMode.type === 'idle' || !selectedId) return

    const applyDrag = (clientX: number, clientY: number) => {
      const point = toPagePoint(clientX, clientY)
      const dx = point.x - dragMode.startX
      const dy = point.y - dragMode.startY

      setBoxes((prev) => {
        const next = prev.map(cloneEditorBox)
        const index = next.findIndex((box) => box.id === selectedId)
        if (index === -1) return prev
        const current = next[index]!

        if (dragMode.type === 'move') {
          const moved = translateRect(dragMode.origin, dx, dy)
          current.x = moved.x
          current.y = moved.y
        } else if (dragMode.type === 'resize') {
          const resized = applyResize(dragMode.origin, dragMode.handle, dx, dy, current.minWidth, current.minHeight)
          current.x = resized.x
          current.y = resized.y
          current.width = resized.width
          current.height = resized.height
        } else if (dragMode.type === 'crop' && current.kind === 'image') {
          current.data.cropX = dragMode.originCropX + dx / current.data.zoom
          current.data.cropY = dragMode.originCropY + dy / current.data.zoom
        }

        return next
      })
    }

    const onPointerMove = (event: PointerEvent) => {
      dragPointerRef.current = { clientX: event.clientX, clientY: event.clientY }
      if (dragFrameRef.current !== null) return
      dragFrameRef.current = window.requestAnimationFrame(() => {
        dragFrameRef.current = null
        if (!dragPointerRef.current) return
        applyDrag(dragPointerRef.current.clientX, dragPointerRef.current.clientY)
      })
    }

    const releasePointerCapture = () => {
      const target = activePointerTargetRef.current
      const pointerId = activePointerIdRef.current
      if (target && pointerId !== null) {
        target.releasePointerCapture?.(pointerId)
      }
      activePointerTargetRef.current = null
      activePointerIdRef.current = null
    }

    const onPointerUp = () => {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current)
        dragFrameRef.current = null
      }
      if (dragPointerRef.current) {
        applyDrag(dragPointerRef.current.clientX, dragPointerRef.current.clientY)
        dragPointerRef.current = null
      }
      setDragMode({ type: 'idle' })
      setBoxes((prev) => normalizeBoxes(prev, selectedId))
      releasePointerCapture()
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current)
        dragFrameRef.current = null
      }
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      releasePointerCapture()
    }
  }, [dragMode, selectedId])

  useEffect(() => {
    if (selected?.kind !== 'image') setCropMode(false)
  }, [selected?.kind])

  useEffect(() => {
    if (!selected || selected.kind === 'image' || selected.id !== editingTextId) return
    inlineEditorRef.current?.focus()
    const length = inlineEditorRef.current?.value.length ?? 0
    inlineEditorRef.current?.setSelectionRange(length, length)
  }, [editingTextId, selected])

  useEffect(() => {
    if (!selected || selected.kind === 'image') {
      setEditingTextId(null)
    }
  }, [selected])

  useEffect(() => {
    onBoxesChange?.(boxes)
  }, [boxes, onBoxesChange])

  useEffect(() => {
    if (!embedded) {
      setEmbeddedScale(1)
      return
    }

    const container = canvasAreaRef.current
    if (!container) return

    const updateScale = () => {
      const styles = window.getComputedStyle(container)
      const paddingX = Number.parseFloat(styles.paddingLeft || '0') + Number.parseFloat(styles.paddingRight || '0')
      const paddingY = Number.parseFloat(styles.paddingTop || '0') + Number.parseFloat(styles.paddingBottom || '0')
      const availableWidth = Math.max(1, container.clientWidth - paddingX)
      const availableHeight = Math.max(1, container.clientHeight - paddingY)
      const nextScale = Math.min(1, availableWidth / PAGE_WIDTH, availableHeight / PAGE_HEIGHT)
      setEmbeddedScale(nextScale)
    }

    updateScale()
    const observer = new ResizeObserver(() => updateScale())
    observer.observe(container)
    window.addEventListener('resize', updateScale)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateScale)
    }
  }, [embedded])

  useEffect(() => {
    if (!embedded || selected?.kind !== 'image') return
    const container = canvasAreaRef.current
    const target = container?.querySelector<HTMLElement>(`[data-editor-box-id="${selected.id}"]`)
    if (!container || !target) return
    const frame = window.requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect()
      const targetRect = target.getBoundingClientRect()
      const nextLeft =
        container.scrollLeft +
        (targetRect.left - containerRect.left) -
        ((containerRect.width - targetRect.width) / 2)
      const nextTop =
        container.scrollTop +
        (targetRect.top - containerRect.top) -
        ((containerRect.height - targetRect.height) / 2)

      container.scrollTo({
        left: Math.max(0, nextLeft),
        top: Math.max(0, nextTop),
        behavior: 'smooth',
      })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [embedded, selected?.id, selected?.kind])

  const renderedBoxes = useMemo(() => sortByZ(boxes), [boxes])

  return (
    <div className={`app-shell ${embedded ? 'app-shell--embedded' : ''}`}>
      {embedded ? (
        <div className="compose-pretext-toolbar">
          <Toolbar
            onAddTitle={() => addBox('title')}
            onAddBody={() => addBox('body')}
            onAddImage={() => addBox('image')}
            onDelete={deleteSelected}
            canDelete={Boolean(selectedId)}
            cropMode={cropMode}
            canCrop={selected?.kind === 'image'}
            onToggleCropMode={() => setCropMode((value) => !value)}
          />
        </div>
      ) : (
        <div className="chrome-bar">
          <div>
            <div className="chrome-bar__eyebrow">A4 / movable boxes / auto reflow</div>
            <h1 className="chrome-bar__title">Magazine Post Composer</h1>
          </div>
          <Toolbar
            onAddTitle={() => addBox('title')}
            onAddBody={() => addBox('body')}
            onAddImage={() => addBox('image')}
            onDelete={deleteSelected}
            canDelete={Boolean(selectedId)}
            cropMode={cropMode}
            canCrop={selected?.kind === 'image'}
            onToggleCropMode={() => setCropMode((value) => !value)}
          />
        </div>
      )}

      <div className="workspace">
        <input
          ref={hiddenUploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
        {embedded
          ? (selected && selected.kind !== 'image' ? (
            <section className="compose-pretext-textbar">
              <div className="segmented-control compose-pretext-textbar__align compose-pretext-textbar__align--solo">
                <button
                  type="button"
                  className={selected.data.align === 'left' ? 'is-active' : ''}
                  onClick={() => updateSelectedText({ align: 'left' })}
                >
                  Left
                </button>
                <button
                  type="button"
                  className={selected.data.align === 'center' ? 'is-active' : ''}
                  onClick={() => updateSelectedText({ align: 'center' })}
                >
                  Center
                </button>
                <button
                  type="button"
                  className={selected.data.align === 'right' ? 'is-active' : ''}
                  onClick={() => updateSelectedText({ align: 'right' })}
                >
                  Right
                </button>
              </div>
            </section>
            ) : null)
          : (
            <Inspector
              selected={selected}
              cropMode={cropMode}
              onUpdateText={updateSelectedText}
              onUpdateImage={updateSelectedImage}
              onConvertKind={convertSelectedKind}
              onUpload={handleUpload}
            />
          )}

        <div ref={canvasAreaRef} className={`canvas-area ${embedded ? 'canvas-area--embedded' : ''}`}>
          <div
            className={`page-stage-shell ${embedded ? 'page-stage-shell--embedded' : ''}`}
            style={embedded ? { width: `${PAGE_WIDTH * embeddedScale}px`, height: `${PAGE_HEIGHT * embeddedScale}px` } : undefined}
          >
            <div
              className={`page-stage ${embedded ? 'page-stage--fit' : ''}`}
              style={embedded
                ? {
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    transform: `scale(${embeddedScale})`,
                    transformOrigin: 'top left',
                  }
                : undefined}
            >
            <div className="page-shadow" />
            <div
              ref={pageRef}
              className="page"
              onPointerDown={() => {
                setSelectedId(null)
                setCropMode(false)
              }}
            >
              <div className="page__guides" />
              {renderedBoxes.map((box) => {
                const isSelected = box.id === selectedId
                const baseStyle = {
                  left: `${box.x}px`,
                  top: `${box.y}px`,
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                  zIndex: box.zIndex,
                }

                if (box.kind === 'image') {
                  return (
                    <div
                      key={box.id}
                      data-editor-box-id={box.id}
                      className={`editor-box editor-box--image ${isSelected ? 'is-selected' : ''} ${cropMode && isSelected ? 'is-cropping' : ''}`}
                      style={baseStyle}
                      onPointerDown={(event) => beginBoxInteraction(box, event)}
                    >
                      <div className="editor-box__label">IMAGE</div>
                      <div className="image-frame">
                        {box.data.src ? (
                          <img
                            src={box.data.src}
                            alt="uploaded"
                            draggable={false}
                            style={{
                              transform: `translate(calc(-50% + ${box.data.cropX}px), calc(-50% + ${box.data.cropY}px)) scale(${box.data.zoom})`,
                            }}
                          />
                        ) : (
                          <div className="image-placeholder">
                            <button
                              type="button"
                              className="image-placeholder__button"
                              onClick={(event) => {
                                event.preventDefault()
                                event.stopPropagation()
                                openUploadPicker(box.id)
                              }}
                            >
                              <span>Upload image</span>
                              <small>Then drag / resize / crop</small>
                            </button>
                          </div>
                        )}
                      </div>
                      {isSelected && handlePositions().map((handle) => (
                        <button
                          type="button"
                          key={handle}
                          className={`resize-handle resize-handle--${handle}`}
                          onPointerDown={(event) => beginResize(box, handle, event)}
                          aria-label={`Resize ${handle}`}
                        />
                      ))}
                    </div>
                  )
                }

                const flow = flowTextLines(box, localObstacles(box, boxes))
                const isEditingText = editingTextId === box.id
                return (
                  <div
                    key={box.id}
                    data-editor-box-id={box.id}
                    className={`editor-box editor-box--text editor-box--${box.kind} ${isSelected ? 'is-selected' : ''}`}
                    style={baseStyle}
                    onPointerDown={(event) => beginBoxInteraction(box, event)}
                    onClick={() => handleTextBoxTap(box)}
                  >
                    <div className="editor-box__label">{box.kind === 'title' ? 'TITLE' : 'BODY'}</div>
                    {isEditingText ? (
                      <textarea
                        ref={inlineEditorRef}
                        className="compose-pretext-inline-editor"
                        value={box.data.text}
                        onChange={(event) => updateSelectedText({ text: event.target.value })}
                        onBlur={() => setEditingTextId(null)}
                        onKeyDown={(event) => {
                          if (event.key === 'Escape') {
                            event.preventDefault()
                            setEditingTextId(null)
                          }
                        }}
                        onPointerDown={(event) => event.stopPropagation()}
                        style={{
                          padding: `${box.data.padding}px`,
                          color: box.data.color,
                          fontFamily: box.data.fontFamily,
                          fontSize: `${box.data.fontSize}px`,
                          fontWeight: box.data.fontWeight,
                          lineHeight: `${box.data.lineHeight}px`,
                          letterSpacing: `${box.data.letterSpacing}px`,
                          textAlign: box.data.align,
                        }}
                      />
                    ) : (
                      <div className="text-flow-surface">
                        {flow.lines.map((line, index) => (
                          <div
                            key={`${box.id}-${index}`}
                            className="flow-line"
                            style={{
                              left: `${line.x}px`,
                              top: `${line.y}px`,
                              width: `${Math.max(line.width, 1)}px`,
                              color: box.data.color,
                              fontFamily: box.data.fontFamily,
                              fontSize: `${box.data.fontSize}px`,
                              fontWeight: box.data.fontWeight,
                              lineHeight: `${box.data.lineHeight}px`,
                              letterSpacing: `${box.data.letterSpacing}px`,
                              textAlign: box.data.align,
                            }}
                          >
                            {line.text}
                          </div>
                        ))}
                      </div>
                    )}
                    {isSelected && handlePositions().map((handle) => (
                      <button
                        type="button"
                        key={handle}
                        className={`resize-handle resize-handle--${handle}`}
                        onPointerDown={(event) => beginResize(box, handle, event)}
                        aria-label={`Resize ${handle}`}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}
