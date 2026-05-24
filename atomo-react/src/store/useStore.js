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

  // Grid
  showGrid: true,
  gridSize: 10,
  gridDivisions: 10,
  snapToGrid: true,
  gridSnap: 0.5,
  orbitalMode: 'simple', // 'simple' (wireframe paths) | 'full' (solid shapes)
  quality: 'medium',
  bloomStrength: 1.2,
  bloomRadius: 0.4,
  bloomThreshold: 0.1,
  emissiveIntensity: 0.4,
  exposure: 1.2,
  showAxes: true,
  bgColor: '#0a0a0f',

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
  enterViewerMode: () => set({ viewerMode: true, viewerSetupOpen: false, selectedId: null }),
  exitViewerMode: () => set({ viewerMode: false }),
  setViewerData: (data) => set({ viewerData: { ...get().viewerData, ...data } }),
  openViewerSetup: () => set({ viewerSetupOpen: true }),
  closeViewerSetup: () => set({ viewerSetupOpen: false }),
  incrementCounter: () => { const next = get().layerCounter + 1; set({ layerCounter: next }); return next; },

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
