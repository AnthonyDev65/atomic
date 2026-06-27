import { useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { sampleProp, ANIM_PROPS, invalidateRef } from '../anim'

// Playhead nudge step (seconds) when moving with the arrow keys.
const ARROW_STEP = 0.1

const PROP_META = {
  position: { label: 'Position', color: '#e5a' },
  rotation: { label: 'Rotation', color: '#5b5' },
  scale: { label: 'Scale', color: '#5ae' },
  opacity: { label: 'Opacity', color: '#ec6' },
}
const GROUP_PROPS = ['position', 'rotation', 'opacity']

// Read the value to capture for a keyframe: the sampled pose if already
// animated, otherwise the target's static value.
function currentValue(target, prop, time) {
  const track = target.keyframes?.[prop]
  if (track?.length) return sampleProp(track, time)
  if (prop === 'opacity') return target.opacity ?? 1
  if (prop === 'rotation') return target.rotation || [0, 0, 0]
  if (prop === 'scale') return target.scale || [1, 1, 1]
  return target.position || [0, 0, 0]
}

export default function KeyframePanel() {
  const timelineOpen = useStore(s => s.timelineOpen)
  const viewerMode = useStore(s => s.viewerMode)
  const layer = useStore(s => s.layers.find(l => l.id === s.selectedId))
  const group = useStore(s => s.groups.find(g => g.id === s.selectedGroupId))
  const tl = useStore(s => s.timeline)
  const store = useStore()
  const {
    togglePlay, stopTimeline, setTime, setDuration, toggleLoop, toggleRecording, toggleTimeline,
  } = store
  const trackRef = useRef(null)

  // Arrow keys nudge the playhead: ←/→ by ARROW_STEP, Shift+←/→ snaps to the
  // adjacent whole second.
  useEffect(() => {
    if (!timelineOpen || viewerMode) return
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const s = useStore.getState()
      const cur = s.timeline.time
      const dur = s.timeline.duration
      const dir = e.key === 'ArrowRight' ? 1 : -1
      const next = e.shiftKey
        ? (dir > 0 ? Math.floor(cur + 1) : Math.ceil(cur - 1)) // snap to whole second
        : cur + dir * ARROW_STEP
      s.setTime(Math.min(dur, Math.max(0, +next.toFixed(4))))
      invalidateRef.current?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [timelineOpen, viewerMode])

  if (!timelineOpen || viewerMode) return null

  const isGroup = !!group && !layer
  const target = layer || group
  const props = isGroup ? GROUP_PROPS : ANIM_PROPS
  const addKeyframe = isGroup ? store.addGroupKeyframe : store.addKeyframe
  const removeKeyframe = isGroup ? store.removeGroupKeyframe : store.removeKeyframe
  const clearKeyframes = isGroup ? store.clearGroupKeyframes : store.clearKeyframes

  const { time, duration, playing, loop, recording } = tl
  const pct = (t) => `${Math.min(100, Math.max(0, (t / duration) * 100))}%`

  const scrubTo = (clientX, snap) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let t = ((clientX - rect.left) / rect.width) * duration
    if (snap) t = Math.round(t) // Shift magnetizes to whole seconds
    setTime(Math.min(duration, Math.max(0, t)))
    invalidateRef.current?.()
  }
  const onScrubDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    scrubTo(e.clientX, e.shiftKey)
  }
  const onScrubMove = (e) => {
    if (e.buttons !== 1) return
    scrubTo(e.clientX, e.shiftKey)
  }

  const toggleKey = (prop) => {
    if (!target) return
    const track = target.keyframes?.[prop]
    const existing = track?.find(k => Math.abs(k.t - time) < 0.02)
    if (existing) removeKeyframe(target.id, prop, existing.t)
    else addKeyframe(target.id, prop, time, currentValue(target, prop, time))
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[200px] bg-[#1d1d20] border-t border-[#3d3d3d] z-[120] flex flex-col select-none shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      {/* Transport bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#2d2d2d] shrink-0">
        <button onClick={togglePlay} title={playing ? 'Pause' : 'Play'}
          className="w-7 h-7 flex items-center justify-center rounded bg-[#4c8bf5] text-white hover:bg-[#3a7ae0] transition">
          {playing
            ? <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1" width="3" height="10" rx="0.5"/><rect x="7" y="1" width="3" height="10" rx="0.5"/></svg>
            : <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2 1.5v9l8-4.5z"/></svg>}
        </button>
        <button onClick={stopTimeline} title="Stop / rewind"
          className="w-7 h-7 flex items-center justify-center rounded bg-[#333] text-[#bbb] hover:text-white transition">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="2" width="8" height="8" rx="1"/></svg>
        </button>
        <button onClick={toggleRecording} title="Record keyframes on edit"
          className={`flex items-center gap-1.5 px-2.5 h-7 rounded text-[11px] font-medium transition border ${recording ? 'bg-[#5a1f1f] border-[#a33] text-[#ff6b6b]' : 'bg-[#333] border-[#444] text-[#999] hover:text-white'}`}>
          <span className={`w-2 h-2 rounded-full ${recording ? 'bg-[#ff4444] animate-pulse' : 'bg-[#777]'}`} />
          REC
        </button>

        <div className="w-px h-5 bg-[#3d3d3d] mx-1" />

        <span className="text-[11px] text-[#ccc] font-mono tabular-nums">
          {time.toFixed(2)}<span className="text-[#666]"> / </span>
          <input type="number" value={duration} min={0.1} step={0.5}
            onChange={(e) => setDuration(parseFloat(e.target.value) || 0.1)}
            className="w-12 bg-[#1e1e1e] border border-[#3d3d3d] rounded px-1 py-0.5 text-[#ccc] outline-none focus:border-[#4c8bf5]/60" />
          <span className="text-[#666]">s</span>
        </span>

        <button onClick={toggleLoop} title="Loop"
          className={`px-2 h-7 rounded text-[10px] transition border ${loop ? 'bg-[#4c8bf5]/20 border-[#4c8bf5]/40 text-[#8ab4f8]' : 'bg-[#333] border-[#444] text-[#888]'}`}>
          ↻ Loop
        </button>

        <div className="flex-1" />
        {recording && <span className="text-[10px] text-[#ff8888] mr-2">Editing transform/opacity creates keyframes</span>}
        <button onClick={toggleTimeline} title="Close timeline"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#333] text-[#888] hover:text-white transition">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
      </div>

      {!target ? (
        <div className="flex-1 flex items-center justify-center text-[#555] text-xs">
          Select an object or group to add keyframes.
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Property labels */}
          <div className="w-36 shrink-0 border-r border-[#2d2d2d] flex flex-col">
            <div className="h-6 border-b border-[#2d2d2d] flex items-center px-2 gap-1">
              {isGroup && <span className="text-[8px] text-[#8ab4f8] bg-[#4c8bf5]/15 px-1 rounded">GROUP</span>}
              <span className="text-[10px] text-white truncate">{target.name || 'Group'}</span>
              {target.keyframes && (
                <button onClick={() => clearKeyframes(target.id)} title="Clear all keyframes"
                  className="ml-auto text-[9px] text-[#a55] hover:text-[#f77]">clear</button>
              )}
            </div>
            {props.map(prop => {
              const m = PROP_META[prop]
              const hasKey = target.keyframes?.[prop]?.some(k => Math.abs(k.t - time) < 0.02)
              return (
                <div key={prop} className="h-8 flex items-center gap-2 px-2 border-b border-[#262626]">
                  <button onClick={() => toggleKey(prop)}
                    title={hasKey ? 'Remove keyframe at playhead' : 'Add keyframe at playhead'}
                    className="w-4 h-4 flex items-center justify-center shrink-0">
                    <span className="rotate-45 w-2.5 h-2.5 rounded-[1px] border transition"
                      style={{ borderColor: m.color, background: hasKey ? m.color : 'transparent' }} />
                  </button>
                  <span className="text-[10px]" style={{ color: m.color }}>{m.label}</span>
                </div>
              )
            })}
          </div>

          {/* Tracks + ruler */}
          <div className="flex-1 relative overflow-hidden" ref={trackRef}>
            {/* Ruler (scrubbable) */}
            <div className="h-6 border-b border-[#2d2d2d] relative cursor-pointer"
              onPointerDown={onScrubDown} onPointerMove={onScrubMove}>
              {Array.from({ length: Math.floor(duration) + 1 }).map((_, i) => (
                <div key={i} className="absolute top-0 bottom-0 border-l border-[#333]" style={{ left: pct(i) }}>
                  <span className="text-[8px] text-[#666] ml-1">{i}s</span>
                </div>
              ))}
            </div>

            {/* Property tracks */}
            <div className="relative" onPointerDown={onScrubDown} onPointerMove={onScrubMove}>
              {props.map(prop => {
                const m = PROP_META[prop]
                const track = target.keyframes?.[prop] || []
                return (
                  <div key={prop} className="h-8 border-b border-[#262626] relative">
                    {/* gridlines */}
                    {Array.from({ length: Math.floor(duration) + 1 }).map((_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-l border-[#262626]" style={{ left: pct(i) }} />
                    ))}
                    {track.map((k, i) => (
                      <button key={i}
                        onPointerDown={(e) => { e.stopPropagation(); setTime(k.t); invalidateRef.current?.() }}
                        onContextMenu={(e) => { e.preventDefault(); removeKeyframe(target.id, prop, k.t) }}
                        title={`${k.t.toFixed(2)}s — click to seek, right-click to delete`}
                        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rotate-45 rounded-[1px] hover:scale-125 transition"
                        style={{ left: pct(k.t), background: m.color, boxShadow: '0 0 0 1px rgba(0,0,0,0.5)' }} />
                    ))}
                  </div>
                )
              })}
            </div>

            {/* Playhead */}
            <div className="absolute top-0 bottom-0 w-px bg-[#4c8bf5] pointer-events-none z-10" style={{ left: pct(time) }}>
              <div className="absolute -top-0 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#4c8bf5] -mt-0.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
