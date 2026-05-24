import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useStore } from '../store/useStore'
import SceneContent from './SceneContent'

export default function Scene() {
  const { bloomStrength, bloomRadius, bloomThreshold, exposure, viewerMode } = useStore()

  return (
    <Canvas
      camera={{ position: [0, 2, 6], fov: 60 }}
      gl={{ antialias: true, toneMapping: 3, toneMappingExposure: exposure }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={2} color="#88aaff" />
      <directionalLight position={[-5, -2, -5]} intensity={1} color="#4466ff" />

      <SceneContent />

      <OrbitControls enableDamping dampingFactor={0.05} />

      <EffectComposer>
        <Bloom
          intensity={bloomStrength}
          luminanceThreshold={bloomThreshold}
          radius={bloomRadius}
        />
      </EffectComposer>
    </Canvas>
  )
}
