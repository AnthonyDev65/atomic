import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import SceneContent from './SceneContent'
import CameraGizmo from './CameraGizmo'
import BloomEffect from './Bloom'
import { useRef, useMemo } from 'react'

// Export orbit ref so TransformControls can disable it
export let orbitControlsRef = { current: null }

export default function Scene() {
  const bgColor = useStore(s => s.bgColor)
  const exposure = useStore(s => s.exposure)
  const orbitRef = useRef()

  // Detect low-end device
  const isLowEnd = useMemo(() => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    const cores = navigator.hardwareConcurrency || 2
    const memory = navigator.deviceMemory || 2
    return isMobile || cores <= 2 || memory <= 2
  }, [])

  const dpr = isLowEnd ? [0.5, 1] : [1, 2]
  const frameloop = isLowEnd ? 'demand' : 'always'

  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 60, near: 0.01, far: 1000 }}
      gl={{
        antialias: !isLowEnd,
        toneMapping: 3,
        toneMappingExposure: exposure,
        powerPreference: 'high-performance',
        precision: isLowEnd ? 'mediump' : 'highp',
      }}
      dpr={dpr}
      frameloop={frameloop}
      performance={{ min: 0.3, max: 1 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={[bgColor]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} color="#88aaff" />
      <directionalLight position={[-5, -2, -5]} intensity={1} color="#4466ff" />

      <SceneContent orbitRef={orbitRef} />

      <OrbitControls
        ref={orbitRef}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        panSpeed={0.8}
        makeDefault
      />

      <CameraGizmo />

      {!isLowEnd && <BloomEffect />}
    </Canvas>
  )
}
