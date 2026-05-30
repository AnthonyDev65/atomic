import Scene from './components/Scene'
import Toolbar from './components/Toolbar'
import LayersPanel from './components/LayersPanel'
import PropertiesPanel from './components/PropertiesPanel'
import ConfigPanel from './components/ConfigPanel'
import ScriptConsole from './components/ScriptConsole'
import ViewerSetup from './components/ViewerSetup'
import ViewerHUD from './components/ViewerHUD'
import ShareModal from './components/ShareModal'
import { useStore } from './store/useStore'
import { useEffect } from 'react'
import { decompressFromEncodedURIComponent } from 'lz-string'

export default function App() {
  const viewerMode = useStore(s => s.viewerMode)
  const deselect = useStore(s => s.deselect)
  const setTransformMode = useStore(s => s.setTransformMode)
  const toggleScript = useStore(s => s.toggleScript)
  const selectedId = useStore(s => s.selectedId)
  const removeLayer = useStore(s => s.removeLayer)
  const shareOpenStore = useStore(s => s.shareOpen)
  const toggleShare = useStore(s => s.toggleShare)

  // Load shared model from URL on mount
  useEffect(() => {
    const loadShared = () => {
      // Check hash fragment first (new format), then query params (legacy)
      let viewParam = null
      const hash = window.location.hash
      if (hash.startsWith('#view=')) {
        viewParam = hash.slice(6)
      } else {
        const params = new URLSearchParams(window.location.search)
        viewParam = params.get('view')
      }
      if (!viewParam) return

      try {
        let json = decompressFromEncodedURIComponent(viewParam)
        if (!json) json = decompressFromEncodedURIComponent(decodeURIComponent(viewParam))
        if (!json) { console.error('Failed to decompress'); return }

        const data = JSON.parse(json)
        if (data.layers) {
          const state = {
            layers: data.layers,
            groups: data.groups || [],
            viewerData: data.viewer || useStore.getState().viewerData,
            viewerMode: true,
          }
          if (data.graphics) Object.assign(state, data.graphics)
          useStore.setState(state)
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname)
        }
      } catch (e) { console.error('Failed to load shared model:', e) }
    }

    setTimeout(loadShared, 150)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      // Ctrl+D: duplicate
      if ((e.key === 'd' || e.key === 'D') && e.ctrlKey) {
        e.preventDefault()
        const state = useStore.getState()
        const layer = state.layers.find(l => l.id === state.selectedId)
        if (layer) {
          const newId = crypto.randomUUID()
          const offset = 0.3
          state.addLayer({
            ...layer,
            id: newId,
            name: layer.name + '_copy',
            position: [
              (layer.position?.[0] || 0) + offset,
              (layer.position?.[1] || 0) + offset,
              (layer.position?.[2] || 0),
            ],
            orbital: layer.orbital ? { ...layer.orbital, angle: layer.orbital.angle + 0.5 } : undefined,
          })
          state.setSelected(newId)
        }
        return
      }
      switch (e.key) {
        case 'd': case 'D': case 'Escape': deselect(); break
        case 'g': case 'G': setTransformMode('translate'); break
        case 'r': case 'R': setTransformMode('rotate'); break
        case 's': case 'S': setTransformMode('scale'); break
        case 'F2': e.preventDefault(); toggleScript(); break
        case 'Delete': if (selectedId) { removeLayer(selectedId); deselect(); } break
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [deselect, setTransformMode, toggleScript, selectedId, removeLayer])

  return (
    <div className="w-screen h-screen relative bg-[#1a1a1a] overflow-hidden touch-none">
      <Scene />
      <Toolbar />
      <LayersPanel />
      <PropertiesPanel />
      <ConfigPanel />
      <ScriptConsole />
      <ViewerSetup />
      <ViewerHUD />
      {shareOpenStore && <ShareModal onClose={toggleShare} />}

      {!viewerMode && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[#444] font-mono text-[10px] tracking-wider pointer-events-none select-none hidden md:block">
          G move · R rotate · S scale · D deselect · Del delete · F2 script
        </p>
      )}
    </div>
  )
}
