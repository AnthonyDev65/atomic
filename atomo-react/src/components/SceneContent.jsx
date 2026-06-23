import { useRef, useMemo, memo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TransformControls } from '@react-three/drei'
import { useStore } from '../store/useStore'
import ParticleCloud from './ParticleCloud'
import WaveSphere from './WaveSphere'
import Label3D from './Label3D'
import { sampleProp, invalidateRef, centerCameraRef, toggleShareTransfer } from '../anim'
import { PorbitalGeometry, DorbitalGeometry, ForbitalGeometry, getOrbitalPoint, createOrbitalPointCloud } from './OrbitalGeometry'

// Circular texture for round points
const circleTexture = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 64; canvas.height = 64
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.9)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(canvas)
})()
import * as THREE from 'three'

// Registry to store mesh refs by layer id — exported for WaveSphere
export const meshRegistry = new Map()

// Group lookup maps, rebuilt each render: layerId -> groupId, and groupId -> pivot center.
export const groupOfLayer = new Map()
export const groupPivots = new Map()

// --- Shared caches (avoid recreating identical textures/geometries per object) ---
// A heavy nucleus has hundreds of identical 'P'/'N' spheres; caching collapses
// hundreds of 512² canvas textures + geometries down to a handful.
const labelTextureCache = new Map()
function getLabelTexture(label, color) {
  const key = `${label}|${color}`
  const cached = labelTextureCache.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 512; canvas.height = 512
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = color
  ctx.fillRect(0, 0, 512, 512)
  ctx.fillStyle = '#ffffff'
  ctx.font = 'bold 200px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 256, 256)
  ctx.font = 'bold 120px Arial'
  ctx.fillText(label, 256, 100)
  ctx.fillText(label, 256, 412)
  ctx.fillText(label, 100, 256)
  ctx.fillText(label, 412, 256)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  labelTextureCache.set(key, tex)
  return tex
}

const geometryCache = new Map()
function getPrimitiveGeometry(type, r, tr, tt, q) {
  const sSeg = q === 'high' ? 64 : q === 'medium' ? 24 : 8
  const tSeg = q === 'high' ? 128 : q === 'medium' ? 48 : 16
  const tRad = q === 'high' ? 32 : q === 'medium' ? 12 : 6
  let key, make
  switch (type) {
    case 'box': key = 'box'; make = () => new THREE.BoxGeometry(0.8, 0.8, 0.8); break
    case 'torus': key = `torus|${tr}|${tt}|${tRad}|${tSeg}`; make = () => new THREE.TorusGeometry(tr, tt, tRad, tSeg); break
    case 'cylinder': key = `cyl|${sSeg}`; make = () => new THREE.CylinderGeometry(0.4, 0.4, 1, sSeg); break
    case 'cone': key = `cone|${sSeg}`; make = () => new THREE.ConeGeometry(0.5, 1, sSeg); break
    case 'icosahedron': key = `ico|${r}`; make = () => new THREE.IcosahedronGeometry(r); break
    case 'plane': key = 'plane'; make = () => new THREE.PlaneGeometry(1, 1); break
    case 'sphere':
    default: key = `sphere|${r}|${sSeg}`; make = () => new THREE.SphereGeometry(r, sSeg, sSeg)
  }
  let g = geometryCache.get(key)
  if (!g) { g = make(); geometryCache.set(key, g) }
  return g
}

// --- Electron sharing (covalent bond simulation) ---
const _vecA = new THREE.Vector3()
const _vecB = new THREE.Vector3()
const _eulerTmp = new THREE.Euler()

// World-space point on an orbital path at a given angle (reuses orbital math).
function orbitalPointWorld(orbital, angle, out) {
  const radius = (orbital.torusRadius || 0.5) - (orbital.pathOffset || 0)
  const type = orbital.type
  let x, y, z
  if (type === 'orbital_p' || type === 'orbital_d' || type === 'orbital_f') {
    const tp = ((angle / (Math.PI * 2)) % 1 + 1) % 1
    const p = getOrbitalPoint(type, tp, radius)
    x = p.x; y = p.y; z = p.z
  } else {
    x = radius * Math.cos(angle); y = radius * Math.sin(angle); z = 0
  }
  const s = orbital.scale || [1, 1, 1]
  const r = orbital.rotation || [0, 0, 0]
  const pos = orbital.position || [0, 0, 0]
  out.set(x * s[0], y * s[1], z * s[2])
  out.applyEuler(_eulerTmp.set(r[0], r[1], r[2]))
  out.x += pos[0]; out.y += pos[1]; out.z += pos[2]
  return out
}

// Visual bond: a line connecting the centers of two orbitals (follows them live).
function Bond({ layer }) {
  const ref = useRef()
  useFrame(() => {
    const line = ref.current
    if (!line) return
    const all = useStore.getState().layers
    const a = all.find(l => l.id === layer.bondFrom)
    const b = all.find(l => l.id === layer.bondTo)
    if (!a || !b) { line.visible = false; return }
    line.visible = layer.visible !== false
    const pa = a.position || [0, 0, 0]
    const pb = b.position || [0, 0, 0]
    const arr = line.geometry.attributes.position.array
    arr[0] = pa[0]; arr[1] = pa[1]; arr[2] = pa[2]
    arr[3] = pb[0]; arr[4] = pb[1]; arr[5] = pb[2]
    line.geometry.attributes.position.needsUpdate = true
    line.geometry.computeBoundingSphere()
  })
  return (
    <line ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[new Float32Array(6), 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={layer.color || '#88ccff'} transparent opacity={layer.opacity ?? 0.6} />
    </line>
  )
}

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

  // Rebuild group maps (layer→group and group→pivot center of base positions)
  useMemo(() => {
    groupOfLayer.clear(); groupPivots.clear()
    groups.forEach(g => {
      const kids = g.children.map(id => layers.find(l => l.id === id)).filter(Boolean)
      if (!kids.length) return
      let cx = 0, cy = 0, cz = 0
      kids.forEach(l => { const p = l.position || [0, 0, 0]; cx += p[0]; cy += p[1]; cz += p[2] })
      groupPivots.set(g.id, [cx / kids.length, cy / kids.length, cz / kids.length])
      g.children.forEach(id => groupOfLayer.set(id, g.id))
    })
  }, [layers, groups])

  const selectedMesh = selectedId ? meshRegistry.get(selectedId) : null

  // Group pivot: invisible object at group center
  const selectedGroup = groups.find(g => g.id === selectedGroupId)
  const groupChildren = selectedGroup ? selectedGroup.children.map(id => layers.find(l => l.id === id)).filter(Boolean) : []

  return (
    <>
      <TimelineDriver />
      {showAxes && !viewerMode && <axesHelper args={[2]} />}
      {showGrid && !viewerMode && <gridHelper args={[gridSize, gridDivisions, '#333333', '#222222']} />}
      {layers.map((layer) => (
        layer.type === 'particles'
          ? <ParticleCloud key={layer.id} layer={layer} />
          : layer.type === 'wave_sphere'
          ? <WaveSphere key={layer.id} layer={layer} />
          : layer.type === 'label3d'
          ? <Label3D key={layer.id} layer={layer} />
          : layer.type === 'bond'
          ? <Bond key={layer.id} layer={layer} />
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

// Advances the timeline playhead (rAF-based so it also works on `frameloop='demand'`
// devices) and exposes invalidate() for scrubbing redraws.
function TimelineDriver() {
  const invalidate = useThree(s => s.invalidate)
  const camera = useThree(s => s.camera)
  const controls = useThree(s => s.controls)
  const playing = useStore(s => s.timeline.playing)

  useEffect(() => { invalidateRef.current = invalidate }, [invalidate])

  // Frame all scene objects: fit the camera to their bounding sphere and aim
  // the orbit pivot at their center. Falls back to the default view if empty.
  useEffect(() => {
    centerCameraRef.current = () => {
      const box = new THREE.Box3()
      let any = false
      meshRegistry.forEach((m) => {
        if (!m || m.visible === false) return
        box.expandByObject(m); any = true
      })
      const target = controls?.target || new THREE.Vector3()
      if (!any || box.isEmpty()) {
        target.set(0, 0, 0)
        camera.position.set(0, 2, 6)
      } else {
        const center = box.getCenter(new THREE.Vector3())
        const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 0.5)
        const fov = (camera.fov || 60) * (Math.PI / 180)
        const dist = (radius / Math.sin(fov / 2)) * 1.15
        const dir = camera.position.clone().sub(target).normalize()
        if (dir.lengthSq() === 0) dir.set(0, 0.3, 1).normalize()
        target.copy(center)
        camera.position.copy(center).add(dir.multiplyScalar(dist))
      }
      camera.lookAt(target)
      controls?.update?.()
      invalidate()
    }
    return () => { centerCameraRef.current = null }
  }, [camera, controls, invalidate])

  useEffect(() => {
    if (!playing) return
    let raf
    let last = performance.now()
    const tick = (now) => {
      const dt = (now - last) / 1000
      last = now
      const s = useStore.getState()
      const { time, duration, loop } = s.timeline
      let next = time + dt
      if (next >= duration) {
        if (loop) next = duration > 0 ? next % duration : 0
        else { s.setTime(duration); s.pauseTimeline(); invalidate(); return }
      }
      s.setTime(next)
      invalidate()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, invalidate])

  return null
}

function GroupGizmo({ group, layers, mode, orbitRef }) {
  // Holding the pivot node in state (not a ref) forces a re-render once the
  // mesh mounts, so TransformControls reliably attaches to it.
  const [pivot, setPivot] = useState(null)
  const updateGroup = useStore(s => s.updateGroup)
  const snap = useSnap()
  const gizmoMode = mode === 'scale' ? 'translate' : mode

  // Fixed pivot center = mean of children base positions
  const base = useMemo(() => {
    if (layers.length === 0) return [0, 0, 0]
    const sum = [0, 0, 0]
    layers.forEach(l => {
      const p = l.position || [0, 0, 0]
      sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]
    })
    return [sum[0] / layers.length, sum[1] / layers.length, sum[2] / layers.length]
  }, [layers])

  const gpos = group.position || [0, 0, 0]
  const grot = group.rotation || [0, 0, 0]

  useEffect(() => {
    if (pivot) {
      pivot.position.set(base[0] + gpos[0], base[1] + gpos[1], base[2] + gpos[2])
      pivot.rotation.set(grot[0], grot[1], grot[2])
    }
  }, [pivot, base, gpos, grot])

  const handleChange = () => {
    if (!pivot) return
    const position = [pivot.position.x - base[0], pivot.position.y - base[1], pivot.position.z - base[2]]
    const rotation = [pivot.rotation.x, pivot.rotation.y, pivot.rotation.z]
    updateGroup(group.id, { position, rotation })
    const tl = useStore.getState().timeline
    if (tl.recording) {
      if (mode === 'rotate') useStore.getState().addGroupKeyframe(group.id, 'rotation', tl.time, rotation)
      else useStore.getState().addGroupKeyframe(group.id, 'position', tl.time, position)
    }
  }

  return (
    <>
      <mesh ref={(node) => { if (node && node !== pivot) setPivot(node) }} position={base} visible={false}>
        <sphereGeometry args={[0.01]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      {pivot && (
        <TransformControls
          object={pivot}
          mode={gizmoMode}
          size={0.8}
          translationSnap={gizmoMode === 'translate' ? snap : null}
          rotationSnap={gizmoMode === 'rotate' && snap ? Math.PI / 12 : null}
          onObjectChange={handleChange}
          onMouseDown={() => { if (orbitRef.current) orbitRef.current.enabled = false }}
          onMouseUp={() => { if (orbitRef.current) orbitRef.current.enabled = true }}
        />
      )}
    </>
  )
}

// Grid snap value for gizmos: gridSnap by default, null (free) while Ctrl is held.
function useSnap() {
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
  return (snapToGrid && !ctrlHeld) ? gridSnap : null
}

function GizmoWrapper({ object, mode, layerId, orbitRef }) {
  const updateLayer = useStore(s => s.updateLayer)
  const snap = useSnap()

  const handleChange = () => {
    if (!object) return
    const position = [object.position.x, object.position.y, object.position.z]
    const rotation = [object.rotation.x, object.rotation.y, object.rotation.z]
    const scale = [object.scale.x, object.scale.y, object.scale.z]
    updateLayer(layerId, { position, rotation, scale })
    const tl = useStore.getState().timeline
    if (tl.recording) {
      const val = mode === 'translate' ? position : mode === 'rotate' ? rotation : scale
      useStore.getState().addKeyframe(layerId, mode === 'translate' ? 'position' : mode === 'rotate' ? 'rotation' : 'scale', tl.time, val)
    }
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

  // Label texture for spheres (shared cache keyed by label+color)
  const labelTexture = useMemo(() => {
    if (!layer.label || (layer.type !== 'sphere' && layer.type !== 'icosahedron')) return null
    return getLabelTexture(layer.label, layer.color)
  }, [layer.label, layer.color, layer.type])

  const addToSelection = useStore(s => s.addToSelection)
  const emissiveIntensity = useStore(s => s.emissiveIntensity)

  // For orbital types in pointCloud mode, use dense point distribution
  const isOrbitalType = ['torus', 'orbital_p', 'orbital_d', 'orbital_f'].includes(layer.type)
  const orbitalPointGeo = useMemo(() => {
    if (!layer.pointCloud || !isOrbitalType) return null
    const radius = layer.torusRadius || 0.5
    const count = layer.pointDensity || 3000
    return createOrbitalPointCloud(layer.type, radius, count)
  }, [layer.pointCloud, layer.type, layer.torusRadius, layer.pointDensity, isOrbitalType])

  const handleClick = (e) => {
    e.stopPropagation()
    // Click-to-transfer shared electron: toggle which orbital it sits on.
    if (layer.share?.mode === 'click') {
      toggleShareTransfer(layer.share)
      invalidateRef.current?.()
    }
    if (viewerMode) return
    if (e.shiftKey) {
      addToSelection(layer.id)
    } else {
      setSelected(layer.id)
    }
  }

  useFrame((_, delta) => {
    const m = meshRef.current
    if (!m) return
    const kf = layer.keyframes
    const gid = groupOfLayer.get(layer.id)
    const group = gid ? useStore.getState().groups.find(g => g.id === gid) : null
    const groupAnimated = !!group && !!(group.keyframes || group.position || group.rotation || group.opacity != null)

    // Fast path: nothing animated → continuous spin (if any) and bail
    if (!kf && !layer.orbital && !layer.share && !groupAnimated) {
      if (layer.animation) {
        m.rotation.x += layer.animation.x * delta
        m.rotation.y += layer.animation.y * delta
        m.rotation.z += layer.animation.z * delta
      }
      return
    }

    const t = useStore.getState().timeline.time
    const bp = layer.position || [0, 0, 0]
    const br = layer.rotation || [0, 0, 0]
    let lp = [bp[0], bp[1], bp[2]]      // local position (world space, before group)
    let lr = [br[0], br[1], br[2]]      // local rotation
    let lo = layer.opacity ?? 1          // local opacity
    let opacityDriven = false

    // Layer keyframes
    if (kf) {
      const p = sampleProp(kf.position, t); if (p) lp = [p[0], p[1], p[2]]
      const r = sampleProp(kf.rotation, t); if (r) lr = [r[0], r[1], r[2]]
      const s = sampleProp(kf.scale, t); if (s) m.scale.set(s[0], s[1], s[2])
      const o = sampleProp(kf.opacity, t); if (o != null) { lo = o; opacityDriven = true }
    }

    // Orbital motion overrides local position (already world space)
    if (layer.orbital && !kf?.position?.length) {
      layer.orbital.angle += layer.orbital.speed * delta
      const ot = layer.orbital.angle / (Math.PI * 2) % 1
      const pathType = layer.orbital.pathType || 'torus'
      const parentId = layer.orbital.parentId
      const parent = parentId ? useStore.getState().layers.find(l => l.id === parentId) : null
      const radius = parent ? (parent.torusRadius || 0.5) - (parent.pathOffset || 0) : layer.orbital.radius
      const parentPos = parent?.position || [0, 0, 0]
      const parentRot = parent?.rotation || [layer.orbital.tiltX || 0, 0, layer.orbital.tiltZ || 0]
      const parentScale = parent?.scale || [1, 1, 1]
      let pt
      if (pathType === 'torus') pt = { x: radius * Math.cos(layer.orbital.angle), y: radius * Math.sin(layer.orbital.angle), z: 0 }
      else pt = getOrbitalPoint(pathType, ot, radius)
      const v = new THREE.Vector3(pt.x * parentScale[0], pt.y * parentScale[1], pt.z * parentScale[2])
      v.applyEuler(new THREE.Euler(parentRot[0], parentRot[1], parentRot[2]))
      lp = [v.x + parentPos[0], v.y + parentPos[1], v.z + parentPos[2]]
    }

    // Shared electron: orbits two orbitals and blends between them (click/transfer/oscillate)
    if (layer.share && !kf?.position?.length) {
      const sh = layer.share
      sh.angle = (sh.angle || 0) + (sh.speed || 2) * delta
      const all = useStore.getState().layers
      const A = all.find(l => l.id === sh.fromId)
      const B = all.find(l => l.id === sh.toId)
      if (A && B) {
        orbitalPointWorld(A, sh.angle, _vecA)
        orbitalPointWorld(B, sh.angle, _vecB)
        let w
        if (sh.mode === 'click') {
          // Click-driven transfer: animate the blend weight towards the
          // clicked target (0 = from-orbital, 1 = to-orbital) over `duration`.
          if (sh.transitioning) {
            sh.transP = (sh.transP || 0) + delta / (sh.duration || 1)
            if (sh.transP >= 1) { sh.transP = 1; sh.transitioning = false }
            const e = sh.transP
            const sm = e * e * (3 - 2 * e)
            sh.clickW = (sh.transStart || 0) + ((sh.clickTarget || 0) - (sh.transStart || 0)) * sm
            invalidateRef.current?.() // keep frames coming on `frameloop='demand'`
          }
          w = sh.clickW || 0
        } else if (sh.mode === 'oscillate') {
          sh.clock = (sh.clock || 0) + delta
          const period = sh.period || 2
          w = 0.5 - 0.5 * Math.cos((sh.clock / period) * Math.PI * 2)
        } else {
          const t0 = sh.t0 || 0
          const dur = sh.duration || 1
          const f = dur > 0 ? (t - t0) / dur : (t >= t0 ? 1 : 0)
          const cl = f <= 0 ? 0 : f >= 1 ? 1 : f
          w = cl * cl * (3 - 2 * cl)
        }
        _vecA.lerp(_vecB, w)
        lp = [_vecA.x, _vecA.y, _vecA.z]
      }
    }

    // Group transform: rotate/translate around the group pivot, multiply opacity
    if (groupAnimated) {
      const pivot = groupPivots.get(gid) || [0, 0, 0]
      const gp = group.keyframes?.position?.length ? sampleProp(group.keyframes.position, t) : (group.position || [0, 0, 0])
      const gr = group.keyframes?.rotation?.length ? sampleProp(group.keyframes.rotation, t) : (group.rotation || [0, 0, 0])
      const go = group.keyframes?.opacity?.length ? sampleProp(group.keyframes.opacity, t) : group.opacity
      const gQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(gr[0], gr[1], gr[2]))
      const off = new THREE.Vector3(lp[0] - pivot[0], lp[1] - pivot[1], lp[2] - pivot[2]).applyQuaternion(gQ)
      lp = [pivot[0] + off.x + (gp[0] || 0), pivot[1] + off.y + (gp[1] || 0), pivot[2] + off.z + (gp[2] || 0)]
      const lQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(lr[0], lr[1], lr[2]))
      m.quaternion.copy(gQ.multiply(lQ))
      if (go != null) { lo *= go; opacityDriven = true }
    } else {
      m.rotation.set(lr[0], lr[1], lr[2])
    }

    m.position.set(lp[0], lp[1], lp[2])
    if (opacityDriven && m.material) { m.material.transparent = true; m.material.opacity = lo; m.material.depthWrite = lo >= 1 }
  })

  const pos = layer.position || [0, 0, 0]
  const rot = layer.rotation || [0, 0, 0]
  const scl = layer.scale || [1, 1, 1]

  const isSelected = useStore(s => s.selectedIds).includes(layer.id)

  const showWire = isSelected && layer.visible !== false

  return (
    <group>
      {layer.pointCloud ? (
        <>
          <points position={pos} rotation={rot} scale={scl} onClick={handleClick} visible={layer.visible !== false} renderOrder={2}>
            {orbitalPointGeo ? <primitive object={orbitalPointGeo} attach="geometry" /> : <GeometryMemo layer={layer} />}
            <pointsMaterial color={color} size={layer.pointSize || 0.03} map={circleTexture} transparent opacity={layer.opacity ?? 0.9} depthWrite={false} sizeAttenuation alphaTest={0.01} />
          </points>
          {showWire && (
            <mesh position={pos} rotation={rot} scale={scl} raycast={noRaycast}>
              <GeometryMemo layer={layer} />
              <meshBasicMaterial color="#4c8bf5" wireframe transparent opacity={0.15} depthTest={false} />
            </mesh>
          )}
        </>
      ) : (
        <mesh ref={meshRef} position={pos} rotation={rot} scale={scl} onClick={handleClick} visible={layer.visible !== false} renderOrder={(layer.opacity ?? 1) < 1 ? 1 : 0}>
          <GeometryMemo layer={layer} />
          {labelTexture ? (
            <meshStandardMaterial map={labelTexture} emissive={color} emissiveIntensity={emissiveIntensity * 0.8} roughness={0.5} metalness={0} transparent opacity={layer.opacity ?? 1} depthWrite={(layer.opacity ?? 1) >= 1} />
          ) : (
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={emissiveIntensity} roughness={0.3} metalness={0.1} transparent opacity={layer.opacity ?? 1} depthWrite={(layer.opacity ?? 1) >= 1} />
          )}
          {/* Selection wireframe nested as a child so it inherits the live
              transform (group move/rotate, keyframes) instead of the static base. */}
          {showWire && (
            <mesh raycast={noRaycast}>
              <GeometryMemo layer={layer} />
              <meshBasicMaterial color="#4c8bf5" wireframe transparent opacity={0.15} depthTest={false} />
            </mesh>
          )}
        </mesh>
      )}
    </group>
  )
}

const noRaycast = () => null

const GeometryMemo = memo(function GeometryInner({ layer }) {
  const r = layer.sphereRadius || 0.5
  const tr = layer.torusRadius || 0.5
  const tt = layer.tubeThickness || 0.1
  const quality = useStore(s => s.quality)
  const isLowEnd = useStore(s => s.isLowEnd)
  const effectiveQ = isLowEnd && quality === 'high' ? 'medium' : quality

  // Procedural tube orbitals stay as components (few of them, varied params)
  switch (layer.type) {
    case 'orbital_p': return <PorbitalGeometry radius={tr || r} tubeRadius={tt || 0.02} />
    case 'orbital_d': return <DorbitalGeometry radius={tr || r} tubeRadius={tt || 0.02} />
    case 'orbital_f': return <ForbitalGeometry radius={tr || r} tubeRadius={tt || 0.02} />
    default: break
  }
  // Standard primitives reuse one shared, cached BufferGeometry across all
  // identical instances. dispose={null} so unmounting one mesh never frees
  // a geometry that other meshes still share.
  const geo = getPrimitiveGeometry(layer.type, r, tr, tt, effectiveQ)
  return <primitive object={geo} attach="geometry" dispose={null} />
}, (prev, next) => {
  return prev.layer.type === next.layer.type &&
    prev.layer.sphereRadius === next.layer.sphereRadius &&
    prev.layer.torusRadius === next.layer.torusRadius &&
    prev.layer.tubeThickness === next.layer.tubeThickness
})
