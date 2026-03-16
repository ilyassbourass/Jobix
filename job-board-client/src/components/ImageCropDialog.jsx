import { useEffect, useMemo, useRef, useState } from 'react'
import { Move, ZoomIn } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/Dialog'
import { Button } from './ui/Button'
import { useI18n } from '../context/I18nContext'

const GUIDE_SIZE = 250
const MAX_ZOOM = 3

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export default function ImageCropDialog({
  open,
  imageUrl,
  fileName,
  onClose,
  onConfirm,
  loading = false,
}) {
  const { t } = useI18n()
  const imageRef = useRef(null)
  const dragPointRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!open || !imageUrl) {
      setZoom(1)
      setPosition({ x: 0, y: 0 })
      setNaturalSize({ width: 0, height: 0 })
    }
  }, [open, imageUrl])

  const baseScale = useMemo(() => {
    if (!naturalSize.width || !naturalSize.height) return 1
    return Math.max(GUIDE_SIZE / naturalSize.width, GUIDE_SIZE / naturalSize.height)
  }, [naturalSize.height, naturalSize.width])

  const displayScale = baseScale * zoom

  const clampPosition = (nextPosition, nextZoom = zoom) => {
    if (!naturalSize.width || !naturalSize.height) {
      return { x: 0, y: 0 }
    }

    const nextScale = baseScale * nextZoom
    const renderedWidth = naturalSize.width * nextScale
    const renderedHeight = naturalSize.height * nextScale
    const maxX = Math.max(0, (renderedWidth - GUIDE_SIZE) / 2)
    const maxY = Math.max(0, (renderedHeight - GUIDE_SIZE) / 2)

    return {
      x: clamp(nextPosition.x, -maxX, maxX),
      y: clamp(nextPosition.y, -maxY, maxY),
    }
  }

  const handleZoomChange = (event) => {
    const nextZoom = Number(event.target.value)
    setZoom(nextZoom)
    setPosition((current) => clampPosition(current, nextZoom))
  }

  const handlePointerDown = (event) => {
    if (!naturalSize.width || !naturalSize.height) return

    dragPointRef.current = {
      x: event.clientX,
      y: event.clientY,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  const handlePointerMove = (event) => {
    if (!dragPointRef.current) return

    const deltaX = event.clientX - dragPointRef.current.x
    const deltaY = event.clientY - dragPointRef.current.y

    dragPointRef.current = {
      x: event.clientX,
      y: event.clientY,
    }

    setPosition((current) =>
      clampPosition({
        x: current.x + deltaX,
        y: current.y + deltaY,
      })
    )
  }

  const handlePointerUp = (event) => {
    if (!dragPointRef.current) return
    dragPointRef.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleConfirm = async () => {
    if (!imageRef.current || !naturalSize.width || !naturalSize.height || loading) return

    const canvas = document.createElement('canvas')
    const outputSize = 512
    const sourceCropSize = GUIDE_SIZE / displayScale
    const sourceCenterX = naturalSize.width / 2 - position.x / displayScale
    const sourceCenterY = naturalSize.height / 2 - position.y / displayScale
    const sourceX = clamp(sourceCenterX - sourceCropSize / 2, 0, Math.max(0, naturalSize.width - sourceCropSize))
    const sourceY = clamp(sourceCenterY - sourceCropSize / 2, 0, Math.max(0, naturalSize.height - sourceCropSize))

    canvas.width = outputSize
    canvas.height = outputSize

    const context = canvas.getContext('2d')
    if (!context) return

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(
      imageRef.current,
      sourceX,
      sourceY,
      sourceCropSize,
      sourceCropSize,
      0,
      0,
      outputSize,
      outputSize
    )

    const mimeType = fileName?.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
    const extension = mimeType === 'image/png' ? 'png' : 'jpg'
    const safeBaseName = (fileName || 'avatar')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-z0-9_-]+/gi, '-')

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, mimeType, 0.92)
    })

    if (!blob) return

    const croppedFile = new File([blob], `${safeBaseName || 'avatar'}-cropped.${extension}`, {
      type: mimeType,
    })

    await onConfirm?.(croppedFile)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && !loading && onClose?.()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('imageCrop.title')}</DialogTitle>
          <DialogDescription>
            {t('imageCrop.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className="relative mx-auto h-[320px] w-[320px] overflow-hidden rounded-[2rem] bg-slate-900 touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {imageUrl && (
              <img
                ref={imageRef}
                src={imageUrl}
                alt={t('imageCrop.cropPreview')}
                className="absolute left-1/2 top-1/2 max-w-none"
                draggable="false"
                style={{
                  transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${displayScale})`,
                  transformOrigin: 'center center',
                }}
                onLoad={(event) => {
                  setNaturalSize({
                    width: event.currentTarget.naturalWidth,
                    height: event.currentTarget.naturalHeight,
                  })
                }}
              />
            )}

            <div className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-black/35" />
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_999px_rgba(15,23,42,0.35)]"
                style={{ width: `${GUIDE_SIZE}px`, height: `${GUIDE_SIZE}px` }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
            <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
              <Move className="h-4 w-4 text-primary-600" />
              {t('imageCrop.dragPhoto')}
            </div>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <ZoomIn className="h-4 w-4 shrink-0 text-slate-500 dark:text-gray-400" />
                <input
                  type="range"
                  min="1"
                  max={String(MAX_ZOOM)}
                  step="0.01"
                  value={zoom}
                  onChange={handleZoomChange}
                  className="w-full accent-primary-600"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('imageCrop.cancel')}
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={loading || !naturalSize.width}>
              {loading ? t('imageCrop.saving') : t('imageCrop.usePhoto')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
