import { GizmoHelper, GizmoViewport } from '@react-three/drei'

export default function CameraGizmo() {
  return (
    <GizmoHelper alignment="bottom-right" margin={[100, 100]} renderPriority={2}>
      <GizmoViewport
        axisColors={['#ff4444', '#44ff44', '#4488ff']}
        labelColor="#ffffff"
        axisHeadScale={0.8}
      />
    </GizmoHelper>
  )
}
