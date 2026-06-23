import { create } from 'zustand'

// Detected once: weak GPUs/mobiles default to faster, lower-detail rendering.
// deviceMemory is undefined on Safari/Firefox/iPad — only use it when present
// so capable devices aren't wrongly downgraded.
const LOW_END = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.hardwareConcurrency || 4) <= 2 ||
  (navigator.deviceMemory != null && navigator.deviceMemory <= 2)

// Narrow screens (phones): the docked left panel would cover the whole canvas,
// so it starts collapsed — the user opens it from the toolbar when needed.
const IS_NARROW = typeof window !== 'undefined' && window.innerWidth < 768

// Walk a group's subtree. Returns every descendant layer id and group id
// (including the group itself), so nested groups behave as one unit for
// move / delete / duplicate.
function descendantsOf(groups, groupId) {
  const layerIds = []
  const groupIds = []
  const walk = (gid) => {
    const g = groups.find(x => x.id === gid)
    if (!g) return
    groupIds.push(gid)
    ;(g.children || []).forEach(id => layerIds.push(id))
    groups.forEach(x => { if (x.parentId === gid) walk(x.id) })
  }
  walk(groupId)
  return { layerIds, groupIds }
}

// True if `maybeAncestor` is `groupId` or any group above it — used to block
// parenting cycles when nesting groups.
function isAncestor(groups, groupId, maybeAncestor) {
  let g = groups.find(x => x.id === groupId)
  while (g) {
    if (g.id === maybeAncestor) return true
    g = g.parentId ? groups.find(x => x.id === g.parentId) : null
  }
  return false
}

export const useStore = create((set, get) => ({
  // Layers & objects
  layers: [],
  selectedId: null,
  selectedIds: [], // multi-selection with shift
  selectedGroupId: null,
  layerCounter: 0,

  // Modes
  viewerMode: false,
  moveMode: false,
  moveAxis: null,
  transformMode: 'select', // 'select' | 'translate' | 'rotate' | 'scale'

  // Panels (left starts collapsed on phones so the canvas is visible on load)
  leftPanelOpen: !IS_NARROW,
  rightPanelOpen: true,
  scriptOpen: false,
  configOpen: false,
  viewerSetupOpen: false,
  shareOpen: false,

  // Grid
  showGrid: true,
  gridSize: 10,
  gridDivisions: 10,
  snapToGrid: true,
  gridSnap: 0.5,
  orbitalMode: 'simple', // 'simple' (wireframe paths) | 'full' (solid shapes)
  quality: 'medium',
  isLowEnd: LOW_END,
  // Smooth (high-segment) shape tessellation. Off = faster but polygonal.
  // Defaults off on low-end devices; quality presets toggle it, and changing
  // it manually drops quality into 'custom'.
  smoothShapes: !LOW_END,
  bloomStrength: 1.2,
  bloomRadius: 0.4,
  bloomThreshold: 0.1,
  emissiveIntensity: 0.4,
  exposure: 1.2,
  showAxes: true,
  bgColor: '#0a0a0f',

  // Timeline / keyframe animation
  timelineOpen: false,
  timeline: { playing: false, time: 0, duration: 5, loop: true, recording: false },

  // Viewer HUD
  viewerData: {
    symbol: 'Ne',
    name: 'Neón',
    z: '10',
    mass: '20.18',
    config: '1s^2 2s^2 2p^6',
    extra: 'Gas noble · Grupo 18',
  },

  // Actions
  setSelected: (id) => set({ selectedId: id, selectedIds: [id], selectedGroupId: null }),
  addToSelection: (id) => set((s) => {
    const ids = s.selectedIds.includes(id) ? s.selectedIds.filter(i => i !== id) : [...s.selectedIds, id]
    return { selectedIds: ids, selectedId: ids[ids.length - 1] || null, selectedGroupId: null }
  }),
  selectGroup: (id) => set({ selectedGroupId: id, selectedId: null, selectedIds: [] }),
  deselect: () => set({ selectedId: null, selectedIds: [], selectedGroupId: null }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleScript: () => set((s) => ({ scriptOpen: !s.scriptOpen })),
  toggleConfig: () => set((s) => ({ configOpen: !s.configOpen })),
  closeConfig: () => set({ configOpen: false }),
  toggleShare: () => set((s) => ({ shareOpen: !s.shareOpen })),
  setQuality: (q) => {
    const presets = {
      low: { bloomStrength: 0.3, bloomRadius: 0.2, bloomThreshold: 0.6, emissiveIntensity: 0.1, exposure: 1.0, smoothShapes: false },
      medium: { bloomStrength: 1.5, bloomRadius: 0.5, bloomThreshold: 0.1, emissiveIntensity: 0.5, exposure: 1.4, smoothShapes: true },
      high: { bloomStrength: 3.0, bloomRadius: 0.5, bloomThreshold: 0.1, emissiveIntensity: 0.6, exposure: 1.8, smoothShapes: true },
    }
    if (presets[q]) set({ quality: q, ...presets[q] })
    else set({ quality: q })
  },
  // Toggling shape smoothness is a custom tweak, like the individual sliders.
  setSmoothShapes: (v) => set({ smoothShapes: v, quality: 'custom' }),
  setTransformMode: (mode) => set({ transformMode: mode }),
  setBloomStrength: (v) => set({ bloomStrength: v, quality: 'custom' }),
  setBloomRadius: (v) => set({ bloomRadius: v, quality: 'custom' }),
  setBloomThreshold: (v) => set({ bloomThreshold: v, quality: 'custom' }),
  setEmissiveIntensity: (v) => set({ emissiveIntensity: v, quality: 'custom' }),
  setExposure: (v) => set({ exposure: v, quality: 'custom' }),
  setShowAxes: (v) => set({ showAxes: v }),
  setBgColor: (v) => set({ bgColor: v }),
  setShowGrid: (v) => set({ showGrid: v }),
  setGridSize: (v) => set({ gridSize: v }),
  setGridDivisions: (v) => set({ gridDivisions: v }),
  setSnapToGrid: (v) => set({ snapToGrid: v }),
  setGridSnap: (v) => set({ gridSnap: v }),
  setOrbitalMode: (v) => set({ orbitalMode: v }),
  enterViewerMode: () => set((s) => {
    const kfd = (o) => o.keyframes && Object.values(o.keyframes).some(t => t?.length)
    const animated = s.layers.some(l => kfd(l) || (l.share && l.share.mode === 'transfer')) || s.groups.some(kfd)
    return {
      viewerMode: true, viewerSetupOpen: false, selectedId: null,
      timeline: { ...s.timeline, time: 0, playing: animated },
    }
  }),
  exitViewerMode: () => set({ viewerMode: false }),
  setViewerData: (data) => set({ viewerData: { ...get().viewerData, ...data } }),
  openViewerSetup: () => set({ viewerSetupOpen: true }),
  closeViewerSetup: () => set({ viewerSetupOpen: false }),
  incrementCounter: () => { const next = get().layerCounter + 1; set({ layerCounter: next }); return next; },

  // === Timeline actions ===
  toggleTimeline: () => set((s) => ({ timelineOpen: !s.timelineOpen })),
  setTimeline: (patch) => set((s) => ({ timeline: { ...s.timeline, ...patch } })),
  playTimeline: () => set((s) => ({ timeline: { ...s.timeline, playing: true } })),
  pauseTimeline: () => set((s) => ({ timeline: { ...s.timeline, playing: false } })),
  togglePlay: () => set((s) => ({ timeline: { ...s.timeline, playing: !s.timeline.playing } })),
  stopTimeline: () => set((s) => ({ timeline: { ...s.timeline, playing: false, time: 0 } })),
  setTime: (t) => set((s) => ({ timeline: { ...s.timeline, time: Math.max(0, t) } })),
  setDuration: (d) => set((s) => ({ timeline: { ...s.timeline, duration: Math.max(0.1, d) } })),
  toggleLoop: () => set((s) => ({ timeline: { ...s.timeline, loop: !s.timeline.loop } })),
  toggleRecording: () => set((s) => ({ timeline: { ...s.timeline, recording: !s.timeline.recording } })),

  // Insert (or replace) a keyframe on a layer's property at time t.
  addKeyframe: (layerId, prop, t, value) => set((s) => ({
    layers: s.layers.map(l => {
      if (l.id !== layerId) return l
      const kf = { ...(l.keyframes || {}) }
      const track = [...(kf[prop] || [])]
      const v = Array.isArray(value) ? [...value] : value
      const idx = track.findIndex(k => Math.abs(k.t - t) < 0.0005)
      if (idx >= 0) track[idx] = { t: track[idx].t, v }
      else track.push({ t, v })
      track.sort((a, b) => a.t - b.t)
      kf[prop] = track
      return { ...l, keyframes: kf }
    })
  })),

  removeKeyframe: (layerId, prop, t) => set((s) => ({
    layers: s.layers.map(l => {
      if (l.id !== layerId) return l
      const kf = { ...(l.keyframes || {}) }
      if (!kf[prop]) return l
      kf[prop] = kf[prop].filter(k => Math.abs(k.t - t) >= 0.0005)
      if (kf[prop].length === 0) delete kf[prop]
      return { ...l, keyframes: kf }
    })
  })),

  clearKeyframes: (layerId) => set((s) => ({
    layers: s.layers.map(l => l.id === layerId ? { ...l, keyframes: undefined } : l)
  })),

  // Groups
  groups: [], // { id, name, children: [layerId], collapsed: bool, parentId?: groupId }
  addGroup: (name, parentId) => {
    const id = crypto.randomUUID()
    set((s) => ({ groups: [...s.groups, { id, name, children: [], collapsed: false, parentId: parentId || undefined }] }))
    return id
  },
  removeGroup: (id) => set((s) => {
    const { layerIds, groupIds } = descendantsOf(s.groups, id)
    const layerSet = new Set(layerIds)
    const groupSet = new Set(groupIds)
    return {
      groups: s.groups.filter(g => !groupSet.has(g.id)),
      layers: s.layers.filter(l => !layerSet.has(l.id)),
      selectedId: layerSet.has(s.selectedId) ? null : s.selectedId,
      selectedGroupId: groupSet.has(s.selectedGroupId) ? null : s.selectedGroupId,
    }
  }),
  toggleGroupCollapse: (id) => set((s) => ({
    groups: s.groups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g)
  })),
  // Move a layer into a group (Figma-style): strip it from any group it was in,
  // then add to the target.
  addToGroup: (groupId, layerId) => set((s) => ({
    groups: s.groups.map(g => {
      const without = g.children.filter(c => c !== layerId)
      return g.id === groupId ? { ...g, children: [...without, layerId] } : { ...g, children: without }
    })
  })),
  removeFromGroup: (groupId, layerId) => set((s) => ({
    groups: s.groups.map(g => g.id === groupId ? { ...g, children: g.children.filter(c => c !== layerId) } : g)
  })),
  // Nest a group under another (or pass null/undefined to make it a root group).
  // Blocks cycles (can't parent a group to itself or one of its descendants).
  setGroupParent: (groupId, parentId) => set((s) => {
    if (groupId === parentId) return s
    if (parentId && isAncestor(s.groups, parentId, groupId)) return s
    return { groups: s.groups.map(g => g.id === groupId ? { ...g, parentId: parentId || undefined } : g) }
  }),
  renameGroup: (id, name) => set((s) => ({
    groups: s.groups.map(g => g.id === id ? { ...g, name } : g)
  })),
  // Group transform (relative to the group's pivot) + keyframes
  updateGroup: (id, patch) => set((s) => ({
    groups: s.groups.map(g => g.id === id ? { ...g, ...patch } : g)
  })),
  addGroupKeyframe: (groupId, prop, t, value) => set((s) => ({
    groups: s.groups.map(g => {
      if (g.id !== groupId) return g
      const kf = { ...(g.keyframes || {}) }
      const track = [...(kf[prop] || [])]
      const v = Array.isArray(value) ? [...value] : value
      const idx = track.findIndex(k => Math.abs(k.t - t) < 0.0005)
      if (idx >= 0) track[idx] = { t: track[idx].t, v }
      else track.push({ t, v })
      track.sort((a, b) => a.t - b.t)
      kf[prop] = track
      return { ...g, keyframes: kf }
    })
  })),
  removeGroupKeyframe: (groupId, prop, t) => set((s) => ({
    groups: s.groups.map(g => {
      if (g.id !== groupId) return g
      const kf = { ...(g.keyframes || {}) }
      if (!kf[prop]) return g
      kf[prop] = kf[prop].filter(k => Math.abs(k.t - t) >= 0.0005)
      if (kf[prop].length === 0) delete kf[prop]
      return { ...g, keyframes: kf }
    })
  })),
  clearGroupKeyframes: (groupId) => set((s) => ({
    groups: s.groups.map(g => g.id === groupId ? { ...g, keyframes: undefined } : g)
  })),
  // Duplicate a whole group subtree: clones every descendant layer AND nested
  // subgroup with fresh ids, remaps orbital/label/bond/share references plus
  // group parent links, and deep-copies keyframes and transforms.
  duplicateGroup: (groupId) => {
    const s = get()
    const group = s.groups.find(g => g.id === groupId)
    if (!group) return null
    const cloneKf = (kf) => {
      if (!kf) return undefined
      const out = {}
      for (const k in kf) out[k] = kf[k].map(p => ({ t: p.t, v: Array.isArray(p.v) ? [...p.v] : p.v }))
      return out
    }
    const offset = 0.3
    const { layerIds, groupIds } = descendantsOf(s.groups, groupId)

    // Fresh ids for every cloned layer and group.
    const idMap = new Map()        // old layer id -> new layer id
    const groupIdMap = new Map()   // old group id -> new group id
    layerIds.forEach(id => idMap.set(id, crypto.randomUUID()))
    groupIds.forEach(id => groupIdMap.set(id, crypto.randomUUID()))

    const newLayers = layerIds
      .map(id => s.layers.find(l => l.id === id))
      .filter(Boolean)
      .map(l => ({ ...l, id: idMap.get(l.id) }))
    newLayers.forEach(nl => {
      const p = nl.position || [0, 0, 0]
      nl.position = [p[0] + offset, p[1] + offset, p[2]]
      if (nl.orbital) {
        nl.orbital = { ...nl.orbital }
        if (nl.orbital.parentId && idMap.has(nl.orbital.parentId)) nl.orbital.parentId = idMap.get(nl.orbital.parentId)
      }
      if (nl.share) {
        nl.share = { ...nl.share }
        if (idMap.has(nl.share.fromId)) nl.share.fromId = idMap.get(nl.share.fromId)
        if (idMap.has(nl.share.toId)) nl.share.toId = idMap.get(nl.share.toId)
      }
      if (idMap.has(nl.bondFrom)) nl.bondFrom = idMap.get(nl.bondFrom)
      if (idMap.has(nl.bondTo)) nl.bondTo = idMap.get(nl.bondTo)
      if (nl.labelParentId && idMap.has(nl.labelParentId)) nl.labelParentId = idMap.get(nl.labelParentId)
      if (nl.keyframes) nl.keyframes = cloneKf(nl.keyframes)
    })

    const newGroups = groupIds
      .map(id => s.groups.find(g => g.id === id))
      .filter(Boolean)
      .map(g => ({
        ...g,
        id: groupIdMap.get(g.id),
        name: g.id === groupId ? (g.name || 'Group') + '_copy' : g.name,
        collapsed: false,
        children: g.children.map(cid => idMap.get(cid)).filter(Boolean),
        // Top of the subtree stays a sibling of the original; inner groups
        // re-link to their cloned parent.
        parentId: g.id === groupId ? g.parentId : groupIdMap.get(g.parentId),
        keyframes: cloneKf(g.keyframes),
        position: g.position ? [...g.position] : undefined,
        rotation: g.rotation ? [...g.rotation] : undefined,
      }))

    set(st => ({ layers: [...st.layers, ...newLayers], groups: [...st.groups, ...newGroups] }))
    return groupIdMap.get(groupId)
  },
  moveGroup: (groupId, delta) => set((s) => {
    const group = s.groups.find(g => g.id === groupId)
    if (!group) return s
    const { layerIds } = descendantsOf(s.groups, groupId)
    const layerSet = new Set(layerIds)
    const newLayers = s.layers.map(l => {
      if (layerSet.has(l.id)) {
        const pos = l.position || [0, 0, 0]
        return { ...l, position: [pos[0] + delta[0], pos[1] + delta[1], pos[2] + delta[2]] }
      }
      return l
    })
    return { layers: newLayers }
  }),

  addLayer: (layer) => set((s) => ({ layers: [...s.layers, layer] })),
  removeLayer: (id) => set((s) => ({ layers: s.layers.filter(l => l.id !== id) })),
  updateLayer: (id, data) => set((s) => ({ layers: s.layers.map(l => l.id === id ? { ...l, ...data } : l) })),
  setLayers: (layers) => set({ layers }),
  clearLayers: () => set({ layers: [], selectedId: null, groups: [] }),
}))
