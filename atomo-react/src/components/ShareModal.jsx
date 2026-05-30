import { useState } from 'react'
import { useStore } from '../store/useStore'
import { compressToEncodedURIComponent } from 'lz-string'

export default function ShareModal({ onClose }) {
  const { layers, groups, viewerData, quality, bloomStrength, bloomRadius, bloomThreshold, emissiveIntensity, exposure, bgColor } = useStore()
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)

  const generate = () => {
    const data = {
      layers, groups, viewer: viewerData,
      graphics: { quality, bloomStrength, bloomRadius, bloomThreshold, emissiveIntensity, exposure, bgColor }
    }
    const compressed = compressToEncodedURIComponent(JSON.stringify(data))
    const url = `${window.location.origin}${window.location.pathname}?view=${compressed}`

    if (url.length > 8000) {
      // Too large for URL — warn user
      setLink('MODEL_TOO_LARGE')
    } else {
      setLink(url)
    }
  }

  const copy = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="absolute inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-96 bg-[#252525] border border-[#3d3d3d] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#3d3d3d]">
          <span className="text-white text-sm font-medium">Share Model</span>
          <button onClick={onClose} className="text-[#666] hover:text-white transition">✕</button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-[#999] text-xs leading-relaxed">
            Generate a shareable link. Anyone with the link will see your model in Viewer mode.
          </p>

          {!link && (
            <button onClick={generate}
              className="w-full py-2.5 rounded-lg bg-[#4c8bf5]/20 border border-[#4c8bf5]/40 text-[#8ab4f8] text-sm font-medium hover:bg-[#4c8bf5]/30 transition">
              Generate Link
            </button>
          )}

          {link && link !== 'MODEL_TOO_LARGE' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={link}
                  readOnly
                  className="flex-1 px-3 py-2 bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg text-white text-[10px] font-mono outline-none truncate"
                />
                <button onClick={copy}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition ${
                    copied ? 'bg-[#2ea043]/20 border border-[#2ea043]/40 text-[#7ee787]' : 'bg-[#4c8bf5]/20 border border-[#4c8bf5]/40 text-[#8ab4f8] hover:bg-[#4c8bf5]/30'
                  }`}>
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-[9px] text-[#555]">
                Link size: {(link.length / 1024).toFixed(1)} KB
              </p>
            </div>
          )}

          {link === 'MODEL_TOO_LARGE' && (
            <div className="p-3 bg-[#3a2020] border border-[#5a3030] rounded-lg">
              <p className="text-[#e88] text-xs">Model too large for URL sharing. Export as .atomo file instead and share the file directly.</p>
            </div>
          )}

          <div className="pt-2 border-t border-[#333]">
            <p className="text-[9px] text-[#555]">
              Tip: Configure the Viewer info (symbol, name, config) before sharing for a better presentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
