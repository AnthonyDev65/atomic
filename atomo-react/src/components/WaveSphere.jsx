import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { meshRegistry } from './SceneContent'

// Circular texture for round points
const pointTexture = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 64; canvas.height = 64
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.9)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
})()

export default function WaveSphere({ layer }) {
  const meshRef = useRef()
  const setSelected = useStore(s => s.setSelected)
  const addToSelection = useStore(s => s.addToSelection)
  const viewerMode = useStore(s => s.viewerMode)
  const emissiveIntensity = useStore(s => s.emissiveIntensity)
  const isSelected = useStore(s => s.selectedIds).includes(layer.id)
  const timeRef = useRef(0)

  // Register for gizmo support
  useEffect(() => {
    if (meshRef.current) meshRegistry.set(layer.id, meshRef.current)
    return () => meshRegistry.delete(layer.id)
  }, [layer.id])

  const density = layer.waveDensity || 64

  const { basePositions, geometry } = useMemo(() => {
    const radius = layer.torusRadius || layer.sphereRadius || 1
    const geo = new THREE.SphereGeometry(radius, density, density)
    const pos = geo.getAttribute('position')
    const base = new Float32Array(pos.array.length)
    base.set(pos.array)
    return { basePositions: base, geometry: geo }
  }, [layer.torusRadius, layer.sphereRadius, density])

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
      const bx = basePositions[i], by = basePositions[i + 1], bz = basePositions[i + 2]
      const r = Math.sqrt(bx * bx + by * by + bz * bz)
      const theta = Math.atan2(bz, bx)
      const phi = Math.acos(by / (r || 1))
      const wave1 = Math.sin(theta * frequency + t * 2) * Math.cos(phi * frequency * 0.7 + t * 1.3)
      const wave2 = Math.sin(theta * frequency * 1.5 + t * 0.8 + 1.5) * Math.sin(phi * frequency * 1.2 + t * 1.7)
      const wave3 = Math.cos(theta * frequency * 0.5 + t * 2.5) * Math.sin(phi * frequency * 2 + t * 0.5)
      const scale = 1 + (wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2) * amplitude
      arr[i] = bx * scale; arr[i + 1] = by * scale; arr[i + 2] = bz * scale
    }
    pos.needsUpdate = true
    if (!layer.wavePoints) meshRef.current.geometry.computeVertexNormals()
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
      {layer.wavePoints ? (
        <points ref={meshRef} position={pos} rotation={rot} scale={scl} onClick={handleClick} visible={layer.visible !== false} geometry={geometry} renderOrder={2}>
          <pointsMaterial
            color={color}
            size={layer.wavePointSize || 0.03}
            map={pointTexture}
            transparent
            opacity={layer.opacity ?? 0.8}
            depthWrite={false}
            sizeAttenuation
            alphaTest={0.01}
          />
        </points>
      ) : (
        <mesh ref={meshRef} position={pos} rotation={rot} scale={scl} onClick={handleClick} visible={layer.visible !== false} geometry={geometry} renderOrder={1}>
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.2}
            metalness={0.1}
            transparent
            opacity={layer.opacity ?? 0.4}
            side={THREE.DoubleSide}
            depthWrite={false}
            wireframe={layer.waveWireframe || false}
          />
        </mesh>
      )}
      {isSelected && layer.visible !== false && (
        <mesh position={pos} rotation={rot} scale={scl}>
          <sphereGeometry args={[layer.torusRadius || layer.sphereRadius || 1, 32, 32]} />
          <meshBasicMaterial color="#4c8bf5" wireframe transparent opacity={0.15} depthTest={false} />
        </mesh>
      )}
    </group>
  )
}
