import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

export default function Label3D({ layer }) {
  const lineRef = useRef()
  const setSelected = useStore(s => s.setSelected)
  const addToSelection = useStore(s => s.addToSelection)
  const viewerMode = useStore(s => s.viewerMode)
  const isSelected = useStore(s => s.selectedIds).includes(layer.id)
  const layers = useStore(s => s.layers)

  // Get parent position dynamically and calculate surface point
  const parent = layer.labelParentId ? layers.find(l => l.id === layer.labelParentId) : null
  const parentPos = parent ? (parent.position || [0, 0, 0]) : (layer.labelFrom || [0, 0, 0])
  const to = layer.position || [2, 2, 0]

  // Calculate line start on the surface of the parent object
  const parentRadius = layer.labelParentRadius || 0.5
  const dx = to[0] - parentPos[0]
  const dy = to[1] - parentPos[1]
  const dz = to[2] - parentPos[2]
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
  const from = [
    parentPos[0] + (dx / dist) * parentRadius,
    parentPos[1] + (dy / dist) * parentRadius,
    parentPos[2] + (dz / dist) * parentRadius,
  ]
  const text = layer.labelText || 'Label'
  const color = layer.color || '#ffffff'
  const lineColor = layer.labelLineColor || color

  // Line geometry from → to
  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      ...from, ...to
    ], 3))
    return geo
  }, [from[0], from[1], from[2], to[0], to[1], to[2]])

  const handleClick = (e) => {
    if (viewerMode) return
    e.stopPropagation()
    if (e.shiftKey) addToSelection(layer.id)
    else setSelected(layer.id)
  }

  return (
    <group onClick={handleClick} visible={layer.visible !== false}>
      {/* Line */}
      <line ref={lineRef} geometry={lineGeo}>
        <lineBasicMaterial color={lineColor} transparent opacity={layer.opacity ?? 1} linewidth={1} />
      </line>

      {/* Dot at origin */}
      <mesh position={from}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={lineColor} />
      </mesh>

      {/* Billboard label at end */}
      <Html
        position={to}
        center
        occlude={false}
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          background: 'rgba(15, 15, 25, 0.85)',
          border: `1px solid ${color}55`,
          borderRadius: '6px',
          padding: '4px 10px',
          color: color,
          fontSize: '12px',
          fontFamily: "'Segoe UI', system-ui, sans-serif",
          fontWeight: 500,
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(8px)',
          boxShadow: `0 0 8px ${color}33`,
          userSelect: 'none',
        }}>
          {text}
        </div>
      </Html>

      {/* Selection indicator */}
      {isSelected && (
        <mesh position={to}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#4c8bf5" transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  )
}
