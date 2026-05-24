import { useStore } from '../store/useStore'

export default function PropertiesPanel() {
  const { layers, selectedId, rightPanelOpen, viewerMode, updateLayer, removeLayer, deselect } = useStore()

  if (!rightPanelOpen || viewerMode || !selectedId) return null

  const layer = layers.find(l => l.id === selectedId)
  if (!layer) return null

  const update = (field, value) => updateLayer(selectedId, { [field]: value })
  const pos = layer.position || [0, 0, 0]
  const scale = layer.scale || [1, 1, 1]
  const rot = layer.rotation || [0, 0, 0]

  return (
    <div className="absolute top-14 right-4 w-72 max-h-[85vh] overflow-y-auto bg-slate-950/95 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-md z-40">
      <h3 className="text-indigo-300 font-semibold text-sm mb-3">🎛 Propiedades</h3>
      <div className="px-2 py-1.5 bg-indigo-500/10 rounded-md text-white text-xs font-medium mb-3 break-all">
        {layer.name}
      </div>

      {/* Color & Opacity */}
      <Section title="🎨 Color">
        <Row label="Color">
          <input type="color" value={layer.color} onChange={(e) => update('color', e.target.value)}
            className="w-12 h-7 border-0 cursor-pointer bg-transparent" />
        </Row>
        <Row label="Opacidad">
          <input type="range" min={0.05} max={1} step={0.05} value={layer.opacity ?? 1}
            onChange={(e) => update('opacity', +e.target.value)}
            className="w-24 accent-indigo-400" />
          <span className="text-indigo-300 font-mono text-[11px] w-8 text-right">{(layer.opacity ?? 1).toFixed(2)}</span>
        </Row>
      </Section>

      {/* Position */}
      <Section title="Posición">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <Row key={axis} label={axis}>
            <input type="number" step={0.1} value={pos[i]?.toFixed(2)}
              onChange={(e) => { const p = [...pos]; p[i] = +e.target.value; update('position', p) }}
              className="w-16 px-1 py-0.5 bg-white/5 border border-white/15 rounded text-white text-xs text-center" />
          </Row>
        ))}
      </Section>

      {/* Scale */}
      <Section title="Escala">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <Row key={axis} label={axis}>
            <input type="number" step={0.1} min={0.01} value={scale[i]?.toFixed(2)}
              onChange={(e) => {
                const v = +e.target.value
                update('scale', [v, v, v]) // uniform by default
              }}
              className="w-16 px-1 py-0.5 bg-white/5 border border-white/15 rounded text-white text-xs text-center" />
          </Row>
        ))}
      </Section>

      {/* Rotation */}
      <Section title="Rotación (grados)">
        {['X', 'Y', 'Z'].map((axis, i) => (
          <Row key={axis} label={axis}>
            <input type="number" step={5} value={Math.round((rot[i] || 0) * 180 / Math.PI)}
              onChange={(e) => { const r = [...rot]; r[i] = +e.target.value * Math.PI / 180; update('rotation', r) }}
              className="w-16 px-1 py-0.5 bg-white/5 border border-white/15 rounded text-white text-xs text-center" />
          </Row>
        ))}
      </Section>

      {/* Actions */}
      <div className="mt-4 space-y-2">
        <button onClick={() => { removeLayer(selectedId); deselect() }}
          className="w-full py-2 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 text-xs hover:bg-red-500/30 transition">
          🗑 Eliminar objeto
        </button>
        <button onClick={deselect}
          className="w-full py-2 rounded-md bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs hover:bg-indigo-500/25 transition">
          Deseleccionar
        </button>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">{title}</p>
      {children}
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-gray-400 text-xs min-w-[60px]">{label}</span>
      <div className="flex items-center gap-1">{children}</div>
    </div>
  )
}
