import Scene from './components/Scene'
import Toolbar from './components/Toolbar'
import LayersPanel from './components/LayersPanel'
import PropertiesPanel from './components/PropertiesPanel'
import ConfigPanel from './components/ConfigPanel'
import ScriptConsole from './components/ScriptConsole'
import ViewerSetup from './components/ViewerSetup'
import ViewerHUD from './components/ViewerHUD'
import ShareModal from './components/ShareModal'
import KeyframePanel from './components/KeyframePanel'
import GroupPanel from './components/GroupPanel'
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
    const loadShared = async () => {
      const hash = window.location.hash
      let viewParam = null
      let isCloudId = false

      if (hash.startsWith('#view=')) {
        viewParam = hash.slice(6)
      } else if (hash.startsWith('#paste=')) {
        isCloudId = true
        viewParam = hash.slice(7)
      } else if (hash.startsWith('#id=') || hash.startsWith('#gist=')) {
        isCloudId = true
        viewParam = hash.startsWith('#id=') ? hash.slice(4) : hash.slice(6)
      } else {
        const params = new URLSearchParams(window.location.search)
        viewParam = params.get('view')
      }
      if (!viewParam) return

      try {
        let data
        if (isCloudId) {
          // Fetch from dpaste.com (raw JSON)
          const res = await fetch(`https://dpaste.com/${viewParam}.txt`)
          const text = await res.text()
          data = JSON.parse(text)
        } else {
          let jsonStr = decompressFromEncodedURIComponent(viewParam)
          if (!jsonStr) jsonStr = decompressFromEncodedURIComponent(decodeURIComponent(viewParam))
          if (!jsonStr) { console.error('Failed to decompress'); return }
          data = JSON.parse(jsonStr)
        }

        if (data?.layers) {
          const kfd = (o) => o.keyframes && Object.values(o.keyframes).some(t => t?.length)
          const animated = data.layers.some(l => kfd(l) || (l.share && l.share.mode === 'transfer')) || (data.groups || []).some(kfd)
          const cur = useStore.getState().timeline
          const state = {
            layers: data.layers,
            groups: data.groups || [],
            viewerData: data.viewer || useStore.getState().viewerData,
            viewerMode: true,
            timeline: { ...cur, ...(data.anim || {}), time: 0, playing: animated },
          }
          if (data.graphics) Object.assign(state, data.graphics)
          useStore.setState(state)
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
        // Duplicate the whole group when one is selected
        if (state.selectedGroupId) {
          const newId = state.duplicateGroup(state.selectedGroupId)
          if (newId) state.selectGroup(newId)
          return
        }
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
      <GroupPanel />
      <ConfigPanel />
      <ScriptConsole />
      <ViewerSetup />
      <ViewerHUD />
      <KeyframePanel />
      {shareOpenStore && <ShareModal onClose={toggleShare} />}

      {!viewerMode && (
        <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[#444] font-mono text-[10px] tracking-wider pointer-events-none select-none hidden md:block">
          G move · R rotate · S scale · D deselect · Del delete · F2 script
        </p>
      )}
    </div>
  )
}
