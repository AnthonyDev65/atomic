import Scene from './components/Scene'
import Toolbar from './components/Toolbar'
import LayersPanel from './components/LayersPanel'
import PropertiesPanel from './components/PropertiesPanel'
import ConfigPanel from './components/ConfigPanel'
import ScriptConsole from './components/ScriptConsole'
import ViewerSetup from './components/ViewerSetup'
import ViewerHUD from './components/ViewerHUD'
import { useStore } from './store/useStore'

export default function App() {
  const { viewerMode } = useStore()

  return (
    <div className="w-screen h-screen relative bg-[#0a0a0f]">
      <Scene />
      <Toolbar />
      <LayersPanel />
      <PropertiesPanel />
      <ConfigPanel />
      <ScriptConsole />
      <ViewerSetup />
      <ViewerHUD />

      {!viewerMode && (
        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/20 font-mono text-[11px] tracking-wider pointer-events-none">
          G=mover · X/Y/Z=eje · flechas=desplazar · Esc=cancelar · clic=seleccionar · scroll=zoom
        </p>
      )}
    </div>
  )
}
