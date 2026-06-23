import { useStore } from '../store/useStore'
import DragInput from './DragInput'
import { invalidateRef } from '../anim'

const ANIMATABLE = ['position', 'rotation', 'opacity']

export default function GroupPanel() {
  const { groups, selectedGroupId, rightPanelOpen, viewerMode, updateGroup, removeGroup, addGroupKeyframe } = useStore()

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
      invalidateRef.current?.()
    }
  }

  return (
    <div className="absolute top-12 right-2 md:right-3 w-[min(15rem,calc(100vw-1rem))] md:w-64 max-h-[calc(100dvh-4.5rem)] overflow-y-auto bg-[#252525] border border-[#3d3d3d] rounded-lg shadow-xl z-40">
      <div className="border-b border-[#3d3d3d] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-[#8ab4f8] bg-[#4c8bf5]/15 px-1 rounded">GROUP</span>
          <span className="text-white text-xs font-medium truncate">{group.name}</span>
        </div>
        <p className="text-[9px] text-[#666] mt-1">{layerCount} objects{subGroupCount > 0 ? ` · ${subGroupCount} subgroup${subGroupCount > 1 ? 's' : ''}` : ''} · animates around its center</p>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#999]">Opacity</span>
          <DragInput label="O" value={group.opacity ?? 1} onChange={(v) => update('opacity', Math.max(0, Math.min(1, v)))} step={0.01} min={0} color="#ec6" />
        </div>

        <p className="text-[9px] text-[#555] leading-relaxed">
          Move / rotate the whole group with the gizmo (G / R). Enable <span className="text-[#ff8888]">REC</span> in the
          timeline to keyframe position, rotation and opacity.
        </p>

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
