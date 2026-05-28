import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

/**
 * Animated wave sphere — a sphere with undulating surface like an electron cloud.
 * The vertices oscillate with noise creating a fluid/water-like effect.
 */
export default function WaveSphere({ layer }) {
  const meshRef = useRef()
  const setSelected = useStore(s => s.setSelected)
  const addToSelection = useStore(s => s.addToSelection)
  const viewerMode = useStore(s => s.viewerMode)
  const emissiveIntensity = useStore(s => s.emissiveIntensity)
  const isSelected = useStore(s => s.selectedIds).includes(layer.id)
  const timeRef = useRef(0)

  const { basePositions, geometry } = useMemo(() => {
    const radius = layer.torusRadius || layer.sphereRadius || 1
    const detail = 64
    const geo = new THREE.SphereGeometry(radius, detail, detail)
    const pos = geo.getAttribute('position')
    const base = new Float32Array(pos.array.length)
    base.set(pos.array)
    return { basePositions: base, geometry: geo }
  }, [layer.torusRadius, layer.sphereRadius])

  const color = useMemo(() => new THREE.Color(layer.color), [layer.color])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    timeRef.current += delta * (layer.waveSpeed || 1)
    const t = timeRef.current
    const amplitude = layer.waveAmplitude || 0.15
    const frequency = layer.waveFrequency || 3

    const pos = meshRef.current.geometry.getAttribute('position')
    const arr = pos.array

    for (let i = 0; i < arr.length; i += 3) {
      const bx = basePositions[i]
      const by = basePositions[i + 1]
      const bz = basePositions[i + 2]

      // Spherical coordinates for noise
      const r = Math.sqrt(bx * bx + by * by + bz * bz)
      const theta = Math.atan2(bz, bx)
      const phi = Math.acos(by / (r || 1))

      // Multi-octave wave displacement
      const wave1 = Math.sin(theta * frequency + t * 2) * Math.cos(phi * frequency * 0.7 + t * 1.3)
      const wave2 = Math.sin(theta * frequency * 1.5 + t * 0.8 + 1.5) * Math.sin(phi * frequency * 1.2 + t * 1.7)
      const wave3 = Math.cos(theta * frequency * 0.5 + t * 2.5) * Math.sin(phi * frequency * 2 + t * 0.5)

      const displacement = (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) * amplitude
      const scale = 1 + displacement

      arr[i] = bx * scale
      arr[i + 1] = by * scale
      arr[i + 2] = bz * scale
    }

    pos.needsUpdate = true
    meshRef.current.geometry.computeVertexNormals()
  })

  const handleClick = (e) => {
    if (viewerMode) return
    e.stopPropagation()
    if (e.shiftKey) addToSelection(layer.id)
    else setSelected(layer.id)
  }

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
        geometry={geometry}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={layer.opacity ?? 0.4}
          side={THREE.DoubleSide}
          wireframe={layer.waveWireframe || false}
        />
      </mesh>
      {isSelected && layer.visible !== false && (
        <mesh position={pos} rotation={rot} scale={scl}>
          <sphereGeometry args={[layer.torusRadius || layer.sphereRadius || 1, 32, 32]} />
          <meshBasicMaterial color="#4c8bf5" wireframe transparent opacity={0.15} depthTest={false} />
        </mesh>
      )}
    </group>
  )
}
