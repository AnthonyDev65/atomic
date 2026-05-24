import { useStore } from '../store/useStore'

export default function ViewerSetup() {
  const { viewerSetupOpen, closeViewerSetup, enterViewerMode, viewerData, setViewerData } = useStore()

  if (!viewerSetupOpen) return null

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-96 bg-slate-950/95 border border-emerald-500/40 rounded-xl p-5 backdrop-blur-md z-[250]">
      <h4 className="text-emerald-300 font-semibold text-sm mb-4">👁 Configurar Modo Visualizador</h4>

      <Field label="Símbolo del elemento" value={viewerData.symbol}
        onChange={(v) => setViewerData({ symbol: v })} className="text-lg font-bold text-center" />
      <Field label="Nombre" value={viewerData.name} onChange={(v) => setViewerData({ name: v })} />
      <Field label="Número atómico (Z)" value={viewerData.z} onChange={(v) => setViewerData({ z: v })} />
      <Field label="Masa atómica" value={viewerData.mass} onChange={(v) => setViewerData({ mass: v })} />
      <Field label="Config. electrónica (^ para superíndice)" value={viewerData.config}
        onChange={(v) => setViewerData({ config: v })} className="font-mono" />
      <Field label="Info extra" value={viewerData.extra} onChange={(v) => setViewerData({ extra: v })} />

      <button onClick={enterViewerMode}
        className="w-full mt-4 py-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/30 transition">
        ▶ Entrar al Modo Visualizador
      </button>
      <button onClick={closeViewerSetup}
        className="w-full mt-2 py-1.5 rounded-md bg-white/5 border border-white/15 text-gray-400 text-xs hover:bg-white/10 transition">
        Cancelar
      </button>
    </div>
  )
}

function Field({ label, value, onChange, className = '' }) {
  return (
    <label className="block mb-2.5">
      <span className="text-[10px] text-gray-500">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full mt-1 px-3 py-2 bg-white/5 border border-white/15 rounded-md text-white text-sm focus:border-indigo-500/50 outline-none transition ${className}`}
      />
    </label>
  )
}
