import { useStore } from '../store/useStore'

export default function ConfigPanel() {
  const {
    configOpen, toggleConfig,
    bloomStrength, setBloomStrength,
    bloomRadius, setBloomRadius,
    bloomThreshold, setBloomThreshold,
    emissiveIntensity, setEmissiveIntensity,
    exposure, setExposure,
    showAxes, setShowAxes,
  } = useStore()

  if (!configOpen) return null

  return (
    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-80 bg-slate-950/95 border border-indigo-500/40 rounded-xl p-4 backdrop-blur-md z-[200]">
      <h4 className="text-amber-400 font-semibold text-sm mb-3">⚙️ Configuración Gráfica</h4>

      <Slider label="Bloom Intensidad" value={bloomStrength} onChange={setBloomStrength} min={0} max={3} step={0.1} />
      <Slider label="Bloom Radio" value={bloomRadius} onChange={setBloomRadius} min={0} max={2} step={0.1} />
      <Slider label="Bloom Threshold" value={bloomThreshold} onChange={setBloomThreshold} min={0} max={1} step={0.05} />
      <Slider label="Emissive Global" value={emissiveIntensity} onChange={setEmissiveIntensity} min={0} max={1} step={0.05} />
      <Slider label="Exposición" value={exposure} onChange={setExposure} min={0.5} max={3} step={0.1} />

      <div className="flex items-center justify-between mt-2">
        <span className="text-gray-400 text-xs">Mostrar ejes</span>
        <input type="checkbox" checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)} className="accent-indigo-400" />
      </div>

      <button onClick={toggleConfig}
        className="w-full mt-4 py-1.5 rounded-md bg-white/5 border border-white/15 text-gray-400 text-xs hover:bg-white/10 transition">
        Cerrar
      </button>
    </div>
  )
}

function Slider({ label, value, onChange, min, max, step }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-400 text-xs">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-24 accent-indigo-400" />
      <span className="text-indigo-300 font-mono text-[11px] w-8 text-right">{value}</span>
    </div>
  )
}
