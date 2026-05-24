import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // Layers & objects
  layers: [],
  selectedId: null,
  layerCounter: 0,

  // Modes
  viewerMode: false,
  moveMode: false,
  moveAxis: null,

  // Panels
  leftPanelOpen: true,
  rightPanelOpen: true,
  scriptOpen: false,
  configOpen: false,
  viewerSetupOpen: false,

  // Graphics settings
  quality: 'medium',
  bloomStrength: 1.2,
  bloomRadius: 0.4,
  bloomThreshold: 0.1,
  emissiveIntensity: 0.4,
  exposure: 1.2,
  showAxes: true,

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
  setSelected: (id) => set({ selectedId: id }),
  deselect: () => set({ selectedId: null }),
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  toggleRightPanel: () => set((s) => ({ rightPanelOpen: !s.rightPanelOpen })),
  toggleScript: () => set((s) => ({ scriptOpen: !s.scriptOpen })),
  toggleConfig: () => set((s) => ({ configOpen: !s.configOpen })),
  setQuality: (q) => set({ quality: q }),
  setBloomStrength: (v) => set({ bloomStrength: v }),
  setBloomRadius: (v) => set({ bloomRadius: v }),
  setBloomThreshold: (v) => set({ bloomThreshold: v }),
  setEmissiveIntensity: (v) => set({ emissiveIntensity: v }),
  setExposure: (v) => set({ exposure: v }),
  setShowAxes: (v) => set({ showAxes: v }),
  enterViewerMode: () => set({ viewerMode: true, viewerSetupOpen: false, selectedId: null }),
  exitViewerMode: () => set({ viewerMode: false }),
  setViewerData: (data) => set({ viewerData: { ...get().viewerData, ...data } }),
  openViewerSetup: () => set({ viewerSetupOpen: true }),
  closeViewerSetup: () => set({ viewerSetupOpen: false }),
  incrementCounter: () => { set((s) => ({ layerCounter: s.layerCounter + 1 })); return get().layerCounter; },

  addLayer: (layer) => set((s) => ({ layers: [...s.layers, layer] })),
  removeLayer: (id) => set((s) => ({ layers: s.layers.filter(l => l.id !== id) })),
  updateLayer: (id, data) => set((s) => ({ layers: s.layers.map(l => l.id === id ? { ...l, ...data } : l) })),
  setLayers: (layers) => set({ layers }),
  clearLayers: () => set({ layers: [], selectedId: null }),
}))
