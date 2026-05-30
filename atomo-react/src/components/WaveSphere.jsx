import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'
import { meshRegistry } from './SceneContent'

// Circular texture for round points (shared singleton)
let _pointTexture = null
function getPointTexture() {
  if (_pointTexture) return _pointTexture
  const canvas = document.createElement('canvas')
  canvas.width = 32; canvas.height = 32
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.5, 'rgba(255,255,255,0.6)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 32, 32)
  _pointTexture = new THREE.CanvasTexture(canvas)
  return _pointTexture
}

export default function WaveSphere({ layer }) {
  const meshRef = useRef()
  const setSelected = useStore(s => s.setSelected)
  const addToSelection = useStore(s => s.addToSelection)
  const viewerMode = useStore(s => s.viewerMode)
  const emissiveIntensity = useStore(s => s.emissiveIntensity)
  const isSelected = useStore(s => s.selectedIds).includes(layer.id)
  const timeRef = useRef(0)
  const frameSkip = useRef(0)

  useEffect(() => {
    if (meshRef.current) meshRegistry.set(layer.id, meshRef.current)
    return () => meshRegistry.delete(layer.id)
  }, [layer.id])

  const density = layer.waveDensity || 48 // reduced default from 64

  const { basePositions, geometry, sphericalCoords } = useMemo(() => {
    const radius = layer.torusRadius || layer.sphereRadius || 1
    const geo = new THREE.SphereGeometry(radius, density, density)
    const pos = geo.getAttribute('position')
    const base = new Float32Array(pos.array.length)
    base.set(pos.array)

    // Pre-compute spherical coordinates (expensive trig done once)
    const count = base.length / 3
    const coords = new Float32Array(count * 2) // [theta, phi] pairs
    for (let i = 0; i < count; i++) {
      const bx = base[i * 3], by = base[i * 3 + 1], bz = base[i * 3 + 2]
      coords[i * 2] = Math.atan2(bz, bx)     // theta
      coords[i * 2 + 1] = Math.acos(by / (Math.sqrt(bx * bx + by * by + bz * bz) || 1)) // phi
    }

    return { basePositions: base, geometry: geo, sphericalCoords: coords }
  }, [layer.torusRadius, layer.sphereRadius, density])

  const color = useMemo(() => new THREE.Color(layer.color), [layer.color])

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Throttle: update every other frame for performance
    frameSkip.current++
    if (frameSkip.current % 2 !== 0) return

    timeRef.current += delta * 2 * (layer.waveSpeed || 1)
    const t = timeRef.current
    const amplitude = layer.waveAmplitude || 0.15
    const frequency = layer.waveFrequency || 3

    const pos = meshRef.current.geometry.getAttribute('position')
    const arr = pos.array
    const count = arr.length / 3

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const theta = sphericalCoords[i * 2]
      const phi = sphericalCoords[i * 2 + 1]

      // Simplified wave: single sin+cos combo (much faster than 3 separate waves)
      const wave = Math.sin(theta * frequency + t) * Math.cos(phi * frequency * 0.7 + t * 1.3)
      const scale = 1 + wave * amplitude

      arr[i3] = basePositions[i3] * scale
      arr[i3 + 1] = basePositions[i3 + 1] * scale
      arr[i3 + 2] = basePositions[i3 + 2] * scale
    }

    pos.needsUpdate = true
    // Skip normal recomputation — it's very expensive and barely visible on transparent objects
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
            map={getPointTexture()}
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
          <sphereGeometry args={[layer.torusRadius || layer.sphereRadius || 1, 24, 24]} />
          <meshBasicMaterial color="#4c8bf5" wireframe transparent opacity={0.15} depthTest={false} />
        </mesh>
      )}
    </group>
  )
}
