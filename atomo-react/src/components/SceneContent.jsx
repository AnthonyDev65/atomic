import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useStore } from '../store/useStore'
import * as THREE from 'three'

export default function SceneContent() {
  const { layers, showAxes, selectedId } = useStore()

  return (
    <>
      {showAxes && <axesHelper args={[2]} />}

      {layers.map((layer) => (
        <SceneObject key={layer.id} layer={layer} isSelected={layer.id === selectedId} />
      ))}
    </>
  )
}

function SceneObject({ layer, isSelected }) {
  const meshRef = useRef()
  const { setSelected, viewerMode } = useStore()

  const handleClick = (e) => {
    if (viewerMode) return
    e.stopPropagation()
    setSelected(layer.id)
  }

  useFrame((_, delta) => {
    if (!meshRef.current) return
    if (layer.animation) {
      meshRef.current.rotation.x += layer.animation.x * delta
      meshRef.current.rotation.y += layer.animation.y * delta
      meshRef.current.rotation.z += layer.animation.z * delta
    }
  })

  const geometry = getGeometry(layer)
  const color = new THREE.Color(layer.color)

  return (
    <group>
      <mesh
        ref={meshRef}
        position={layer.position || [0, 0, 0]}
        rotation={layer.rotation || [0, 0, 0]}
        scale={layer.scale || [1, 1, 1]}
        onClick={handleClick}
        visible={layer.visible !== false}
      >
        {geometry}
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
        <mesh
          position={layer.position || [0, 0, 0]}
          rotation={layer.rotation || [0, 0, 0]}
          scale={(layer.scale || [1, 1, 1]).map(s => s * 1.02)}
        >
          {geometry}
          <meshBasicMaterial color="#88aaff" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </group>
  )
}

function getGeometry(layer) {
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
}
