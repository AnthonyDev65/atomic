import { useStore } from '../store/useStore'

export default function ViewerSetup() {
  const viewerSetupOpen = useStore(s => s.viewerSetupOpen)
  const closeViewerSetup = useStore(s => s.closeViewerSetup)
  const enterViewerMode = useStore(s => s.enterViewerMode)
  const viewerData = useStore(s => s.viewerData)
  const setViewerData = useStore(s => s.setViewerData)

  if (!viewerSetupOpen) return null

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[min(20rem,calc(100vw-1rem))] max-h-[calc(100dvh-4.5rem)] overflow-y-auto bg-[#252525] border border-[#3d3d3d] rounded-lg shadow-xl z-[250]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#3d3d3d]">
        <span className="text-[11px] text-[#888] uppercase tracking-wider font-medium">Viewer Setup</span>
        <button onClick={closeViewerSetup} className="text-[#666] hover:text-white text-xs transition">✕</button>
      </div>

      <div className="p-3 space-y-2.5">
        <Field label="Symbol" value={viewerData.symbol} onChange={(v) => setViewerData({ symbol: v })} className="text-center font-semibold text-base" />
        <Field label="Name" value={viewerData.name} onChange={(v) => setViewerData({ name: v })} />
        <Field label="Atomic number" value={viewerData.z} onChange={(v) => setViewerData({ z: v })} />
        <Field label="Atomic mass" value={viewerData.mass} onChange={(v) => setViewerData({ mass: v })} />
        <Field label="Electron config" value={viewerData.config} onChange={(v) => setViewerData({ config: v })} className="font-mono text-[11px]" />
        <Field label="Extra info" value={viewerData.extra} onChange={(v) => setViewerData({ extra: v })} />

        <div className="pt-2 border-t border-[#333] space-y-1.5">
          <button onClick={enterViewerMode}
            className="w-full py-2 rounded bg-[#2a3a2a] border border-[#3a5a3a] text-[#8c8] text-[11px] font-medium hover:bg-[#304030] transition">
            Enter Viewer Mode
          </button>
          <button onClick={closeViewerSetup}
            className="w-full py-1.5 rounded bg-[#2a2a2a] border border-[#3d3d3d] text-[#888] text-[10px] hover:bg-[#333] transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, className = '' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[#888] min-w-[80px]">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`flex-1 px-2 py-1.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[11px] outline-none focus:border-[#4c8bf5]/60 transition ${className}`}
      />
    </div>
  )
}
