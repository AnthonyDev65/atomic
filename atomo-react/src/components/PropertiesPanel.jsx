import { useStore } from '../store/useStore'
import { useState } from 'react'
import DragInput from './DragInput'
import { ANIM_PROPS, invalidateRef } from '../anim'
import { meshRegistry } from './SceneContent'

export default function PropertiesPanel() {
  const { layers, selectedId, rightPanelOpen, viewerMode, updateLayer, removeLayer, deselect, addKeyframe, timelineOpen } = useStore()

  if (!rightPanelOpen || viewerMode || !selectedId) return null

  const layer = layers.find(l => l.id === selectedId)
  if (!layer) return null

  const update = (field, value) => {
    updateLayer(selectedId, { [field]: value })
    const tl = useStore.getState().timeline
    if (tl.recording && ANIM_PROPS.includes(field)) {
      addKeyframe(selectedId, field, tl.time, value)
      invalidateRef.current?.()
    }
  }
  const pos = layer.position || [0, 0, 0]
  const scale = layer.scale || [1, 1, 1]
  const rot = layer.rotation || [0, 0, 0]

  // Turn an orbiting / shared electron into a plain static sphere frozen at its
  // current world position. Reads the live mesh world transform (which already
  // bakes in any group offset), pulls it out of its group, and drops the
  // orbital/share that was driving it — so it stays exactly where it is.
  const detach = () => {
    const mesh = meshRegistry.get(layer.id)
    const p = mesh ? [mesh.position.x, mesh.position.y, mesh.position.z] : pos
    const r = mesh ? [mesh.rotation.x, mesh.rotation.y, mesh.rotation.z] : rot
    useStore.getState().detachLayer(selectedId, p, r)
  }

  return (
    <div className={`absolute top-12 right-2 md:right-3 w-[min(15rem,calc(100vw-1rem))] md:w-64 overflow-y-auto bg-[#252525] border border-[#3d3d3d] rounded-lg shadow-xl z-40 ${timelineOpen ? 'max-h-[calc(100dvh-4.5rem-208px)]' : 'max-h-[calc(100dvh-4.5rem)]'}`}>
      {/* Header */}
      <div className="sticky top-0 bg-[#252525] border-b border-[#3d3d3d] px-3 py-2.5 z-10">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#888] uppercase tracking-wider font-medium">Properties</span>
          <button onClick={deselect} className="text-[#666] hover:text-white text-xs transition">✕</button>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: layer.color }} />
          <span className="text-white text-xs font-medium truncate">{layer.name}</span>
        </div>
      </div>

      <div className="p-3 space-y-0">
        {/* Color */}
        <Section title="Appearance">
          <PropRow label="Color">
            <input type="color" value={layer.color} onChange={(e) => update('color', e.target.value)}
              className="w-7 h-5 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" />
          </PropRow>
          <PropRow label="Opacity">
            <DragInput label="O" value={layer.opacity ?? 1} onChange={(v) => update('opacity', Math.max(0, Math.min(1, v)))} step={0.01} min={0} color="#888" />
          </PropRow>
          <PropRow label="Points">
            <input type="checkbox" checked={layer.pointCloud || false} onChange={(e) => update('pointCloud', e.target.checked)}
              className="w-3.5 h-3.5 accent-[#4c8bf5] cursor-pointer" />
          </PropRow>
          {layer.pointCloud && (
            <PropRow label="Point size">
              <DragInput label="S" value={layer.pointSize || 0.03} onChange={(v) => update('pointSize', v)} step={0.005} min={0.001} color="#4af" />
            </PropRow>
          )}
          {layer.pointCloud && ['torus','orbital_p','orbital_d','orbital_f'].includes(layer.type) && (
            <PropRow label="Density">
              <DragInput label="N" value={layer.pointDensity || 3000} onChange={(v) => update('pointDensity', Math.max(100, Math.round(v)))} step={500} min={100} color="#4af" />
            </PropRow>
          )}
        </Section>

        {/* Detach an electron from its orbit / share so it becomes a free sphere */}
        {(layer.orbital || layer.share) && (
          <Section title="Electron">
            <button onClick={detach}
              className="w-full py-1.5 rounded bg-[#2a2030] border border-[#5a3a6a] text-[#d8a8ff] text-[10px] font-medium hover:bg-[#352540] transition">
              Detach → free sphere here
            </button>
            <p className="text-[9px] text-[#555] mt-1">Stops orbiting / sharing and freezes it at its current position.</p>
          </Section>
        )}

        {/* Transform */}
        <Section title="Position">
          <Vec3Input values={pos} onChange={(v) => update('position', v)} step={0.1} />
        </Section>

        <Section title="Scale">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] text-[#666]">Uniform</span>
            <input type="checkbox" checked={layer.uniformScale !== false} onChange={(e) => update('uniformScale', e.target.checked)}
              className="w-3 h-3 accent-[#4c8bf5] cursor-pointer" />
          </div>
          <Vec3Input values={scale} onChange={(v) => update('scale', v)} step={0.1} min={0.01} uniform={layer.uniformScale !== false} />
        </Section>

        <Section title="Rotation">
          <Vec3Input
            values={rot.map(r => Math.round(r * 180 / Math.PI))}
            onChange={(v) => update('rotation', v.map(d => d * Math.PI / 180))}
            step={5}
            labels={['X°', 'Y°', 'Z°']}
          />
        </Section>

        {/* Wave Sphere */}
        {layer.type === 'wave_sphere' && (
          <Section title="Wave Cloud">
            <PropRow label="Radius">
              <DragInput label="R" value={layer.torusRadius || 1} onChange={(v) => update('torusRadius', v)} step={0.1} min={0.1} color="#4af" />
            </PropRow>
            <PropRow label="Amplitude">
              <DragInput label="A" value={layer.waveAmplitude || 0.15} onChange={(v) => update('waveAmplitude', v)} step={0.01} min={0} color="#4af" />
            </PropRow>
            <PropRow label="Frequency">
              <DragInput label="F" value={layer.waveFrequency || 3} onChange={(v) => update('waveFrequency', v)} step={0.5} min={0.5} color="#4af" />
            </PropRow>
            <PropRow label="Speed">
              <DragInput label="V" value={layer.waveSpeed || 1} onChange={(v) => update('waveSpeed', v)} step={0.1} min={0} color="#4af" />
            </PropRow>
            <PropRow label="Wireframe">
              <input type="checkbox" checked={layer.waveWireframe || false} onChange={(e) => update('waveWireframe', e.target.checked)}
                className="w-3.5 h-3.5 accent-[#4c8bf5] cursor-pointer" />
            </PropRow>
            <PropRow label="Points">
              <input type="checkbox" checked={layer.wavePoints || false} onChange={(e) => update('wavePoints', e.target.checked)}
                className="w-3.5 h-3.5 accent-[#4c8bf5] cursor-pointer" />
            </PropRow>
            {layer.wavePoints && (
              <PropRow label="Point size">
                <DragInput label="S" value={layer.wavePointSize || 0.03} onChange={(v) => update('wavePointSize', v)} step={0.005} min={0.001} color="#4af" />
              </PropRow>
            )}
            <PropRow label="Density">
              <DragInput label="D" value={layer.waveDensity || 64} onChange={(v) => update('waveDensity', Math.max(8, Math.round(v)))} step={8} min={8} color="#4af" />
            </PropRow>
          </Section>
        )}

        {/* Add label to this object */}
        {layer.type !== 'label3d' && (
          <Section title="Annotation">
            <AddLabelToObject layer={layer} />
          </Section>
        )}

        {/* Label 3D */}
        {layer.type === 'label3d' && (
          <Section title="Label">
            <PropRow label="Text">
              <input type="text" value={layer.labelText || ''} onChange={(e) => update('labelText', e.target.value)}
                className="flex-1 px-2 py-1 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] outline-none focus:border-[#4c8bf5]/60" />
            </PropRow>
            <PropRow label="Line color">
              <input type="color" value={layer.labelLineColor || layer.color || '#ffffff'} onChange={(e) => update('labelLineColor', e.target.value)}
                className="w-6 h-4 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" />
            </PropRow>
            <p className="text-[9px] text-[#555] mt-1">Move the label with the gizmo. The line connects origin to label position.</p>
          </Section>
        )}

        {/* Torus-specific */}
        {(layer.type === 'torus' || layer.type === 'orbital_p' || layer.type === 'orbital_d' || layer.type === 'orbital_f') && (
          <Section title={layer.type === 'torus' ? 'Orbital S' : layer.type.replace('orbital_', 'Orbital ').toUpperCase()}>
            <PropRow label="Radius">
              <DragInput label="R" value={layer.torusRadius || 0.5} onChange={(v) => update('torusRadius', v)} step={0.05} min={0.1} color="#f80" />
            </PropRow>
            <PropRow label="Thickness">
              <DragInput label="T" value={layer.tubeThickness || 0.1} onChange={(v) => update('tubeThickness', v)} step={0.005} min={0.005} color="#f80" />
            </PropRow>
            <PropRow label="Path offset">
              <DragInput label="O" value={layer.pathOffset || 0} onChange={(v) => update('pathOffset', v)} step={0.05} min={0} color="#f80" />
            </PropRow>
          </Section>
        )}

        {/* Add electron to orbital */}
        {(layer.type === 'torus' || layer.type === 'orbital_p' || layer.type === 'orbital_d' || layer.type === 'orbital_f') && (
          <Section title="Electrons on orbit">
            <AddElectronToOrbit layer={layer} />
          </Section>
        )}

        {/* Share electrons with another orbital (covalent bond) */}
        {(layer.type === 'torus' || layer.type === 'orbital_p' || layer.type === 'orbital_d' || layer.type === 'orbital_f') && (
          <Section title="Share electrons">
            <ShareElectrons layer={layer} />
          </Section>
        )}

        {/* Delete */}
        <div className="pt-3 mt-1 border-t border-[#333]">
          <button
            onClick={() => { removeLayer(selectedId); deselect() }}
            className="w-full py-1.5 rounded bg-[#3a2020] border border-[#5a3030] text-[#e88] text-[11px] hover:bg-[#4a2525] transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="py-2.5 border-b border-[#333] last:border-0">
      <p className="text-[9px] text-[#666] uppercase tracking-wider font-medium mb-2">{title}</p>
      {children}
    </div>
  )
}

function PropRow({ label, children }) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-[11px] text-[#999]">{label}</span>
      <div className="flex items-center gap-1.5">{children}</div>
    </div>
  )
}

function AddLabelToObject({ layer }) {
  const { addLayer, incrementCounter } = useStore()
  const [text, setText] = useState(layer.name || 'Label')

  const create = () => {
    const from = layer.position || [0, 0, 0]
    const offset = 2.5
    const labelPos = [from[0] + offset, from[1] + offset, from[2]]

    // Calculate a point on the surface of the object (towards the label)
    const radius = layer.torusRadius || layer.sphereRadius || 0.5
    const scale = layer.scale || [1, 1, 1]
    const effectiveRadius = radius * Math.max(scale[0], scale[1], scale[2])
    // Direction from center to label
    const dx = labelPos[0] - from[0]
    const dy = labelPos[1] - from[1]
    const dz = labelPos[2] - from[2]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
    // Start point on the surface
    const surfacePoint = [
      from[0] + (dx / dist) * effectiveRadius,
      from[1] + (dy / dist) * effectiveRadius,
      from[2] + (dz / dist) * effectiveRadius,
    ]

    addLayer({
      id: crypto.randomUUID(),
      name: `label_${incrementCounter()}`,
      type: 'label3d',
      color: layer.color || '#ffffff',
      labelLineColor: layer.color || '#88aaff',
      labelText: text,
      labelFrom: surfacePoint,
      labelParentId: layer.id,
      labelParentRadius: effectiveRadius,
      position: labelPos,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      opacity: 1,
    })
  }

  return (
    <div className="space-y-1.5">
      <PropRow label="Text">
        <input type="text" value={text} onChange={(e) => setText(e.target.value)}
          className="flex-1 px-2 py-1 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] outline-none focus:border-[#4c8bf5]/60" />
      </PropRow>
      <button onClick={create}
        className="w-full py-1.5 rounded bg-[#1a2a3a] border border-[#2a4a6a] text-[#6af] text-[10px] font-medium hover:bg-[#203050] transition">
        Add label line
      </button>
    </div>
  )
}

function AddElectronToOrbit({ layer }) {
  const { addLayer, incrementCounter, layers, groups, addToGroup } = useStore()
  const [eColor, setEColor] = useState('#44aaff')
  const [eSize, setESize] = useState(0.08)
  const [eSpeed, setESpeed] = useState(2)

  const addElectron = () => {
    const radius = (layer.torusRadius || 0.5) + (layer.pathOffset || 0)
    const rot = layer.rotation || [0, 0, 0]
    const pathType = layer.type // 'torus', 'orbital_p', 'orbital_d', 'orbital_f'

    // Electrons already orbiting THIS exact orbital, matched by identity
    // (parentId) — not by geometry, which wrongly grouped electrons from
    // different toruses that happened to share radius/tilt.
    const existing = layers.filter(l => l.orbital && l.orbital.parentId === layer.id)

    const count = existing.length + 1
    const angleStep = (Math.PI * 2) / count

    // Redistribute existing electrons equidistantly
    existing.forEach((el, i) => {
      useStore.getState().updateLayer(el.id, {
        orbital: { ...el.orbital, angle: angleStep * i, speed: eSpeed }
      })
    })

    // Create new electron
    const eId = crypto.randomUUID()
    const angle = angleStep * (count - 1)
    addLayer({
      id: eId,
      name: `e⁻_${incrementCounter()}`,
      type: 'sphere',
      color: eColor,
      position: [radius, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      visible: true,
      opacity: 1,
      sphereRadius: eSize,
      label: 'e',
      orbital: { radius, speed: eSpeed, angle, tiltX: rot[0], tiltZ: rot[2], pathType, parentId: layer.id }
    })

    // Add to same group as orbital, or create a new group for both
    const group = groups.find(g => g.children.includes(layer.id))
    if (group) {
      addToGroup(group.id, eId)
    } else {
      // Create a group for this orbital and its electrons
      const groupId = useStore.getState().addGroup(`${layer.name || 'Orbital'}_group`)
      useStore.getState().addToGroup(groupId, layer.id)
      useStore.getState().addToGroup(groupId, eId)
      // Also add any existing electrons of this orbital to the group
      existing.forEach(el => useStore.getState().addToGroup(groupId, el.id))
    }
  }

  return (
    <div className="space-y-1.5">
      <PropRow label="Color">
        <input type="color" value={eColor} onChange={(e) => setEColor(e.target.value)}
          className="w-6 h-4 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" />
      </PropRow>
      <PropRow label="Size">
        <DragInput label="S" value={eSize} onChange={setESize} step={0.01} min={0.02} color="#4af" />
      </PropRow>
      <PropRow label="Speed">
        <DragInput label="V" value={eSpeed} onChange={setESpeed} step={0.5} min={0.5} color="#4af" />
      </PropRow>
      <button onClick={addElectron}
        className="w-full py-1.5 rounded bg-[#1a2a3a] border border-[#2a4a6a] text-[#6af] text-[10px] font-medium hover:bg-[#203050] transition">
        Add orbiting electron
      </button>
    </div>
  )
}

function ShareElectrons({ layer }) {
  const { layers, addLayer, incrementCounter } = useStore()
  const orbitals = layers.filter(l => l.id !== layer.id && ['torus', 'orbital_p', 'orbital_d', 'orbital_f'].includes(l.type))

  const [target, setTarget] = useState('')
  const [count, setCount] = useState(1)
  const [mode, setMode] = useState('click')
  const [t0, setT0] = useState(1)
  const [duration, setDuration] = useState(1)
  const [period, setPeriod] = useState(2)
  const [eColor, setEColor] = useState('#ffdd44')

  const create = () => {
    if (!target) return
    // Visual bond line between the two orbitals
    addLayer({
      id: crypto.randomUUID(), name: `bond_${incrementCounter()}`, type: 'bond',
      color: '#88ccff', bondFrom: layer.id, bondTo: target, visible: true, opacity: 0.6,
      position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
    })
    // Shared electrons
    const n = Math.max(1, Math.round(count))
    for (let i = 0; i < n; i++) {
      const phase = (Math.PI * 2 / n) * i
      addLayer({
        id: crypto.randomUUID(), name: `e⁻shared_${incrementCounter()}`, type: 'sphere',
        color: eColor, position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1],
        visible: true, opacity: 1, sphereRadius: 0.08, label: 'e',
        share: { fromId: layer.id, toId: target, mode, t0, duration, period, speed: 2, angle: phase },
      })
    }
  }

  if (orbitals.length === 0) {
    return <p className="text-[9px] text-[#555]">Create another orbital to share electrons with it.</p>
  }

  return (
    <div className="space-y-1.5">
      <PropRow label="Share with">
        <select value={target} onChange={(e) => setTarget(e.target.value)}
          className="flex-1 px-1.5 py-1 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] outline-none focus:border-[#4c8bf5]/60 max-w-[120px]">
          <option value="">Select orbital…</option>
          {orbitals.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </PropRow>
      <PropRow label="Electrons">
        <DragInput label="N" value={count} onChange={(v) => setCount(Math.max(1, Math.round(v)))} step={1} min={1} color="#fd4" />
      </PropRow>
      <PropRow label="Color">
        <input type="color" value={eColor} onChange={(e) => setEColor(e.target.value)}
          className="w-6 h-4 rounded cursor-pointer bg-transparent border border-[#3d3d3d]" />
      </PropRow>
      <PropRow label="Mode">
        <select value={mode} onChange={(e) => setMode(e.target.value)}
          className="flex-1 px-1.5 py-1 bg-[#1e1e1e] border border-[#3d3d3d] rounded text-white text-[10px] outline-none focus:border-[#4c8bf5]/60 max-w-[120px]">
          <option value="click">Click to transfer</option>
          <option value="transfer">Transfer (timed)</option>
          <option value="oscillate">Oscillate (back & forth)</option>
        </select>
      </PropRow>
      {mode === 'click' ? (
        <>
          <PropRow label="Travel (s)">
            <DragInput label="D" value={duration} onChange={(v) => setDuration(Math.max(0.05, v))} step={0.1} min={0.05} color="#4af" />
          </PropRow>
          <p className="text-[9px] text-[#555]">Press <span className="text-[#c8a8ff]">T</span> (or click the electron) to send it to the other orbital. Again to bring it back.</p>
        </>
      ) : mode === 'transfer' ? (
        <>
          <PropRow label="At time (s)">
            <DragInput label="T" value={t0} onChange={(v) => setT0(Math.max(0, v))} step={0.1} min={0} color="#4af" />
          </PropRow>
          <PropRow label="Travel (s)">
            <DragInput label="D" value={duration} onChange={(v) => setDuration(Math.max(0.05, v))} step={0.1} min={0.05} color="#4af" />
          </PropRow>
          <p className="text-[9px] text-[#555]">Plays on the timeline at the set time.</p>
        </>
      ) : (
        <PropRow label="Period (s)">
          <DragInput label="P" value={period} onChange={(v) => setPeriod(Math.max(0.1, v))} step={0.1} min={0.1} color="#4af" />
        </PropRow>
      )}
      <button onClick={create} disabled={!target}
        className="w-full py-1.5 rounded bg-[#2a1a3a] border border-[#5a3a7a] text-[#c8a8ff] text-[10px] font-medium hover:bg-[#352050] transition disabled:opacity-40">
        ⚡ Create shared electrons
      </button>
    </div>
  )
}

function Vec3Input({ values, onChange, step = 1, min, labels = ['X', 'Y', 'Z'], uniform = false }) {
  const colors = ['#e55', '#5b5', '#55e']

  const handleChange = (i, val) => {
    if (uniform) {
      onChange([val, val, val])
    } else {
      const v = [...values]
      v[i] = val
      onChange(v)
    }
  }

  return (
    <div className="flex gap-1">
      {values.map((v, i) => (
        <DragInput
          key={i}
          label={labels[i]}
          value={typeof v === 'number' ? v : 0}
          onChange={(val) => handleChange(i, val)}
          step={step}
          min={min}
          color={colors[i]}
        />
      ))}
    </div>
  )
}
