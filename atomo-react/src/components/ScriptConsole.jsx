import { useState } from 'react'
import { useStore } from '../store/useStore'

export default function ScriptConsole() {
  const { scriptOpen, toggleScript, addLayer, incrementCounter, clearLayers } = useStore()
  const [code, setCode] = useState(`// Comandos: esfera(x,y,z,color,size,label) · orbital(n,r,v) · torus(x,y,z,color,r,t,rx,ry,rz) · limpiar()
esfera(0, 0, 0, '#ff0000', 0.3, 'P')
esfera(0.2, 0.1, 0, '#0044ff', 0.3, 'N')`)
  const [output, setOutput] = useState([])

  if (!scriptOpen) return null

  const log = (msg, type = 'ok') => setOutput(prev => [...prev, { msg, type }])

  const run = () => {
    setOutput([])
    const fns = {
      esfera: (x = 0, y = 0, z = 0, color = '#ff4444', size = 0.5, label = '') => {
        addLayer({
          id: crypto.randomUUID(),
          name: label || `Esfera_${incrementCounter()}`,
          type: 'sphere', color,
          position: [x, y, z], rotation: [0, 0, 0], scale: [1, 1, 1],
          visible: true, opacity: 1, sphereRadius: size, label,
        })
      },
      torus: (x = 0, y = 0, z = 0, color = '#4466ff', radio = 1, grosor = 0.05, rx = 0, ry = 0, rz = 0) => {
        const DEG = Math.PI / 180
        addLayer({
          id: crypto.randomUUID(),
          name: `Torus_${incrementCounter()}`,
          type: 'torus', color,
          position: [x, y, z], rotation: [rx * DEG, ry * DEG, rz * DEG], scale: [1, 1, 1],
          visible: true, opacity: 1, torusRadius: radio, tubeThickness: grosor,
        })
      },
      limpiar: () => clearLayers(),
      repetir: (n, fn) => { for (let i = 0; i < n; i++) fn(i) },
    }

    try {
      const fn = new Function(...Object.keys(fns), code)
      fn(...Object.values(fns))
      log(`✓ Ejecutado (${useStore.getState().layers.length} objetos)`)
    } catch (err) {
      log('✗ ' + err.message, 'err')
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); run() }
  }

  return (
    <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] bg-slate-950/95 border border-indigo-500/40 rounded-xl p-3 backdrop-blur-md z-[200]">
      <h4 className="text-amber-400 text-xs font-semibold mb-2">⚡ Consola de Scripts <span className="text-gray-500 font-normal">(Ctrl+Enter para ejecutar)</span></h4>

      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={handleKey}
        className="w-full h-28 bg-black/50 border border-white/10 text-green-300 font-mono text-xs rounded-md p-2 resize-y outline-none focus:border-indigo-500/50"
      />

      {output.length > 0 && (
        <div className="max-h-14 overflow-y-auto mt-1.5 px-2 py-1 bg-black/30 rounded text-[11px] font-mono">
          {output.map((o, i) => (
            <div key={i} className={o.type === 'err' ? 'text-red-400' : 'text-green-300'}>{o.msg}</div>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <button onClick={run}
          className="px-4 py-1.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs hover:bg-emerald-500/30 transition">
          ▶ Ejecutar
        </button>
        <button onClick={toggleScript}
          className="px-4 py-1.5 rounded-md bg-red-500/20 border border-red-500/40 text-red-300 text-xs hover:bg-red-500/30 transition">
          ✕ Cerrar
        </button>
      </div>

      <p className="text-gray-600 text-[9px] font-mono mt-2 leading-relaxed">
        esfera(x,y,z,color,size,label) · torus(x,y,z,color,radio,grosor,rotX°,rotY°,rotZ°) · repetir(n, fn) · limpiar()
      </p>
    </div>
  )
}
