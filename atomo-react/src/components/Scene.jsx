import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import SceneContent from './SceneContent'
import CameraGizmo from './CameraGizmo'
import BloomEffect from './Bloom'
import { useRef } from 'react'

// Export orbit ref so TransformControls can disable it
export let orbitControlsRef = { current: null }

export default function Scene() {
  const bgColor = useStore(s => s.bgColor)
  const exposure = useStore(s => s.exposure)
  const orbitRef = useRef()

  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 60, near: 0.01, far: 1000 }}
      gl={{
        antialias: true,
        toneMapping: 3,
        toneMappingExposure: exposure,
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
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

      <BloomEffect />
    </Canvas>
  )
}
