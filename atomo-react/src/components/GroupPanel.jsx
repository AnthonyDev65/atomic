import { useStore } from '../store/useStore'
import DragInput from './DragInput'
import { invalidateRef } from '../anim'
import { descendantLayerIds, computeGroupBounds } from '../groupBounds'

const ANIMATABLE = ['position', 'rotation', 'opacity']

export default function GroupPanel() {
  const { groups, layers, selectedGroupId, rightPanelOpen, viewerMode, updateGroup, removeGroup, addGroupKeyframe, centerGroupOrigin, resetGroupOrigin, setGroupPivot, timelineOpen } = useStore()

  if (!rightPanelOpen || viewerMode || !selectedGroupId) return null
  const group = groups.find(g => g.id === selectedGroupId)
  if (!group) return null

  // Count layers across this group and any nested subgroups.
  const countDescendantLayers = (gid) => {
    const g = groups.find(x => x.id === gid)
    if (!g) return 0
    return g.children.length + groups.filter(x => x.parentId === gid).reduce((n, sg) => n + countDescendantLayers(sg.id), 0)
  }
  const subGroupCount = groups.filter(g => g.parentId === group.id).length
  const layerCount = countDescendantLayers(group.id)

  const update = (field, value) => {
    updateGroup(group.id, { [field]: value })
    const tl = useStore.getState().timeline
    if (tl.recording && ANIMATABLE.includes(field)) {
      addGroupKeyframe(group.id, field, tl.time, value)
    }
    invalidateRef.current?.()
  }

  const pos = group.position || [0, 0, 0]
  const rotDeg = (group.rotation || [0, 0, 0]).map(r => Math.round(r * 180 / Math.PI))

  // Bounds of the whole subtree (orbital electrons resolved to their orbit
  // center), so the Origin inputs read in real units relative to the group's
  // dimensions. `pivotAuto` is the geometric center used when no override is set.
  const layerById = new Map(layers.map(l => [l.id, l]))
  const descLayers = descendantLayerIds(groups, group.id).map(id => layerById.get(id)).filter(Boolean)
  const bounds = computeGroupBounds(descLayers, layerById)
  const pivot = group.pivot || bounds.center
  const fmt = (n) => (Math.round(n * 100) / 100)
  // Pivot as a fraction of each axis (0 = min edge, 0.5 = center, 1 = max edge).
  const frac = pivot.map((p, i) => bounds.size[i] > 1e-6 ? (p - bounds.min[i]) / bounds.size[i] : 0.5)
  const setPivotAxis = (i, value) => {
    const next = [...pivot]; next[i] = value
    setGroupPivot(group.id, next)
    invalidateRef.current?.()
  }

  return (
    <div className={`absolute top-12 right-2 md:right-3 w-[min(15rem,calc(100vw-1rem))] md:w-64 overflow-y-auto bg-[#252525] border border-[#3d3d3d] rounded-lg shadow-xl z-40 ${timelineOpen ? 'max-h-[calc(100dvh-4.5rem-208px)]' : 'max-h-[calc(100dvh-4.5rem)]'}`}>
      <div className="border-b border-[#3d3d3d] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-[#8ab4f8] bg-[#4c8bf5]/15 px-1 rounded">GROUP</span>
          <span className="text-white text-xs font-medium truncate">{group.name}</span>
        </div>
        <p className="text-[9px] text-[#666] mt-1">{layerCount} objects{subGroupCount > 0 ? ` · ${subGroupCount} subgroup${subGroupCount > 1 ? 's' : ''}` : ''} · animates around its center</p>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Position offset (relative to the group's center) */}
        <div className="space-y-1">
          <span className="text-[9px] text-[#666] uppercase tracking-wider font-medium">Position</span>
          <div className="flex gap-1">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <DragInput key={axis} label={axis} value={pos[i]} color={['#e55', '#5b5', '#55e'][i]} step={0.1}
                onChange={(v) => { const n = [...pos]; n[i] = v; update('position', n) }} />
            ))}
          </div>
        </div>

        {/* Rotation in degrees */}
        <div className="space-y-1">
          <span className="text-[9px] text-[#666] uppercase tracking-wider font-medium">Rotation</span>
          <div className="flex gap-1">
            {['X°', 'Y°', 'Z°'].map((axis, i) => (
              <DragInput key={axis} label={axis} value={rotDeg[i]} color={['#e55', '#5b5', '#55e'][i]} step={5}
                onChange={(v) => { const n = [...rotDeg]; n[i] = v; update('rotation', n.map(d => d * Math.PI / 180)) }} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#999]">Opacity</span>
          <DragInput label="O" value={group.opacity ?? 1} onChange={(v) => update('opacity', Math.max(0, Math.min(1, v)))} step={0.01} min={0} color="#ec6" />
        </div>

        <p className="text-[9px] text-[#555] leading-relaxed">
          Edit values here or use the gizmo (G / R). Enable <span className="text-[#ff8888]">REC</span> in the
          timeline to keyframe position, rotation and opacity.
        </p>

        {/* Origin / pivot control. By default the group pivots around the
            geometric center of its true bounds (orbital electrons are resolved
            to their orbit center, so the placeholder positions no longer pull
            it off to one side). These inputs show where the pivot sits and let
            it be moved relative to the group's dimensions. */}
        <div className="space-y-1 pt-1 border-t border-[#333]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-[#666] uppercase tracking-wider font-medium">Origin (pivot)</span>
            {group.pivot && <span className="text-[8px] text-[#8ab4f8]">manual</span>}
          </div>
          <div className="flex gap-1">
            {['X', 'Y', 'Z'].map((axis, i) => (
              <DragInput key={axis} label={axis} value={fmt(pivot[i])} color={['#e55', '#5b5', '#55e'][i]} step={0.05}
                onChange={(v) => setPivotAxis(i, v)} />
            ))}
          </div>
          <p className="text-[9px] text-[#555] leading-relaxed">
            Size {fmt(bounds.size[0])} × {fmt(bounds.size[1])} × {fmt(bounds.size[2])} ·
            pivot at {frac.map(f => Math.round(f * 100) + '%').join(' / ')} of each axis.
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => { centerGroupOrigin(group.id); invalidateRef.current?.() }}
              className="flex-1 py-1.5 rounded bg-[#2a2a2a] border border-[#3d3d3d] text-[#999] text-[10px] hover:text-white transition">
              Centrar origen
            </button>
            {group.pivot && (
              <button
                onClick={() => { resetGroupOrigin(group.id); invalidateRef.current?.() }}
                className="flex-1 py-1.5 rounded bg-[#2a2a2a] border border-[#3d3d3d] text-[#999] text-[10px] hover:text-white transition">
                Auto
              </button>
            )}
          </div>
        </div>

        {group.keyframes && (
          <button onClick={() => updateGroup(group.id, { keyframes: undefined, position: undefined, rotation: undefined })}
            className="w-full py-1.5 rounded bg-[#2a2a2a] border border-[#3d3d3d] text-[#999] text-[10px] hover:text-white transition">
            Reset group animation
          </button>
        )}

        <button onClick={() => removeGroup(group.id)}
          className="w-full py-1.5 rounded bg-[#3a2020] border border-[#5a3030] text-[#e88] text-[11px] hover:bg-[#4a2525] transition">
          Delete group
        </button>
      </div>
    </div>
  )
}
