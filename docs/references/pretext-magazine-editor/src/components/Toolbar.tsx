import { ImagePlus, Type, WholeWord, Trash2, Crop } from 'lucide-react'

type ToolbarProps = {
  onAddTitle: () => void
  onAddBody: () => void
  onAddImage: () => void
  onDelete: () => void
  canDelete: boolean
  cropMode: boolean
  canCrop: boolean
  onToggleCropMode: () => void
}

export function Toolbar({
  onAddTitle,
  onAddBody,
  onAddImage,
  onDelete,
  canDelete,
  cropMode,
  canCrop,
  onToggleCropMode,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <button type="button" className="toolbar__button" onClick={onAddTitle}>
        <Type size={16} />
        Title
      </button>
      <button type="button" className="toolbar__button" onClick={onAddBody}>
        <WholeWord size={16} />
        Body
      </button>
      <button type="button" className="toolbar__button" onClick={onAddImage}>
        <ImagePlus size={16} />
        Image
      </button>
      <button type="button" className="toolbar__button" onClick={onToggleCropMode} disabled={!canCrop}>
        <Crop size={16} />
        {cropMode ? 'Exit Crop' : 'Crop'}
      </button>
      <button type="button" className="toolbar__button toolbar__button--danger" onClick={onDelete} disabled={!canDelete}>
        <Trash2 size={16} />
        Delete
      </button>
    </div>
  )
}
