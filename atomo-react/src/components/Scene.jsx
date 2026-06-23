import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import SceneContent from './SceneContent'
import CameraGizmo from './CameraGizmo'
import BloomEffect from './Bloom'
import { useRef, useMemo } from 'react'

// Renders the main scene each frame when BloomEffect is absent (low-end). The
// CameraGizmo's <GizmoHelper renderPriority> takes over R3F's render loop, which
// disables automatic rendering — so without an explicit renderer the main scene
// never draws (only the gizmo shows). Priority 1 puts this before the gizmo (2).
function PlainRenderer() {
  useFrame(({ gl, scene, camera }) => {
    gl.autoClear = true
    gl.render(scene, camera)
  }, 1)
  return null
}

// Export orbit ref so TransformControls can disable it
export let orbitControlsRef = { current: null }

export default function Scene() {
  const bgColor = useStore(s => s.bgColor)
  const exposure = useStore(s => s.exposure)
  const orbitRef = useRef()

  // Detect low-end device. Note: navigator.deviceMemory is undefined on
  // Safari/Firefox/iPad — only treat it as a signal when it actually exists,
  // otherwise capable devices get wrongly downgraded.
  const isMobile = useMemo(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent), [])
  const isLowEnd = useMemo(() => {
    const cores = navigator.hardwareConcurrency || 4
    const mem = navigator.deviceMemory
    return isMobile || cores <= 2 || (mem != null && mem <= 2)
  }, [isMobile])

  const dpr = isLowEnd ? [0.5, 1] : [1, 2]
  // Always render. 'demand' froze the scene on several devices (it can paint a
  // single early frame before layout/orientation settles, then never redraw —
  // leaving only the static grid / camera gizmo). The other low-end savings
  // (lower dpr, no bloom, reduced geometry) are kept.
  const frameloop = 'always'

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

      {isLowEnd ? <PlainRenderer /> : <BloomEffect />}
    </Canvas>
  )
}
