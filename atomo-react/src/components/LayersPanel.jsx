import { useStore } from '../store/useStore'
import { useState, useRef } from 'react'
import { SphereIcon, BoxIcon, TorusIcon, PlaneIcon } from './Icons'

const SHAPES = [
  { id: 'sphere', label: 'Sphere', icon: SphereIcon },
  { id: 'box', label: 'Box', icon: BoxIcon },
  { id: 'cylinder', label: 'Cylinder', icon: null },
  { id: 'cone', label: 'Cone', icon: null },
  { id: 'icosahedron', label: 'Icosahedron', icon: null },
  { id: 'plane', label: 'Plane', icon: PlaneIcon },
  { id: 'wave_sphere', label: 'Wave Cloud', icon: null },
  { id: 'torus', label: 'Orbital S', icon: TorusIcon },
  { id: 'orbital_p', label: 'Orbital P', icon: null },
  { id: 'orbital_d', label: 'Orbital D', icon: null },
  { id: 'orbital_f', label: 'Orbital F', icon: null },
]

export default function LayersPanel() {
  const { leftPanelOpen, viewerMode } = useStore()

  if (!leftPanelOpen || viewerMode) return null

  return (
    <div className="absolute top-12 md:top-3 left-2 md:left-3 bottom-2 md:bottom-3 w-[min(18rem,calc(100vw-1rem))] md:w-56 flex flex-col gap-2 z-40">
      <AddPanel />
      <LayersListPanel />
    </div>
  )
}

// ===== ADD PANEL (top, fixed height) =====
function AddPanel() {
  const [tab, setTab] = useState('objects') // 'objects' | 'orbital' | 'nucleus' | 'particles'

  return (
    <div className="bg-[#252525] border border-[#3d3d3d] rounded-lg shadow-xl overflow-hidden shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-[#3d3d3d]">
        <MiniTab active={tab === 'objects'} onClick={() => setTab('objects')}>Objects</MiniTab>
        <MiniTab active={tab === 'orbital'} onClick={() => setTab('orbital')}>Orbital</MiniTab>
        <MiniTab active={tab === 'nucleus'} onClick={() => setTab('nucleus')}>Nucleus</MiniTab>
        <MiniTab active={tab === 'particles'} onClick={() => setTab('particles')}>Particles</MiniTab>
      </div>
      <div className="p-2.5">
        {tab === 'objects' && <ObjectsTab />}
        {tab === 'orbital' && <OrbitalTab />}
        {tab === 'nucleus' && <NucleusTab />}
        {tab === 'particles' && <ParticlesTab />}
      </div>
    </div>
  )
}

function MiniTab({ children, active, onClick }) {
  return (
    <button onClick={onClick}
      className={`flex-1 py-1.5 text-[9px] font-medium transition ${active ? 'text-white border-b border-[#4c8bf5]' : 'text-[#666] hover:text-[#aaa]'}`}>
      {children}
    </button>
  )
}

function ObjectsTab() {
  const { addLayer, incrementCounter } = useStore()
  const [color, setColor] = useState('#ff4444')
  const [label, setLabel] = useState('')
  const [size, setSize] = useState(0.5)
  const [range, setRange] = useState(0.5)

  const addObject = (shape) => {
    const r = range
    const isOrbital = shape === 'torus' || shape.startsWith('orbital_')
    const isWave = shape === 'wave_sphere'
    addLayer({
      id: crypto.randomUUID(),
      name: label || `${shape}_${incrementCounter()}`,
      type: shape, color,
      position: (isOrbital || isWave) ? [0, 0, 0] : [(Math.random() - 0.5) * r * 2, (Math.random() - 0.5) * r * 2, (Math.random() - 0.5) * r * 2],
      rotation: [0, 0, 0], scale: [1, 1, 1],
      visible: true, opacity: isOrbital ? 0.7 : isWave ? 0.35 : 1,
      sphereRadius: size,
      torusRadius: (isOrbital || isWave) ? size : undefined,
      tubeThickness: isOrbital ? 0.015 : undefined,
      pathOffset: 0,
      waveAmplitude: isWave ? 0.15 : undefined,
      waveFrequency: isWave ? 3 : undefined,
      waveSpeed: isWave ? 1 : undefined,
      waveWireframe: false,
      label,
    })
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-2 gap-1">
        {SHAPES.map((s) => (
          <button key={s.id} onClick={() => addObject(s.id)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded bg-[#2f2f2f] border border-[#3a3a3a] text-[#bbb] text-[10px] hover:bg-[#383838] hover:border-[#4c8bf5]/50 hover:text-white active:bg-[#4c8bf5]/30 transition">
            {s.icon && <s.icon size={12} />}
            {s.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5 pt-2 border-t border-[#333]">
        <Row label="Color">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-7 h-5 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" />
        </Row>
        <Row label="Label">
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="P, N..." maxLength={4}
            className="w-20 px-2 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" />
        </Row>
        <Row label="Size">
          <input type="number" value={size} onChange={(e) => setSize(+e.target.value)} min={0.05} max={5} step={0.05}
            className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" />
        </Row>
        <Row label="Range">
          <input type="number" value={range} onChange={(e) => setRange(+e.target.value)} min={0.1} max={10} step={0.1}
            className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" />
        </Row>
      </div>
    </div>
  )
}

function OrbitalTab() {
  const { addLayer, addGroup, addToGroup, incrementCounter } = useStore()
  const [electrons, setElectrons] = useState(3)
  const [radius, setRadius] = useState(1.5)
  const [nucleusSize, setNucleusSize] = useState(0.4)
  const [electronSize, setElectronSize] = useState(0.15)
  const [nucleusColor, setNucleusColor] = useState('#ff4444')
  const [electronColor, setElectronColor] = useState('#44aaff')
  const [orbitColor, setOrbitColor] = useState('#4466ff')
  const [speed, setSpeed] = useState(2)

  const DEG = Math.PI / 180

  const create = () => {
    const groupId = addGroup(`Orbital_${incrementCounter()}`)

    // Nucleus
    const nId = crypto.randomUUID()
    addLayer({ id: nId, name: `nucleus`, type: 'sphere', color: nucleusColor,
      position: [0, 0, 0], rotation: [0, 0, 0], scale: [nucleusSize * 2, nucleusSize * 2, nucleusSize * 2],
      visible: true, opacity: 1, sphereRadius: 0.5 })
    addToGroup(groupId, nId)

    // Orbits + electrons
    for (let i = 0; i < electrons; i++) {
      const tiltX = (Math.random() - 0.5) * Math.PI * 0.8
      const tiltZ = (Math.random() - 0.5) * Math.PI * 0.8

      const oId = crypto.randomUUID()
      addLayer({ id: oId, name: `orbit_${i + 1}`, type: 'torus', color: orbitColor,
        position: [0, 0, 0], rotation: [Math.PI / 2 + tiltX, 0, tiltZ], scale: [1, 1, 1],
        visible: true, opacity: 0.6, torusRadius: radius, tubeThickness: 0.015 })
      addToGroup(groupId, oId)

      const angle = (Math.PI * 2 / electrons) * i
      const x = radius * Math.cos(angle)
      const z = radius * Math.sin(angle)
      const eId = crypto.randomUUID()
      addLayer({ id: eId, name: `e⁻_${i + 1}`, type: 'sphere', color: electronColor,
        position: [x, 0, z], rotation: [0, 0, 0], scale: [1, 1, 1],
        visible: true, opacity: 1, sphereRadius: electronSize, label: 'e',
        orbital: { radius, speed, angle, tiltX: Math.PI / 2 + tiltX, tiltZ } })
      addToGroup(groupId, eId)
    }
  }

  return (
    <div className="space-y-1.5">
      <Row label="Electrons"><input type="number" value={electrons} onChange={(e) => setElectrons(+e.target.value)} min={1} max={8}
        className="w-12 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Radius"><input type="number" value={radius} onChange={(e) => setRadius(+e.target.value)} min={0.5} max={10} step={0.1}
        className="w-12 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Nucleus"><input type="number" value={nucleusSize} onChange={(e) => setNucleusSize(+e.target.value)} min={0.1} max={2} step={0.1}
        className="w-12 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="e⁻ size"><input type="number" value={electronSize} onChange={(e) => setElectronSize(+e.target.value)} min={0.05} max={0.5} step={0.05}
        className="w-12 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Speed"><input type="number" value={speed} onChange={(e) => setSpeed(+e.target.value)} min={0.5} max={10} step={0.5}
        className="w-12 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <div className="flex gap-1 pt-1">
        <Row label="Nuc."><input type="color" value={nucleusColor} onChange={(e) => setNucleusColor(e.target.value)} className="w-6 h-4 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" /></Row>
        <Row label="e⁻"><input type="color" value={electronColor} onChange={(e) => setElectronColor(e.target.value)} className="w-6 h-4 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" /></Row>
        <Row label="Orb."><input type="color" value={orbitColor} onChange={(e) => setOrbitColor(e.target.value)} className="w-6 h-4 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" /></Row>
      </div>
      <button onClick={create}
        className="w-full mt-2 py-1.5 rounded bg-[#2a3a2a] border border-[#3a5a3a] text-[#8c8] text-[10px] font-medium hover:bg-[#304030] transition">
        Generate Orbital
      </button>
    </div>
  )
}

// Packs N nucleons into concentric spherical shells, each shell evenly spread
// with a Fibonacci (golden-angle) distribution so they sit on neat rings — the
// tightest "circularly aligned" arrangement. `spacing` = center-to-center gap.
function packNucleons(N, spacing) {
  const pts = [[0, 0, 0]]
  const golden = Math.PI * (3 - Math.sqrt(5))
  let shell = 1
  while (pts.length < N) {
    const R = shell * spacing
    // How many fit on this shell ~ surface area / area-per-nucleon (hex packing).
    const cap = Math.max(1, Math.round((4 * Math.PI * R * R) / (spacing * spacing * 1.05)))
    const take = Math.min(cap, N - pts.length)
    for (let i = 0; i < take; i++) {
      const y = 1 - ((i + 0.5) / take) * 2          // -1 → 1
      const rr = Math.sqrt(Math.max(0, 1 - y * y))
      const theta = golden * i + shell * 0.6         // offset each shell so they interlock
      pts.push([Math.cos(theta) * rr * R, y * R, Math.sin(theta) * rr * R])
    }
    shell++
  }
  return pts.slice(0, N)
}

function NucleusTab() {
  const { addLayer, addGroup, addToGroup, incrementCounter } = useStore()
  const [protons, setProtons] = useState(10)
  const [neutrons, setNeutrons] = useState(10)
  const [size, setSize] = useState(0.18)
  const [protonColor, setProtonColor] = useState('#e23b3b')
  const [neutronColor, setNeutronColor] = useState('#2f4fd6')
  const [mix, setMix] = useState(true)

  const total = protons + neutrons

  const create = () => {
    if (total < 1) return
    const groupId = addGroup(`Nucleus_${protons}p${neutrons}n_${incrementCounter()}`)

    // Slight overlap so the nucleons read as a packed, merged cluster.
    const spacing = size * 2 * 0.9
    const pts = packNucleons(total, spacing)

    // Build a color list (P protons + N neutrons) and optionally interleave it
    // so protons/neutrons end up intermixed like a real nucleus.
    const isProton = pts.map((_, i) => i < protons)
    if (mix) {
      for (let i = isProton.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[isProton[i], isProton[j]] = [isProton[j], isProton[i]]
      }
    }

    let p = 0, n = 0
    pts.forEach((pos, i) => {
      const proton = isProton[i]
      const idx = proton ? ++p : ++n
      const id = crypto.randomUUID()
      addLayer({
        id, name: proton ? `p⁺_${idx}` : `n⁰_${idx}`, type: 'sphere',
        color: proton ? protonColor : neutronColor,
        position: pos, rotation: [0, 0, 0], scale: [1, 1, 1],
        visible: true, opacity: 1, sphereRadius: size,
      })
      addToGroup(groupId, id)
    })
  }

  return (
    <div className="space-y-1.5">
      <Row label="Protons"><input type="number" value={protons} onChange={(e) => setProtons(Math.max(0, Math.min(150, +e.target.value)))} min={0} max={150}
        className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Neutrons"><input type="number" value={neutrons} onChange={(e) => setNeutrons(Math.max(0, Math.min(200, +e.target.value)))} min={0} max={200}
        className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Size"><input type="number" value={size} onChange={(e) => setSize(+e.target.value)} min={0.05} max={1} step={0.01}
        className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <div className="flex gap-1 pt-1">
        <Row label="p⁺"><input type="color" value={protonColor} onChange={(e) => setProtonColor(e.target.value)} className="w-6 h-4 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" /></Row>
        <Row label="n⁰"><input type="color" value={neutronColor} onChange={(e) => setNeutronColor(e.target.value)} className="w-6 h-4 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" /></Row>
      </div>
      <Row label="Mix"><input type="checkbox" checked={mix} onChange={(e) => setMix(e.target.checked)} className="accent-[#4c8bf5]" /></Row>
      <p className="text-[9px] text-[#555]">{total} nucleons · A={total}, Z={protons}</p>
      <button onClick={create} disabled={total < 1}
        className="w-full mt-1 py-1.5 rounded bg-[#3a2a2a] border border-[#5a3a3a] text-[#e99] text-[10px] font-medium hover:bg-[#403030] transition disabled:opacity-40">
        Generate Nucleus
      </button>
    </div>
  )
}

function ParticlesTab() {
  const { addLayer, addGroup, addToGroup, incrementCounter } = useStore()
  const [count, setCount] = useState(200)
  const [radius, setRadius] = useState(3)
  const [ptcSize, setPtcSize] = useState(0.04)
  const [color, setColor] = useState('#ffaa44')
  const [shape, setShape] = useState('sphere')
  const [speed, setSpeed] = useState(2)

  const create = () => {
    const groupId = addGroup(`Particles_${incrementCounter()}`)
    const pId = crypto.randomUUID()
    addLayer({
      id: pId,
      name: `cloud_${count}`,
      type: 'particles',
      color,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      opacity: 0.9,
      particleCount: count,
      particleRadius: radius,
      particleSize: ptcSize,
      particleShape: shape,
      particleSpeed: speed,
    })
    addToGroup(groupId, pId)
  }

  return (
    <div className="space-y-1.5">
      <Row label="Count"><input type="number" value={count} onChange={(e) => setCount(+e.target.value)} min={10} max={5000} step={10}
        className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Radius"><input type="number" value={radius} onChange={(e) => setRadius(+e.target.value)} min={0.5} max={20} step={0.5}
        className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Size"><input type="number" value={ptcSize} onChange={(e) => setPtcSize(+e.target.value)} min={0.01} max={0.5} step={0.01}
        className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Speed"><input type="number" value={speed} onChange={(e) => setSpeed(+e.target.value)} min={0} max={10} step={0.5}
        className="w-14 px-1 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] text-center outline-none focus:border-[#4c8bf5]/60" /></Row>
      <Row label="Color"><input type="color" value={color} onChange={(e) => setColor(e.target.value)}
        className="w-7 h-5 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" /></Row>
      <Row label="Shape">
        <select value={shape} onChange={(e) => setShape(e.target.value)}
          className="px-1.5 py-0.5 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] outline-none">
          <option value="sphere">Cloud</option>
          <option value="shell">Shell</option>
          <option value="ring">Ring</option>
          <option value="jet">Bipolar</option>
        </select>
      </Row>
      <button onClick={create}
        className="w-full mt-2 py-1.5 rounded bg-[#2a2a3a] border border-[#3a3a5a] text-[#aaf] text-[10px] font-medium hover:bg-[#303050] transition">
        Generate Cloud
      </button>
    </div>
  )
}

// ===== LAYERS LIST PANEL (bottom, scrollable) =====
function LayersListPanel() {
  const { layers, groups, selectedId, selectedGroupId, addGroup, setGroupParent, removeFromGroup } = useStore()
  const [dragItem, setDragItem] = useState(null) // { type: 'layer'|'group', id }

  const groupedIds = new Set(groups.flatMap(g => g.children))
  const ungrouped = layers.filter(l => !groupedIds.has(l.id))
  const rootGroups = groups.filter(g => !g.parentId)

  // Dropping on the empty list area un-nests: groups become roots, layers leave
  // their group.
  const handleRootDrop = (e) => {
    e.preventDefault()
    if (!dragItem) return
    if (dragItem.type === 'group') setGroupParent(dragItem.id, null)
    else {
      const parent = groups.find(g => g.children.includes(dragItem.id))
      if (parent) removeFromGroup(parent.id, dragItem.id)
    }
    setDragItem(null)
  }

  return (
    <div className="flex-1 min-h-0 bg-[#252525] border border-[#3d3d3d] rounded-lg shadow-xl overflow-hidden flex flex-col">
      <div className="px-3 py-2 border-b border-[#3d3d3d] flex items-center justify-between shrink-0">
        <span className="text-[10px] text-[#888] uppercase tracking-wider font-medium">Layers</span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-[#555]">{layers.length}</span>
          <button onClick={() => addGroup(`Group ${groups.length + 1}`)}
            className="text-[#666] hover:text-white text-[10px] transition" title="New group">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M3 3V2a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1"/><path d="M6 5v3M4.5 6.5h3" stroke="currentColor" strokeWidth="0.8"/></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5" onDragOver={(e) => e.preventDefault()} onDrop={handleRootDrop}>
        {/* Root groups (each renders its nested subgroups + layers recursively) */}
        {rootGroups.map(group => (
          <GroupItem key={group.id} group={group} groups={groups} layers={layers}
            selectedId={selectedId} selectedGroupId={selectedGroupId}
            dragItem={dragItem} setDragItem={setDragItem} depth={0} />
        ))}
        {/* Ungrouped layers */}
        {ungrouped.map(layer => (
          <LayerItem key={layer.id} layer={layer} selectedId={selectedId}
            dragItem={dragItem} setDragItem={setDragItem} />
        ))}
        {layers.length === 0 && <p className="text-[#555] text-[10px] text-center py-4">No objects</p>}
      </div>
    </div>
  )
}

function GroupItem({ group, groups, layers, selectedId, selectedGroupId, dragItem, setDragItem, depth }) {
  const { selectGroup, setSelected, updateLayer, toggleGroupCollapse, removeFromGroup, removeGroup, renameGroup, addToGroup, setGroupParent } = useStore()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(group.name)
  const [dragOver, setDragOver] = useState(false)
  const children = group.children.map(id => layers.find(l => l.id === id)).filter(Boolean)
  const subGroups = groups.filter(g => g.parentId === group.id)
  const isGroupSelected = selectedGroupId === group.id
  const count = children.length + subGroups.length

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragOver(false)
    if (!dragItem) return
    if (dragItem.type === 'layer') addToGroup(group.id, dragItem.id)
    else if (dragItem.id !== group.id) setGroupParent(dragItem.id, group.id) // store blocks cycles
    setDragItem(null)
  }

  return (
    <div className={`rounded border mb-0.5 overflow-hidden ${dragOver ? 'border-[#4c8bf5]' : isGroupSelected ? 'border-[#4c8bf5]/60' : 'border-[#333]'}`}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}>
      <div
        draggable
        onDragStart={(e) => { e.stopPropagation(); setDragItem({ type: 'group', id: group.id }) }}
        onDragEnd={() => setDragItem(null)}
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer transition ${isGroupSelected ? 'bg-[#4c8bf5]/15' : 'bg-[#2a2a2a] hover:bg-[#303030]'}`}
        onClick={() => selectGroup(group.id)}
      >
        <button onClick={(e) => { e.stopPropagation(); toggleGroupCollapse(group.id) }} className="text-[#777] text-[8px] w-3">{group.collapsed ? '▶' : '▼'}</button>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none" className="shrink-0 text-[#888]"><rect x="1" y="3" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1"/><path d="M3 3V2a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1"/></svg>
        {editing ? (
          <input value={name} onChange={(e) => setName(e.target.value)}
            onBlur={() => { renameGroup(group.id, name); setEditing(false) }}
            onKeyDown={(e) => { if (e.key === 'Enter') { renameGroup(group.id, name); setEditing(false) } }}
            className="flex-1 bg-[#1e1e1e] border border-[#4c8bf5]/50 rounded px-1 text-white text-[10px] outline-none" autoFocus />
        ) : (
          <span className="flex-1 text-[10px] text-[#bbb] truncate" onDoubleClick={() => setEditing(true)}>{group.name}</span>
        )}
        <span className="text-[8px] text-[#555]">{count}</span>
        <button onClick={(e) => { e.stopPropagation(); removeGroup(group.id) }} className="text-[#444] hover:text-[#e88] text-[8px]">✕</button>
      </div>
      {!group.collapsed && (
        <div className="pl-3 pr-1 py-0.5 bg-[#272727]">
          {/* Nested subgroups first */}
          {subGroups.map(sg => (
            <GroupItem key={sg.id} group={sg} groups={groups} layers={layers}
              selectedId={selectedId} selectedGroupId={selectedGroupId}
              dragItem={dragItem} setDragItem={setDragItem} depth={depth + 1} />
          ))}
          {/* Then this group's own layers */}
          {children.map(layer => (
            <div key={layer.id} className="flex items-center">
              <div className="flex-1"><LayerItem layer={layer} selectedId={selectedId} dragItem={dragItem} setDragItem={setDragItem} /></div>
              <button onClick={() => removeFromGroup(group.id, layer.id)} className="text-[#444] hover:text-[#888] text-[7px] px-0.5">✕</button>
            </div>
          ))}
          {count === 0 && <p className="text-[#444] text-[9px] py-1.5 text-center">Drop objects or groups here</p>}
        </div>
      )}
    </div>
  )
}

function LayerItem({ layer, selectedId, dragItem, setDragItem }) {
  const setSelected = useStore(s => s.setSelected)
  const updateLayer = useStore(s => s.updateLayer)
  const selectedIds = useStore(s => s.selectedIds)
  const addToSelection = useStore(s => s.addToSelection)
  const isSelected = selectedIds.includes(layer.id)

  const handleClick = (e) => {
    if (e.shiftKey) {
      addToSelection(layer.id)
    } else {
      setSelected(layer.id)
    }
  }

  return (
    <div draggable
      onDragStart={(e) => { e.stopPropagation(); setDragItem?.({ type: 'layer', id: layer.id }) }}
      onDragEnd={() => setDragItem?.(null)}
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-1.5 py-1 rounded cursor-pointer text-[10px] transition ${
        isSelected ? 'bg-[#4c8bf5]/20 text-white' : 'hover:bg-[#2f2f2f] text-[#999]'
      }`}>
      <div className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: layer.color }} />
      <span className="flex-1 truncate">{layer.name}</span>
      <button className={`shrink-0 ${layer.visible ? 'text-[#666]' : 'text-[#333]'}`}
        onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }}>
        <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
          <path d="M1 6s2-3 5-3 5 3 5 3-2 3-5 3-5-3-5-3z" stroke="currentColor" strokeWidth="1.2"/>
          {!layer.visible && <path d="M2 2l8 8" stroke="currentColor" strokeWidth="1.2"/>}
          {layer.visible && <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1"/>}
        </svg>
      </button>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-[#888] min-w-[36px]">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  )
}
