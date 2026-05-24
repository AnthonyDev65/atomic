import { useStore } from '../store/useStore'
import { useState } from 'react'

const SHAPES = [
  { id: 'sphere', icon: '⚪', label: 'Esfera' },
  { id: 'box', icon: '⬜', label: 'Cubo' },
  { id: 'torus', icon: '⭕', label: 'Torus' },
  { id: 'cylinder', icon: '🔷', label: 'Cilindro' },
  { id: 'cone', icon: '🔺', label: 'Cono' },
  { id: 'icosahedron', icon: '🔶', label: 'Icosaedro' },
  { id: 'plane', icon: '📄', label: 'Plano' },
]

const ICONS = { sphere: '⚪', box: '⬜', torus: '⭕', cylinder: '🔷', cone: '🔺', icosahedron: '🔶', plane: '📄', particles: '✨' }

export default function LayersPanel() {
  const { layers, selectedId, setSelected, leftPanelOpen, viewerMode, addLayer, incrementCounter, updateLayer } = useStore()
  const [color, setColor] = useState('#ff4444')
  const [label, setLabel] = useState('')
  const [size, setSize] = useState(0.5)
  const [range, setRange] = useState(0.5)

  if (!leftPanelOpen || viewerMode) return null

  const addObject = (shape) => {
    const id = crypto.randomUUID()
    const r = range
    addLayer({
      id,
      name: label || `${shape}_${incrementCounter()}`,
      type: shape,
      color,
      position: [(Math.random() - 0.5) * r * 2, (Math.random() - 0.5) * r * 2, (Math.random() - 0.5) * r * 2],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      opacity: 1,
      sphereRadius: size,
      label: label,
    })
  }

  return (
    <div className="absolute top-14 left-4 w-60 max-h-[85vh] overflow-y-auto bg-slate-950/95 border border-indigo-500/30 rounded-xl p-4 backdrop-blur-md z-40 transition-all">
      <h3 className="text-indigo-300 font-semibold text-sm mb-3">📋 Capas</h3>

      {/* Layer list */}
      <div className="space-y-1 mb-4 max-h-40 overflow-y-auto">
        {layers.slice(0, 50).map((layer) => (
          <div
            key={layer.id}
            onClick={() => setSelected(layer.id)}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition ${
              selectedId === layer.id
                ? 'bg-indigo-500/20 border border-indigo-500/40 text-white'
                : 'hover:bg-indigo-500/10 text-gray-400'
            }`}
          >
            <span>{ICONS[layer.type] || '📦'}</span>
            <span className="flex-1 truncate">{layer.name}</span>
            <span
              className={`text-[10px] cursor-pointer ${layer.visible ? 'opacity-60' : 'opacity-30'}`}
              onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }}
            >
              {layer.visible ? '👁' : '👁‍🗨'}
            </span>
          </div>
        ))}
        {layers.length > 50 && (
          <p className="text-center text-[10px] text-gray-500 pt-2">...y {layers.length - 50} más ({layers.length} total)</p>
        )}
      </div>

      {/* Add objects */}
      <div className="border-t border-white/10 pt-3">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">➕ Agregar objeto</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SHAPES.map((s) => (
            <button
              key={s.id}
              onClick={() => addObject(s.id)}
              className="px-2 py-1.5 rounded-md bg-white/5 border border-white/10 text-gray-400 text-[11px] hover:bg-indigo-500/20 hover:border-indigo-500/40 hover:text-white transition"
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          <label className="block">
            <span className="text-[10px] text-gray-500">Color:</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-7 rounded-md cursor-pointer bg-transparent border-0 mt-1" />
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500">Etiqueta:</span>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="P, N, e⁻..." maxLength={4}
              className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/15 rounded-md text-white text-xs text-center" />
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500">Tamaño:</span>
            <input type="number" value={size} onChange={(e) => setSize(+e.target.value)} min={0.05} max={5} step={0.05}
              className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/15 rounded-md text-white text-xs text-center" />
          </label>
          <label className="block">
            <span className="text-[10px] text-gray-500">Rango posición:</span>
            <input type="number" value={range} onChange={(e) => setRange(+e.target.value)} min={0.1} max={10} step={0.1}
              className="w-full mt-1 px-2 py-1.5 bg-white/5 border border-white/15 rounded-md text-white text-xs text-center" />
          </label>
        </div>
      </div>
    </div>
  )
}
