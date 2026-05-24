import { useStore } from '../store/useStore'

function formatConfig(text) {
  // Convert "1s^2" to JSX with superscripts
  const parts = text.split(/(\^[0-9]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('^')) {
      return <sup key={i}>{part.slice(1)}</sup>
    }
    return <span key={i}>{part}</span>
  })
}

export default function ViewerHUD() {
  const { viewerMode, viewerData, exitViewerMode } = useStore()

  if (!viewerMode) return null

  return (
    <>
      <div className="absolute top-6 left-6 z-[150] pointer-events-none select-none">
        <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase mb-1">Modelo Atómico</p>
        <h1 className="text-white text-6xl font-bold leading-none mb-1" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
          {viewerData.symbol}
        </h1>
        <p className="text-white/70 text-lg font-light mb-3">{viewerData.name}</p>
        {viewerData.z && <p className="text-white/50 text-sm mb-1">Z = {viewerData.z}</p>}
        {viewerData.mass && <p className="text-white/50 text-sm mb-3">Masa: {viewerData.mass} u</p>}
        {viewerData.config && (
          <p className="text-sky-200 text-base font-mono" style={{ textShadow: '0 0 8px rgba(100,180,255,0.4)' }}>
            {formatConfig(viewerData.config)}
          </p>
        )}
        {viewerData.extra && <p className="text-white/40 text-xs mt-3">{viewerData.extra}</p>}
      </div>

      <button
        onClick={exitViewerMode}
        className="absolute bottom-6 right-6 px-5 py-2.5 rounded-lg bg-red-500/30 border border-red-500/50 text-red-300 text-sm cursor-pointer z-[150] hover:bg-red-500/40 transition"
      >
        ✕ Salir del Visualizador
      </button>
    </>
  )
}
