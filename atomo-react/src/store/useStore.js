import { create } from 'zustand'

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

  // Panels
  leftPanelOpen: true,
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
  isLowEnd: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.hardwareConcurrency || 4) <= 2 ||
    (navigator.deviceMemory || 4) <= 2,
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
  toggleShare: () => set((s) => ({ shareOpen: !s.shareOpen })),
  setQuality: (q) => {
    const presets = {
      low: { bloomStrength: 0.3, bloomRadius: 0.2, bloomThreshold: 0.6, emissiveIntensity: 0.1, exposure: 1.0 },
      medium: { bloomStrength: 1.5, bloomRadius: 0.5, bloomThreshold: 0.1, emissiveIntensity: 0.5, exposure: 1.4 },
      high: { bloomStrength: 3.0, bloomRadius: 0.5, bloomThreshold: 0.1, emissiveIntensity: 0.6, exposure: 1.8 },
    }
    if (presets[q]) set({ quality: q, ...presets[q] })
    else set({ quality: q })
  },
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
  groups: [], // { id, name, children: [layerId], collapsed: bool }
  addGroup: (name) => {
    const id = crypto.randomUUID()
    set((s) => ({ groups: [...s.groups, { id, name, children: [], collapsed: false }] }))
    return id
  },
  removeGroup: (id) => set((s) => {
    const group = s.groups.find(g => g.id === id)
    const childIds = group ? group.children : []
    return {
      groups: s.groups.filter(g => g.id !== id),
      layers: s.layers.filter(l => !childIds.includes(l.id)),
      selectedId: childIds.includes(s.selectedId) ? null : s.selectedId,
      selectedGroupId: s.selectedGroupId === id ? null : s.selectedGroupId,
    }
  }),
  toggleGroupCollapse: (id) => set((s) => ({
    groups: s.groups.map(g => g.id === id ? { ...g, collapsed: !g.collapsed } : g)
  })),
  addToGroup: (groupId, layerId) => set((s) => ({
    groups: s.groups.map(g => g.id === groupId ? { ...g, children: [...g.children.filter(c => c !== layerId), layerId] } : g)
  })),
  removeFromGroup: (groupId, layerId) => set((s) => ({
    groups: s.groups.map(g => g.id === groupId ? { ...g, children: g.children.filter(c => c !== layerId) } : g)
  })),
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
  // Duplicate a whole group: clones every child with fresh ids, remaps orbital
  // parent / label parent references, deep-copies keyframes and group transform.
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
    const idMap = new Map()
    const newLayers = group.children
      .map(cid => s.layers.find(l => l.id === cid))
      .filter(Boolean)
      .map(l => { const nid = crypto.randomUUID(); idMap.set(l.id, nid); return { ...l, id: nid } })
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
    const newGroupId = crypto.randomUUID()
    const newGroup = {
      ...group,
      id: newGroupId,
      name: (group.name || 'Group') + '_copy',
      collapsed: false,
      children: newLayers.map(l => l.id),
      keyframes: cloneKf(group.keyframes),
      position: group.position ? [...group.position] : undefined,
      rotation: group.rotation ? [...group.rotation] : undefined,
    }
    set(st => ({ layers: [...st.layers, ...newLayers], groups: [...st.groups, newGroup] }))
    return newGroupId
  },
  moveGroup: (groupId, delta) => set((s) => {
    const group = s.groups.find(g => g.id === groupId)
    if (!group) return s
    const newLayers = s.layers.map(l => {
      if (group.children.includes(l.id)) {
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
