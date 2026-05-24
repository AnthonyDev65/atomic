import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useStore } from '../store/useStore'
import SceneContent from './SceneContent'

export default function Scene() {
  const bloomStrength = useStore(s => s.bloomStrength)
  const bloomRadius = useStore(s => s.bloomRadius)
  const bloomThreshold = useStore(s => s.bloomThreshold)
  const exposure = useStore(s => s.exposure)

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
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} color="#88aaff" />
      <directionalLight position={[-5, -2, -5]} intensity={1} color="#4466ff" />

      <SceneContent />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.8}
        zoomSpeed={1.2}
        panSpeed={0.8}
      />

      <EffectComposer multisampling={0}>
        <Bloom
          intensity={bloomStrength}
          luminanceThreshold={bloomThreshold}
          radius={bloomRadius}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
