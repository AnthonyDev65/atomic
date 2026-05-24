import { useStore } from '../store/useStore'

export default function Toolbar() {
  const {
    toggleLeftPanel, toggleRightPanel, toggleScript, toggleConfig,
    quality, setQuality, openViewerSetup, viewerMode
  } = useStore()

  if (viewerMode) return null

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
      <button
        onClick={toggleLeftPanel}
        className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs backdrop-blur-md hover:bg-indigo-500/20 transition"
      >
        ◀ Capas
      </button>

      <button
        onClick={toggleScript}
        className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs backdrop-blur-md hover:bg-amber-500/20 transition"
      >
        ⚡ Script
      </button>

      <select
        value={quality}
        onChange={(e) => setQuality(e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs backdrop-blur-md cursor-pointer"
      >
        <option value="low">🔋 Low</option>
        <option value="medium">⚡ Medium</option>
        <option value="high">🔥 High</option>
      </select>

      <button
        onClick={toggleConfig}
        className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs backdrop-blur-md hover:bg-indigo-500/20 transition"
      >
        ⚙️
      </button>

      <button
        onClick={openViewerSetup}
        className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-emerald-500/30 text-emerald-300 text-xs backdrop-blur-md hover:bg-emerald-500/20 transition"
      >
        👁 Ver
      </button>

      <button
        onClick={toggleRightPanel}
        className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-indigo-500/30 text-indigo-300 text-xs backdrop-blur-md hover:bg-indigo-500/20 transition"
      >
        Props ▶
      </button>
    </div>
  )
}
