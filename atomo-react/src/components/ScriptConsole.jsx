import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'

const EXAMPLE = `// Neon (Z=10) — with orbiting electrons
limpiar()

// Nucleus
repetir(10, () => esfera(
  (Math.random()-0.5)*0.35,
  (Math.random()-0.5)*0.35,
  (Math.random()-0.5)*0.35,
  '#ff2222', 0.12, 'P'
))
repetir(10, () => esfera(
  (Math.random()-0.5)*0.35,
  (Math.random()-0.5)*0.35,
  (Math.random()-0.5)*0.35,
  '#2255ff', 0.12, 'N'
))

// Shell K: 2 electrons
orbital(2, 0.8, 3, '#ff4444', '#66ffff', '#66ffff')

// Shell L: 8 electrons
orbital(8, 1.6, 2, '#ff4444', '#aa88ff', '#aa88ff')`

export default function ScriptConsole() {
  const { scriptOpen, toggleScript, addLayer, incrementCounter, clearLayers } = useStore()
  const [code, setCode] = useState(EXAMPLE)
  const [output, setOutput] = useState([])
  const textareaRef = useRef()
  const highlightRef = useRef()

  useEffect(() => {
    if (scriptOpen && textareaRef.current) textareaRef.current.focus()
  }, [scriptOpen])

  if (!scriptOpen) return null

  const log = (msg, type = 'ok') => setOutput(prev => [...prev, { msg, type }])

  const run = () => {
    setOutput([])
    const DEG = Math.PI / 180
    const store = useStore.getState()

    const fns = {
      // === Primitives ===
      esfera: (x = 0, y = 0, z = 0, color = '#ff4444', size = 0.5, label = '') => {
        addLayer({ id: crypto.randomUUID(), name: label || `sphere_${incrementCounter()}`, type: 'sphere', color, position: [x, y, z], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true, opacity: 1, sphereRadius: size, label })
      },
      cubo: (x = 0, y = 0, z = 0, color = '#ffffff', size = 1) => {
        addLayer({ id: crypto.randomUUID(), name: `box_${incrementCounter()}`, type: 'box', color, position: [x, y, z], rotation: [0, 0, 0], scale: [size, size, size], visible: true, opacity: 1 })
      },
      torus: (x = 0, y = 0, z = 0, color = '#4466ff', radio = 1, grosor = 0.05, rx = 0, ry = 0, rz = 0) => {
        addLayer({ id: crypto.randomUUID(), name: `torus_${incrementCounter()}`, type: 'torus', color, position: [x, y, z], rotation: [rx * DEG, ry * DEG, rz * DEG], scale: [1, 1, 1], visible: true, opacity: 1, torusRadius: radio, tubeThickness: grosor })
      },
      cilindro: (x = 0, y = 0, z = 0, color = '#ffffff', size = 1) => {
        addLayer({ id: crypto.randomUUID(), name: `cyl_${incrementCounter()}`, type: 'cylinder', color, position: [x, y, z], rotation: [0, 0, 0], scale: [size, size, size], visible: true, opacity: 1 })
      },
      cono: (x = 0, y = 0, z = 0, color = '#ffffff', size = 1) => {
        addLayer({ id: crypto.randomUUID(), name: `cone_${incrementCounter()}`, type: 'cone', color, position: [x, y, z], rotation: [0, 0, 0], scale: [size, size, size], visible: true, opacity: 1 })
      },
      plano: (x = 0, y = 0, z = 0, color = '#ffffff', size = 1) => {
        addLayer({ id: crypto.randomUUID(), name: `plane_${incrementCounter()}`, type: 'plane', color, position: [x, y, z], rotation: [0, 0, 0], scale: [size, size, size], visible: true, opacity: 1 })
      },
      icosaedro: (x = 0, y = 0, z = 0, color = '#ffffff', size = 0.5) => {
        addLayer({ id: crypto.randomUUID(), name: `ico_${incrementCounter()}`, type: 'icosahedron', color, position: [x, y, z], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true, opacity: 1, sphereRadius: size })
      },

      // === Atomic shortcuts ===
      proton: (x = 0, y = 0, z = 0, size = 0.12) => {
        addLayer({ id: crypto.randomUUID(), name: `P_${incrementCounter()}`, type: 'sphere', color: '#ff2222', position: [x, y, z], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true, opacity: 1, sphereRadius: size, label: 'P' })
      },
      neutron: (x = 0, y = 0, z = 0, size = 0.12) => {
        addLayer({ id: crypto.randomUUID(), name: `N_${incrementCounter()}`, type: 'sphere', color: '#2255ff', position: [x, y, z], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true, opacity: 1, sphereRadius: size, label: 'N' })
      },
      electron: (x = 0, y = 0, z = 0, size = 0.06) => {
        addLayer({ id: crypto.randomUUID(), name: `e_${incrementCounter()}`, type: 'sphere', color: '#44ffff', position: [x, y, z], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true, opacity: 1, sphereRadius: size, label: 'e' })
      },
      orbital: (numElectrons = 3, radio = 1.5, speed = 2, colorNucleo = '#ff4444', electronColor = '#44aaff', orbitColor = '#6688ff', electronSize = 0.06, grosor = 0.012) => {
        // Compatible with HTML version: orbital(electrons, radius, speed, nucleusColor, electronColor, orbitColor)
        const tiltX = (60 + Math.random() * 60) * DEG
        const tiltZ = Math.random() * 360 * DEG
        // Create orbit ring
        addLayer({ id: crypto.randomUUID(), name: `orb_${incrementCounter()}`, type: 'torus', color: orbitColor, position: [0, 0, 0], rotation: [tiltX, 0, tiltZ], scale: [1, 1, 1], visible: true, opacity: 0.7, torusRadius: radio, tubeThickness: grosor })
        // Create orbiting electrons
        for (let i = 0; i < numElectrons; i++) {
          const angle = (Math.PI * 2 / numElectrons) * i
          addLayer({ id: crypto.randomUUID(), name: `e_${incrementCounter()}`, type: 'sphere', color: electronColor, position: [radio, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1], visible: true, opacity: 1, sphereRadius: electronSize, label: 'e',
            orbital: { radius: radio, speed, angle, tiltX, tiltZ } })
        }
      },

      // === Generators ===
      nucleo: (protones = 6, neutrones = 6, radio = 0.35, size = 0.12) => {
        for (let i = 0; i < protones; i++) {
          const r = radio * Math.cbrt(Math.random())
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          fns.proton(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi), size)
        }
        for (let i = 0; i < neutrones; i++) {
          const r = radio * Math.cbrt(Math.random())
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          fns.neutron(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi), size)
        }
      },
      capas: (config, radio = 1, grosor = 0.01, color = '#6688ff', electronColor = '#44aaff', speed = 2) => {
        config.forEach((n, i) => {
          const r = radio * (i + 1)
          fns.orbital(n, r, speed + i * 0.3, '#ff4444', electronColor, color, 0.06, grosor)
        })
      },
      atomo: (protones, neutrones, capasElectronicas, opts = {}) => {
        const { radioNucleo = 0.35, sizeNucleon = 0.12, radioBase = 0.8, grosorOrbita = 0.01, colorOrbita = '#6688ff', colorElectron = '#44aaff', speed = 2 } = opts
        fns.nucleo(protones, neutrones, radioNucleo, sizeNucleon)
        if (capasElectronicas) fns.capas(capasElectronicas, radioBase, grosorOrbita, colorOrbita, colorElectron, speed)
      },

      // === Utilities ===
      limpiar: () => clearLayers(),
      repetir: (n, fn) => { for (let i = 0; i < n; i++) fn(i) },
      aleatorio: (min = 0, max = 1) => Math.random() * (max - min) + min,
      color: (r, g, b) => `#${Math.round(r*255).toString(16).padStart(2,'0')}${Math.round(g*255).toString(16).padStart(2,'0')}${Math.round(b*255).toString(16).padStart(2,'0')}`,
      log: (msg) => log(String(msg)),

      // === Math helpers exposed ===
      PI: Math.PI,
      sin: Math.sin,
      cos: Math.cos,
      sqrt: Math.sqrt,
      random: Math.random,
      abs: Math.abs,
    }

    try {
      const fn = new Function(...Object.keys(fns), code)
      fn(...Object.values(fns))
      log(`Done — ${useStore.getState().layers.length} objects in scene`)
    } catch (err) {
      log(`Error: ${err.message}`, 'err')
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); run() }
    if (e.key === 'Escape') toggleScript()
    // Tab indent
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newCode = code.substring(0, start) + '  ' + code.substring(end)
      setCode(newCode)
      setTimeout(() => { e.target.selectionStart = e.target.selectionEnd = start + 2 }, 0)
    }
  }

  const highlighted = highlightSyntax(code)

  return (
    <div className="absolute inset-0 z-[300] flex flex-col bg-[#1b1b1f]/85 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#2d2d2d] shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-[#e0e0e0] text-sm font-medium">Script Editor</h2>
          <span className="text-[10px] text-[#555] bg-[#252525] px-2 py-0.5 rounded">Ctrl+Enter to run</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={run}
            className="px-4 py-1.5 rounded bg-[#2ea043] text-white text-[11px] font-medium hover:bg-[#3ab54f] transition">
            Run
          </button>
          <button onClick={() => setCode(EXAMPLE)}
            className="px-3 py-1.5 rounded bg-[#2a2a2a] border border-[#3d3d3d] text-[#888] text-[11px] hover:text-white transition">
            Example
          </button>
          <button onClick={toggleScript}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#333] text-[#888] hover:text-white transition">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Code editor */}
        <div className="flex-1 relative overflow-hidden bg-[#0d1117]">
          {/* Syntax highlight layer */}
          <pre
            ref={highlightRef}
            className="absolute inset-0 p-5 font-mono text-[12px] leading-[1.6] overflow-auto pointer-events-none whitespace-pre-wrap break-words text-[#c9d1d9]"
            dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
          />
          {/* Textarea (transparent text, visible caret) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKey}
            onScroll={(e) => { if (highlightRef.current) highlightRef.current.scrollTop = e.target.scrollTop }}
            className="absolute inset-0 w-full h-full p-5 font-mono text-[12px] leading-[1.6] bg-transparent text-transparent caret-white resize-none outline-none whitespace-pre-wrap break-words"
            spellCheck={false}
            autoComplete="off"
          />
        </div>

        {/* Output panel */}
        <div className="w-72 border-l border-[#2d2d2d] flex flex-col shrink-0">
          <div className="px-3 py-2 border-b border-[#2d2d2d]">
            <span className="text-[10px] text-[#666] uppercase tracking-wider">Output</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px]">
            {output.length === 0 && <p className="text-[#444]">Run script to see output...</p>}
            {output.map((o, i) => (
              <div key={i} className={`mb-1 ${o.type === 'err' ? 'text-[#f47067]' : 'text-[#7ee787]'}`}>
                <span className="text-[#555] mr-1">{o.type === 'err' ? '✗' : '✓'}</span>
                {o.msg}
              </div>
            ))}
          </div>
          {/* API reference */}
          <div className="border-t border-[#2d2d2d] p-3 text-[10px] text-[#555] leading-relaxed shrink-0 overflow-y-auto max-h-48">
            <p className="text-[#777] font-medium mb-1">Primitives</p>
            <p><span className="text-[#79c0ff]">esfera</span>(x, y, z, color, size, label)</p>
            <p><span className="text-[#79c0ff]">cubo</span>(x, y, z, color, size)</p>
            <p><span className="text-[#79c0ff]">torus</span>(x, y, z, color, radio, grosor, rx°, ry°, rz°)</p>
            <p><span className="text-[#79c0ff]">cilindro</span>(x, y, z, color, size)</p>
            <p><span className="text-[#79c0ff]">cono</span>(x, y, z, color, size)</p>
            <p><span className="text-[#79c0ff]">plano</span>(x, y, z, color, size)</p>
            <p><span className="text-[#79c0ff]">icosaedro</span>(x, y, z, color, size)</p>
            <p className="text-[#777] font-medium mt-2 mb-1">Atomic</p>
            <p><span className="text-[#d2a8ff]">proton</span>(x, y, z, size)</p>
            <p><span className="text-[#d2a8ff]">neutron</span>(x, y, z, size)</p>
            <p><span className="text-[#d2a8ff]">electron</span>(x, y, z, size)</p>
            <p><span className="text-[#d2a8ff]">orbital</span>(radio, grosor, rx°, ry°, rz°, color)</p>
            <p><span className="text-[#d2a8ff]">nucleo</span>(protones, neutrones, radio, size)</p>
            <p><span className="text-[#d2a8ff]">capas</span>([2,8,18], radio, grosor, color)</p>
            <p><span className="text-[#d2a8ff]">atomo</span>(Z, N, [capas], opts)</p>
            <p className="text-[#777] font-medium mt-2 mb-1">Utilities</p>
            <p><span className="text-[#7ee787]">repetir</span>(n, fn) · <span className="text-[#7ee787]">limpiar</span>()</p>
            <p><span className="text-[#7ee787]">aleatorio</span>(min, max) · <span className="text-[#7ee787]">color</span>(r, g, b)</p>
            <p><span className="text-[#7ee787]">log</span>(msg) · PI · sin · cos · sqrt · random</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function highlightSyntax(code) {
  const lines = code.split('\n')
  return lines.map(line => {
    const commentIdx = line.indexOf('//')
    let codePart = commentIdx >= 0 ? line.substring(0, commentIdx) : line
    let commentHtml = commentIdx >= 0 ? `<span style="color:#6a737d">${esc(line.substring(commentIdx))}</span>` : ''

    // Tokenize the code part to avoid nested replacements
    let result = ''
    let i = 0
    while (i < codePart.length) {
      // String literals
      if (codePart[i] === "'" || codePart[i] === '"') {
        const quote = codePart[i]
        let end = codePart.indexOf(quote, i + 1)
        if (end === -1) end = codePart.length - 1
        result += `<span style="color:#a5d6ff">${esc(codePart.substring(i, end + 1))}</span>`
        i = end + 1
        continue
      }
      // Word tokens
      const wordMatch = codePart.substring(i).match(/^[a-zA-Z_]\w*/)
      if (wordMatch) {
        const word = wordMatch[0]
        const kwColor = getWordColor(word)
        if (kwColor) {
          result += `<span style="color:${kwColor}">${word}</span>`
        } else {
          result += esc(word)
        }
        i += word.length
        continue
      }
      // Numbers
      const numMatch = codePart.substring(i).match(/^\d+\.?\d*/)
      if (numMatch) {
        result += `<span style="color:#79c0ff">${numMatch[0]}</span>`
        i += numMatch[0].length
        continue
      }
      // Other characters
      result += esc(codePart[i])
      i++
    }

    return result + commentHtml
  }).join('\n')
}

function getWordColor(word) {
  const keywords = new Set(['const','let','var','function','return','if','else','for','while','new','true','false','null','undefined'])
  const primitives = new Set(['esfera','cubo','torus','cilindro','cono','plano','icosaedro','proton','neutron','electron','orbital','nucleo','capas','atomo'])
  const utils = new Set(['repetir','limpiar','aleatorio','color','log','PI','sin','cos','sqrt','random','abs','Math'])

  if (keywords.has(word)) return '#ff7b72'
  if (primitives.has(word)) return '#d2a8ff'
  if (utils.has(word)) return '#7ee787'
  return null
}

function esc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
