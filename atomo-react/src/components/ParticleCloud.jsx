import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

export default function ParticleCloud({ layer }) {
  const pointsRef = useRef()
  const timeRef = useRef(Math.random() * 100)
  const setSelected = useStore(s => s.setSelected)
  const viewerMode = useStore(s => s.viewerMode)

  const { positions, basePositions, texture } = useMemo(() => {
    const count = layer.particleCount || 200
    const radius = layer.particleRadius || 3
    const shape = layer.particleShape || 'sphere'

    const pos = new Float32Array(count * 3)
    const base = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      let x, y, z

      if (shape === 'sphere') {
        const r = radius * Math.cbrt(Math.random())
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        x = r * Math.sin(phi) * Math.cos(theta)
        y = r * Math.sin(phi) * Math.sin(theta)
        z = r * Math.cos(phi)
      } else if (shape === 'shell') {
        const r = radius * (0.85 + Math.random() * 0.15)
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        x = r * Math.sin(phi) * Math.cos(theta)
        y = r * Math.sin(phi) * Math.sin(theta)
        z = r * Math.cos(phi)
      } else if (shape === 'ring') {
        const angle = Math.random() * Math.PI * 2
        const r = radius * (0.7 + Math.random() * 0.3)
        x = r * Math.cos(angle)
        y = (Math.random() - 0.5) * radius * 0.15
        z = r * Math.sin(angle)
      } else { // jet/bipolar
        const dir = Math.random() > 0.5 ? 1 : -1
        const h = Math.random() * radius * dir
        const spread = Math.abs(h) * 0.25 * Math.random()
        const angle = Math.random() * Math.PI * 2
        x = spread * Math.cos(angle)
        y = h
        z = spread * Math.sin(angle)
      }

      pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z
      base[i3] = x; base[i3 + 1] = y; base[i3 + 2] = z
    }

    // Create circular glow texture
    const canvas = document.createElement('canvas')
    canvas.width = 64; canvas.height = 64
    const ctx = canvas.getContext('2d')
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.3, 'rgba(255,255,255,0.8)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 64)
    const tex = new THREE.CanvasTexture(canvas)

    return { positions: pos, basePositions: base, texture: tex }
  }, [layer.particleCount, layer.particleRadius, layer.particleShape])

  // Shimmer animation
  useFrame((_, delta) => {
    if (!pointsRef.current) return
    timeRef.current += delta * (layer.particleSpeed || 2)
    const posAttr = pointsRef.current.geometry.getAttribute('position')
    const arr = posAttr.array
    const t = timeRef.current

    for (let i = 0; i < arr.length / 3; i++) {
      const i3 = i * 3
      arr[i3] = basePositions[i3] + Math.sin(t + i * 0.7) * 0.02
      arr[i3 + 1] = basePositions[i3 + 1] + Math.cos(t + i * 0.9) * 0.02
      arr[i3 + 2] = basePositions[i3 + 2] + Math.sin(t * 0.8 + i * 1.3) * 0.015
    }
    posAttr.needsUpdate = true
  })

  const handleClick = (e) => {
    if (viewerMode) return
    e.stopPropagation()
    setSelected(layer.id)
  }

  return (
    <points
      ref={pointsRef}
      position={layer.position || [0, 0, 0]}
      onClick={handleClick}
      visible={layer.visible !== false}
    >
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={positions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color={layer.color}
        size={layer.particleSize || 0.04}
        map={texture}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  )
}
