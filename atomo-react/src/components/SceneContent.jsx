import { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import * as THREE from 'three'

export default function SceneContent() {
  const layers = useStore(s => s.layers)
  const showAxes = useStore(s => s.showAxes)
  const selectedId = useStore(s => s.selectedId)

  return (
    <>
      {showAxes && <axesHelper args={[2]} />}
      {layers.map((layer) => (
        <SceneObjectMemo key={layer.id} layer={layer} isSelected={layer.id === selectedId} />
      ))}
    </>
  )
}

const SceneObjectMemo = memo(SceneObject, (prev, next) => {
  return prev.layer === next.layer && prev.isSelected === next.isSelected
})

function SceneObject({ layer, isSelected }) {
  const meshRef = useRef()
  const setSelected = useStore(s => s.setSelected)
  const viewerMode = useStore(s => s.viewerMode)

  // Memoize color to avoid recreating every frame
  const color = useMemo(() => new THREE.Color(layer.color), [layer.color])

  const handleClick = (e) => {
    if (viewerMode) return
    e.stopPropagation()
    setSelected(layer.id)
  }

  useFrame((_, delta) => {
    if (!meshRef.current || !layer.animation) return
    meshRef.current.rotation.x += layer.animation.x * delta
    meshRef.current.rotation.y += layer.animation.y * delta
    meshRef.current.rotation.z += layer.animation.z * delta
  })

  const pos = layer.position || [0, 0, 0]
  const rot = layer.rotation || [0, 0, 0]
  const scl = layer.scale || [1, 1, 1]

  return (
    <group>
      <mesh
        ref={meshRef}
        position={pos}
        rotation={rot}
        scale={scl}
        onClick={handleClick}
        visible={layer.visible !== false}
      >
        <GeometryMemo layer={layer} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.3}
          metalness={0.1}
          transparent={layer.opacity < 1}
          opacity={layer.opacity ?? 1}
        />
      </mesh>
      {isSelected && (
        <mesh position={pos} rotation={rot} scale={scl.map(s => s * 1.02)}>
          <GeometryMemo layer={layer} />
          <meshBasicMaterial color="#88aaff" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

const GeometryMemo = memo(function GeometryInner({ layer }) {
  const r = layer.sphereRadius || 0.5
  const tr = layer.torusRadius || 0.5
  const tt = layer.tubeThickness || 0.1

  switch (layer.type) {
    case 'sphere': return <sphereGeometry args={[r, 32, 32]} />
    case 'box': return <boxGeometry args={[0.8, 0.8, 0.8]} />
    case 'torus': return <torusGeometry args={[tr, tt, 16, 64]} />
    case 'cylinder': return <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
    case 'cone': return <coneGeometry args={[0.5, 1, 32]} />
    case 'icosahedron': return <icosahedronGeometry args={[r]} />
    case 'plane': return <planeGeometry args={[1, 1]} />
    default: return <sphereGeometry args={[r, 32, 32]} />
  }
}, (prev, next) => {
  return prev.layer.type === next.layer.type &&
    prev.layer.sphereRadius === next.layer.sphereRadius &&
    prev.layer.torusRadius === next.layer.torusRadius &&
    prev.layer.tubeThickness === next.layer.tubeThickness
})
