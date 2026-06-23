import { useStore } from '../store/useStore'
import { useRef } from 'react'
import { PointerIcon, MoveIcon, RotateIcon, ScaleIcon } from './Icons'
import { centerCameraRef } from '../anim'

export default function Toolbar() {
  const {
    toggleLeftPanel, toggleRightPanel, toggleScript, toggleConfig,
    quality, setQuality, openViewerSetup, viewerMode,
    transformMode, setTransformMode, layers, groups, clearLayers,
    toggleShare, toggleTimeline, timelineOpen,
    leftPanelOpen, rightPanelOpen,
  } = useStore()
  const fileInputRef = useRef(null)

  if (viewerMode) return null

  const exportProject = () => {
    const { viewerData, timeline } = useStore.getState()
    const data = { version: '2.0', app: 'atomo-react', created: new Date().toISOString(), layers, groups, viewer: viewerData, anim: { duration: timeline.duration, loop: timeline.loop } }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'project.atomo'; a.click()
  }

  const importProject = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        // Support both old format (objects) and new format (layers)
        let importedLayers = data.layers
        if (!importedLayers && data.objects) {
          // Convert old HTML format to React format
          importedLayers = data.objects.map(obj => ({
            id: crypto.randomUUID(),
            name: obj.name || 'object',
            type: obj.type || 'sphere',
            color: obj.color || '#ffffff',
            position: obj.position ? [obj.position.x, obj.position.y, obj.position.z] : [0, 0, 0],
            rotation: obj.rotation ? [obj.rotation.x, obj.rotation.y, obj.rotation.z] : [0, 0, 0],
            scale: obj.scale ? [obj.scale.x, obj.scale.y, obj.scale.z] : [1, 1, 1],
            visible: obj.visible !== false,
            opacity: 1,
            sphereRadius: obj.sphereRadius || 0.5,
            torusRadius: obj.torusRadius || 0.5,
            tubeThickness: obj.tubeThickness || 0.1,
            label: obj.label || '',
          }))
        }
        if (!importedLayers) { alert('Invalid file format'); return }
        clearLayers()
        useStore.setState({
          layers: importedLayers,
          groups: data.groups || [],
          ...(data.viewer ? { viewerData: data.viewer } : {}),
          ...(data.anim ? { timeline: { ...useStore.getState().timeline, ...data.anim, time: 0, playing: false } } : {}),
        })
      } catch (err) { alert('Error: ' + err.message) }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-0.5 md:gap-1 z-50 bg-[#2c2c2c] rounded-lg px-1 md:px-1.5 py-1 border border-[#3d3d3d] shadow-lg max-w-[95vw] overflow-x-auto">
      <ToolBtn onClick={exportProject} title="Export project">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      </ToolBtn>
      <ToolBtn onClick={() => fileInputRef.current?.click()} title="Open project">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
      </ToolBtn>
      <ToolBtn onClick={clearLayers} title="New project">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
      </ToolBtn>
      <input ref={fileInputRef} type="file" accept=".atomo,.json" onChange={importProject} className="hidden" />

      <Divider />

      <ToolBtn onClick={toggleLeftPanel} active={leftPanelOpen} title="Panel izquierdo">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="7" y="2" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/></svg>
      </ToolBtn>

      <Divider />

      {/* Transform modes */}
      <ToolBtn onClick={() => setTransformMode('select')} active={transformMode === 'select'} title="Seleccionar">
        <PointerIcon />
      </ToolBtn>
      <ToolBtn onClick={() => setTransformMode('translate')} active={transformMode === 'translate'} title="Mover (G)">
        <MoveIcon />
      </ToolBtn>
      <ToolBtn onClick={() => setTransformMode('rotate')} active={transformMode === 'rotate'} title="Rotar (R)">
        <RotateIcon />
      </ToolBtn>
      <ToolBtn onClick={() => setTransformMode('scale')} active={transformMode === 'scale'} title="Escalar (S)">
        <ScaleIcon />
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={() => centerCameraRef.current?.()} title="Centrar cámara (F)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={toggleScript} title="Script (F2)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 4l-3 3 3 3M10 4l3 3-3 3M8 2l-2 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
      </ToolBtn>

      <ToolBtn onClick={toggleTimeline} active={timelineOpen} title="Línea de tiempo / animación">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7h12" stroke="currentColor" strokeWidth="1.2"/><path d="M4 4.5l1.5 2.5L4 9.5z" fill="currentColor"/><path d="M9 4.5l1.5 2.5L9 9.5z" fill="currentColor"/></svg>
      </ToolBtn>

      <select
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
        className="h-7 px-2 rounded bg-[#383838] border border-[#4a4a4a] text-[#b0b0b0] text-[10px] cursor-pointer outline-none hover:border-[#5a5a5a] transition"
      >
        <option value="low">Low</option>
        <option value="medium">Med</option>
        <option value="high">High</option>
        {quality === 'custom' && <option value="custom">Custom</option>}
      </select>

      <ToolBtn onClick={toggleConfig} title="Configuración">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2M2.8 2.8l1.4 1.4M9.8 9.8l1.4 1.4M2.8 11.2l1.4-1.4M9.8 4.2l1.4-1.4" stroke="currentColor" strokeWidth="1.2"/></svg>
      </ToolBtn>

      <ToolBtn onClick={openViewerSetup} title="Modo presentación">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>
      </ToolBtn>

      <ToolBtn onClick={toggleShare} title="Compartir modelo">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
      </ToolBtn>

      <Divider />

      <ToolBtn onClick={toggleRightPanel} active={rightPanelOpen} title="Panel derecho">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="2" width="6" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" opacity="0.4"/><rect x="9" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
      </ToolBtn>
    </div>
  )
}

function ToolBtn({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-7 flex items-center justify-center rounded transition ${
        active
          ? 'bg-[#4c8bf5] text-white'
          : 'text-[#9a9a9a] hover:bg-[#383838] hover:text-[#d0d0d0]'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <div className="w-px h-4 bg-[#3d3d3d] mx-0.5" />
}
