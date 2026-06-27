import { GizmoHelper, GizmoViewport } from '@react-three/drei'
import { useStore } from '../store/useStore'

export default function CameraGizmo() {
  // Lift the gizmo above the timeline dock (200px) when it's open so it isn't covered.
  const timelineOpen = useStore(s => s.timelineOpen)
  return (
    <GizmoHelper alignment="bottom-right" margin={[100, timelineOpen ? 280 : 100]} renderPriority={2}>
      <GizmoViewport
        axisColors={['#ff4444', '#44ff44', '#4488ff']}
        labelColor="#ffffff"
        axisHeadScale={0.8}
      />
    </GizmoHelper>
  )
}
