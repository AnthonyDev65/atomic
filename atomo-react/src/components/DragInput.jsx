import { useRef, useState, useCallback } from 'react'

/**
 * Input with draggable label (like Figma).
 * Drag the label left/right to change value.
 * Click the input to type directly.
 */
export default function DragInput({ value, onChange, label, step = 0.1, min, color = '#888' }) {
  const [dragging, setDragging] = useState(false)
  const startX = useRef(0)
  const startVal = useRef(0)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
    startX.current = e.clientX
    startVal.current = value

    const handleMove = (ev) => {
      const dx = ev.clientX - startX.current
      const newVal = startVal.current + dx * step
      onChange(min !== undefined ? Math.max(min, +newVal.toFixed(4)) : +newVal.toFixed(4))
    }

    const handleUp = () => {
      setDragging(false)
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
      document.body.style.cursor = ''
    }

    document.body.style.cursor = 'ew-resize'
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [value, onChange, step, min])

  const displayVal = typeof value === 'number'
    ? (Number.isInteger(value) ? value : value.toFixed(2))
    : value

  return (
    <div className="flex-1 flex items-center rounded border border-[#3d3d3d] bg-[#1e1e1e] overflow-hidden hover:border-[#555] transition group">
      {/* Draggable label */}
      <span
        onMouseDown={handleMouseDown}
        className="px-1.5 py-1 text-[9px] font-semibold uppercase select-none cursor-ew-resize shrink-0 opacity-70 group-hover:opacity-100 transition"
        style={{ color }}
      >
        {label}
      </span>
      {/* Input */}
      <input
        type="number"
        value={displayVal}
        onChange={(e) => onChange(+e.target.value)}
        step={step}
        min={min}
        className="w-full px-1 py-1 bg-transparent text-white text-[10px] text-center outline-none border-0"
      />
    </div>
  )
}
