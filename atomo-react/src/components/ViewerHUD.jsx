import { useStore } from '../store/useStore'

function formatConfig(text) {
  const parts = text.split(/(\^[0-9]+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('^')) return <sup key={i} className="text-[0.7em]">{part.slice(1)}</sup>
    return <span key={i}>{part}</span>
  })
}

export default function ViewerHUD() {
  const viewerMode = useStore(s => s.viewerMode)
  const viewerData = useStore(s => s.viewerData)
  const exitViewerMode = useStore(s => s.exitViewerMode)

  if (!viewerMode) return null

  return (
    <>
      <div className="absolute top-4 left-4 md:top-8 md:left-8 z-[150] pointer-events-none select-none">
        <p className="text-white/30 text-[9px] tracking-[0.2em] uppercase mb-2 font-light">Atomic Model</p>
        <h1 className="text-white text-5xl md:text-7xl font-extralight leading-none mb-1 tracking-tight">
          {viewerData.symbol}
        </h1>
        <p className="text-white/60 text-xl font-extralight mb-4">{viewerData.name}</p>
        <div className="space-y-1">
          {viewerData.z && <p className="text-white/40 text-xs font-light">Z = {viewerData.z}</p>}
          {viewerData.mass && <p className="text-white/40 text-xs font-light">Mass: {viewerData.mass} u</p>}
        </div>
        {viewerData.config && (
          <p className="text-[#8ac4ff] text-sm font-mono mt-4 tracking-wide">
            {formatConfig(viewerData.config)}
          </p>
        )}
        {viewerData.extra && <p className="text-white/25 text-[11px] mt-4 font-light">{viewerData.extra}</p>}
      </div>

      <button
        onClick={exitViewerMode}
        className="absolute bottom-6 right-6 px-4 py-2 rounded-lg bg-[#2a2a2a]/80 border border-[#444] text-[#aaa] text-xs cursor-pointer z-[150] hover:bg-[#333] hover:text-white transition backdrop-blur-sm"
      >
        Exit Viewer
      </button>
    </>
  )
}
