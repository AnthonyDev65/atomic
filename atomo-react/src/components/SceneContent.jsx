import { useRef, useMemo, memo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import ParticleCloud from './ParticleCloud'
import WaveSphere from './WaveSphere'
import { PorbitalGeometry, DorbitalGeometry, ForbitalGeometry, getOrbitalPoint } from './OrbitalGeometry'
import * as THREE from 'three'

// Registry to store mesh refs by layer id
const meshRegistry = new Map()

export default function SceneContent({ orbitRef }) {
  const layers = useStore(s => s.layers)
  const showAxes = useStore(s => s.showAxes)
  const showGrid = useStore(s => s.showGrid)
  const gridSize = useStore(s => s.gridSize)
  const gridDivisions = useStore(s => s.gridDivisions)
  const selectedId = useStore(s => s.selectedId)
  const selectedGroupId = useStore(s => s.selectedGroupId)
  const transformMode = useStore(s => s.transformMode)
  const viewerMode = useStore(s => s.viewerMode)
  const groups = useStore(s => s.groups)

  const selectedMesh = selectedId ? meshRegistry.get(selectedId) : null

  // Group pivot: invisible object at group center
  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const groupChildren = selectedGroup ? selectedGroup.children.map(id => layers.find(l => l.id === id)).filter(Boolean) : []

  return (
    <>
      {showAxes && !viewerMode && <axesHelper args={[2]} />}
      {showGrid && !viewerMode && <gridHelper args={[gridSize, gridDivisions, '#333333', '#222222']} />}
      {layers.map((layer) => (
        layer.type === 'particles'
          ? <ParticleCloud key={layer.id} layer={layer} />
          : layer.type === 'wave_sphere'
          ? <WaveSphere key={layer.id} layer={layer} />
          : <SceneObjectMemo key={layer.id} layer={layer} />
      ))}
      {selectedMesh && !viewerMode && transformMode !== 'select' && (
        <GizmoWrapper object={selectedMesh} mode={transformMode} layerId={selectedId} orbitRef={orbitRef} />
      )}
      {selectedGroup && !viewerMode && transformMode !== 'select' && (
        <GroupGizmo group={selectedGroup} layers={groupChildren} mode={transformMode} orbitRef={orbitRef} />
      )}
    </>
  )
}

function GroupGizmo({ group, layers, mode, orbitRef }) {
  const pivotRef = useRef()
  const moveGroup = useStore(s => s.moveGroup)
  const lastPos = useRef([0, 0, 0])

  // Calculate center of group
  const center = useMemo(() => {
    if (layers.length === 0) return [0, 0, 0]
    const sum = [0, 0, 0]
    layers.forEach(l => {
      const p = l.position || [0, 0, 0]
      sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]
    })
    return [sum[0] / layers.length, sum[1] / layers.length, sum[2] / layers.length]
  }, [layers])

  useEffect(() => {
    if (pivotRef.current) {
      pivotRef.current.position.set(...center)
      lastPos.current = [...center]
    }
  }, [center])

  const handleChange = () => {
    if (!pivotRef.current) return
    const pos = pivotRef.current.position
    const delta = [pos.x - lastPos.current[0], pos.y - lastPos.current[1], pos.z - lastPos.current[2]]
    if (Math.abs(delta[0]) > 0.001 || Math.abs(delta[1]) > 0.001 || Math.abs(delta[2]) > 0.001) {
      moveGroup(group.id, delta)
      lastPos.current = [pos.x, pos.y, pos.z]
    }
  }

  return (
    <>
      <mesh ref={pivotRef} position={center} visible={false}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {pivotRef.current && (
        <TransformControls
          object={pivotRef.current}
          mode={mode}
          size={0.6}
          onObjectChange={handleChange}
          onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false }}
          onMouseUp={() => { if (orbitRef.current) orbitRef.current.enabled = true }}
        />
      )}
    </>
  )
}

function GizmoWrapper({ object, mode, layerId, orbitRef }) {
  const updateLayer = useStore(s => s.updateLayer)
  const snapToGrid = useStore(s => s.snapToGrid)
  const gridSnap = useStore(s => s.gridSnap)
  const [ctrlHeld, setCtrlHeld] = useState(false)

  useEffect(() => {
    const down = (e) => { if (e.key === 'Control') setCtrlHeld(true) }
    const up = (e) => { if (e.key === 'Control') setCtrlHeld(false) }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [])

  const snap = (snapToGrid && !ctrlHeld) ? gridSnap : null

  const handleChange = () => {
    if (!object) return
    updateLayer(layerId, {
      position: [object.position.x, object.position.y, object.position.z],
      rotation: [object.rotation.x, object.rotation.y, object.rotation.z],
      scale: [object.scale.x, object.scale.y, object.scale.z],
    })
  }

  return (
    <TransformControls
      object={object}
      mode={mode}
      size={0.6}
      translationSnap={mode === 'translate' ? snap : null}
      rotationSnap={mode === 'rotate' && snap ? Math.PI / 12 : null}
      scaleSnap={mode === 'scale' ? snap : null}
      onObjectChange={handleChange}
      onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false }}
      onMouseUp={() => { if (orbitRef.current) orbitRef.current.enabled = true }}
    />
  )
}

const SceneObjectMemo = memo(SceneObject, (prev, next) => {
  return prev.layer === next.layer
})

function SceneObject({ layer }) {
  const meshRef = useRef()
  const setSelected = useStore(s => s.setSelected)
  const viewerMode = useStore(s => s.viewerMode)

  useEffect(() => {
    if (meshRef.current) meshRegistry.set(layer.id, meshRef.current)
    return () => meshRegistry.delete(layer.id)
  }, [layer.id])

  const color = useMemo(() => new THREE.Color(layer.color), [layer.color])

  // Label texture for spheres
  const labelTexture = useMemo(() => {
    if (!layer.label || (layer.type !== 'sphere' && layer.type !== 'icosahedron')) return null
    const canvas = document.createElement('canvas')
    canvas.width = 512; canvas.height = 512
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = layer.color
    ctx.fillRect(0, 0, 512, 512)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 200px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(layer.label, 256, 256)
    ctx.font = 'bold 120px Arial'
    ctx.fillText(layer.label, 256, 100)
    ctx.fillText(layer.label, 256, 412)
    ctx.fillText(layer.label, 100, 256)
    ctx.fillText(layer.label, 412, 256)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [layer.label, layer.color, layer.type])

  const addToSelection = useStore(s => s.addToSelection)
  const emissiveIntensity = useStore(s => s.emissiveIntensity)

  const handleClick = (e) => {
    if (viewerMode) return
    e.stopPropagation()
    if (e.shiftKey) {
      addToSelection(layer.id)
    } else {
      setSelected(layer.id)
    }
  }

  useFrame((_, delta) => {
    if (!meshRef.current) return
    // Orbital animation (electron orbiting)
    if (layer.orbital) {
      layer.orbital.angle += layer.orbital.speed * delta
      const t = layer.orbital.angle / (Math.PI * 2) % 1
      const pathType = layer.orbital.pathType || 'torus'

      // Find parent orbital to get current radius, position, rotation, scale
      const parentId = layer.orbital.parentId
      const parent = parentId ? useStore.getState().layers.find(l => l.id === parentId) : null
      const radius = parent ? (parent.torusRadius || 0.5) - (parent.pathOffset || 0) : layer.orbital.radius
      const parentPos = parent?.position || [0, 0, 0]
      const parentRot = parent?.rotation || [layer.orbital.tiltX || 0, 0, layer.orbital.tiltZ || 0]
      const parentScale = parent?.scale || [1, 1, 1]

      let pt
      if (pathType === 'torus') {
        pt = { x: radius * Math.cos(layer.orbital.angle), y: radius * Math.sin(layer.orbital.angle), z: 0 }
      } else {
        pt = getOrbitalPoint(pathType, t, radius)
      }

      const pos = new THREE.Vector3(pt.x * parentScale[0], pt.y * parentScale[1], pt.z * parentScale[2])
      const euler = new THREE.Euler(parentRot[0], parentRot[1], parentRot[2])
      pos.applyEuler(euler)
      pos.x += parentPos[0]
      pos.y += parentPos[1]
      pos.z += parentPos[2]
      meshRef.current.position.set(pos.x, pos.y, pos.z)
      return
    }
    // Regular rotation animation
    if (layer.animation) {
      meshRef.current.rotation.x += layer.animation.x * delta
      meshRef.current.rotation.y += layer.animation.y * delta
      meshRef.current.rotation.z += layer.animation.z * delta
    }
  })

  const pos = layer.position || [0, 0, 0]
  const rot = layer.rotation || [0, 0, 0]
  const scl = layer.scale || [1, 1, 1]

  const isSelected = useStore(s => s.selectedIds).includes(layer.id)

  return (
    <group>
      <mesh ref={meshRef} position={pos} rotation={rot} scale={scl} onClick={handleClick} visible={layer.visible !== false}>
        <GeometryMemo layer={layer} />
        {labelTexture ? (
          <meshStandardMaterial map={labelTexture} emissive={color} emissiveIntensity={emissiveIntensity * 0.8} roughness={0.5} metalness={0} transparent opacity={layer.opacity ?? 1} depthWrite={(layer.opacity ?? 1) >= 1} />
        ) : (
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.3} metalness={0.1} transparent opacity={layer.opacity ?? 1} depthWrite={(layer.opacity ?? 1) >= 1} />
        )}
      </mesh>
      {isSelected && layer.visible !== false && (
        <mesh position={pos} rotation={rot} scale={scl}>
          <GeometryMemo layer={layer} />
          <meshBasicMaterial color="#4c8bf5" wireframe transparent opacity={0.15} depthTest={false} />
        </mesh>
      )}
    </group>
  )
}

const GeometryMemo = memo(function GeometryInner({ layer }) {
  const r = layer.sphereRadius || 0.5
  const tr = layer.torusRadius || 0.5
  const tt = layer.tubeThickness || 0.1

  switch (layer.type) {
    case 'sphere': return <sphereGeometry args={[r, 32, 32]} />
    case 'box': return <boxGeometry args={[0.8, 0.8, 0.8]} />
    case 'torus': return <torusGeometry args={[tr, tt, 16, 64]} />
    case 'cylinder': return <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
    case 'cone': return <coneGeometry args={[0.5, 1, 32]} />
    case 'icosahedron': return <icosahedronGeometry args={[r]} />
    case 'plane': return <planeGeometry args={[1, 1]} />
    case 'orbital_p': return <PorbitalGeometry radius={tr || r} tubeRadius={tt || 0.02} />
    case 'orbital_d': return <DorbitalGeometry radius={tr || r} tubeRadius={tt || 0.02} />
    case 'orbital_f': return <ForbitalGeometry radius={tr || r} tubeRadius={tt || 0.02} />
    default: return <sphereGeometry args={[r, 32, 32]} />
  }
}, (prev, next) => {
  return prev.layer.type === next.layer.type &&
    prev.layer.sphereRadius === next.layer.sphereRadius &&
    prev.layer.torusRadius === next.layer.torusRadius &&
    prev.layer.tubeThickness === next.layer.tubeThickness
})
