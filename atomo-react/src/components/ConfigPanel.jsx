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
    bgColor, setBgColor,
    showGrid, setShowGrid,
    gridSize, setGridSize,
    gridDivisions, setGridDivisions,
    snapToGrid, setSnapToGrid,
    gridSnap, setGridSnap,
    orbitalMode, setOrbitalMode,
    quality, setQuality,
    smoothShapes, setSmoothShapes,
  } = useStore()

  if (!configOpen) return null

  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[min(18rem,calc(100vw-1rem))] max-h-[calc(100dvh-4.5rem)] overflow-y-auto bg-[#252525] border border-[#3d3d3d] rounded-lg shadow-xl z-[200]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#3d3d3d]">
        <span className="text-[11px] text-[#888] uppercase tracking-wider font-medium">Graphics</span>
        <button onClick={toggleConfig} className="text-[#666] hover:text-white text-xs transition">✕</button>
      </div>

      <div className="p-3 space-y-3">
        {/* Quality presets + shape smoothness toggle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#999]">Quality</span>
            <div className="flex gap-0.5 bg-[#1e1e1e] rounded p-0.5 border border-[#3d3d3d]">
              {['low', 'medium', 'high'].map((q) => (
                <button key={q} onClick={() => setQuality(q)}
                  className={`px-2 py-0.5 rounded text-[9px] transition ${quality === q ? 'bg-[#4c8bf5] text-white' : 'text-[#999] hover:text-white'}`}>
                  {q === 'low' ? 'Low' : q === 'medium' ? 'Med' : 'High'}
                </button>
              ))}
              <span className={`px-2 py-0.5 rounded text-[9px] ${quality === 'custom' ? 'bg-[#7a5acc] text-white' : 'text-[#555]'}`}>Custom</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#999]">Smooth shapes</span>
            <Toggle on={smoothShapes} onClick={() => setSmoothShapes(!smoothShapes)} />
          </div>
          <p className="text-[8px] text-[#555]">Off = faster, more polygonal. On = smoother spheres &amp; orbitals.</p>
        </div>

        <div className="pt-2 border-t border-[#333] space-y-3">
        <Slider label="Bloom Strength" value={bloomStrength} onChange={setBloomStrength} min={0} max={3} step={0.1} />
        <Slider label="Bloom Radius" value={bloomRadius} onChange={setBloomRadius} min={0} max={2} step={0.1} />
        <Slider label="Bloom Threshold" value={bloomThreshold} onChange={setBloomThreshold} min={0} max={1} step={0.05} />
        <Slider label="Emissive" value={emissiveIntensity} onChange={setEmissiveIntensity} min={0} max={1} step={0.05} />
        <Slider label="Exposure" value={exposure} onChange={setExposure} min={0.5} max={3} step={0.1} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#333]">
          <span className="text-[10px] text-[#999]">Background</span>
          <div className="flex items-center gap-2">
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)}
              className="w-7 h-5 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" />
            <span className="text-[9px] text-[#555] font-mono">{bgColor}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#999]">Show axes</span>
          <input type="checkbox" checked={showAxes} onChange={(e) => setShowAxes(e.target.checked)}
            className="w-3.5 h-3.5 accent-[#4c8bf5] cursor-pointer" />
        </div>

        <div className="pt-2 mt-1 border-t border-[#333] space-y-2.5">
          <p className="text-[9px] text-[#666] uppercase tracking-wider font-medium">Grid</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#999]">Show grid</span>
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#4c8bf5] cursor-pointer" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#999]">Snap to grid</span>
            <input type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)}
              className="w-3.5 h-3.5 accent-[#4c8bf5] cursor-pointer" />
          </div>
          <div className="grid grid-cols-[90px_1fr_32px] items-center gap-2">
            <span className="text-[10px] text-[#999]">Grid size</span>
            <input type="range" min={2} max={50} step={2} value={gridSize} onChange={(e) => setGridSize(+e.target.value)}
              className="w-full h-1 accent-[#4c8bf5] cursor-pointer" />
            <span className="text-[10px] text-[#666] font-mono text-right">{gridSize}</span>
          </div>
          <div className="grid grid-cols-[90px_1fr_32px] items-center gap-2">
            <span className="text-[10px] text-[#999]">Divisions</span>
            <input type="range" min={2} max={50} step={2} value={gridDivisions} onChange={(e) => setGridDivisions(+e.target.value)}
              className="w-full h-1 accent-[#4c8bf5] cursor-pointer" />
            <span className="text-[10px] text-[#666] font-mono text-right">{gridDivisions}</span>
          </div>
          <div className="grid grid-cols-[90px_1fr_32px] items-center gap-2">
            <span className="text-[10px] text-[#999]">Snap size</span>
            <input type="range" min={0.1} max={2} step={0.1} value={gridSnap} onChange={(e) => setGridSnap(+e.target.value)}
              className="w-full h-1 accent-[#4c8bf5] cursor-pointer" />
            <span className="text-[10px] text-[#666] font-mono text-right">{gridSnap}</span>
          </div>
          <p className="text-[9px] text-[#555] italic">Hold Ctrl to disable snap</p>
        </div>

        <div className="pt-2 mt-1 border-t border-[#333]">
          <p className="text-[9px] text-[#666] uppercase tracking-wider font-medium mb-2">Orbitals</p>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#999]">Display mode</span>
            <select value={orbitalMode} onChange={(e) => setOrbitalMode(e.target.value)}
              className="px-2 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] outline-none">
              <option value="simple">Simple</option>
              <option value="full">Full shape</option>
            </select>
          </div>
          <p className="text-[8px] text-[#555] mt-1">Simple: path only. Full: solid orbital shape.</p>
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on}
      className={`relative w-9 h-5 rounded-full transition-colors ${on ? 'bg-[#4c8bf5]' : 'bg-[#3d3d3d]'}`}>
      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
    </button>
  )
}

function Slider({ label, value, onChange, min, max, step }) {
  return (
    <div className="grid grid-cols-[90px_1fr_32px] items-center gap-2">
      <span className="text-[10px] text-[#999] truncate">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full h-1 accent-[#4c8bf5] cursor-pointer" />
      <span className="text-[10px] text-[#666] font-mono text-right">{value}</span>
    </div>
  )
}
