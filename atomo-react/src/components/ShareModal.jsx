import { useState } from 'react'
import { useStore } from '../store/useStore'
import { compressToEncodedURIComponent } from 'lz-string'

const GIST_API = 'https://api.github.com/gists'

export default function ShareModal({ onClose }) {
  const { layers, groups, viewerData, quality, bloomStrength, bloomRadius, bloomThreshold, emissiveIntensity, exposure, bgColor } = useStore()
  const [link, setLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [method, setMethod] = useState('url')

  const data = {
    layers, groups, viewer: viewerData,
    graphics: { quality, bloomStrength, bloomRadius, bloomThreshold, emissiveIntensity, exposure, bgColor }
  }

  const generateURL = () => {
    const compressed = compressToEncodedURIComponent(JSON.stringify(data))
    const url = `${window.location.origin}${window.location.pathname}#view=${compressed}`
    if (url.length > 15000) setLink('MODEL_TOO_LARGE')
    else setLink(url)
  }

  const generateCloud = async () => {
    setLoading(true)
    try {
      const res = await fetch(GIST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/vnd.github+json' },
        body: JSON.stringify({
          description: 'Atomo Editor - Shared Model',
          public: true,
          files: { 'model.json': { content: JSON.stringify(data) } }
        })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const gistId = json.id
      if (gistId) {
        const url = `${window.location.origin}${window.location.pathname}#gist=${gistId}`
        setLink(url)
      } else {
        setLink('CLOUD_ERROR')
      }
    } catch (e) {
      console.error('Cloud upload error:', e)
      setLink('CLOUD_ERROR')
    }
    setLoading(false)
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

        <div className="p-4 space-y-3">
          <p className="text-[#999] text-xs">Anyone with the link will see your model in Viewer mode.</p>

          {/* Method selector */}
          <div className="flex gap-2">
            <button onClick={() => { setMethod('url'); setLink('') }}
              className={`flex-1 py-1.5 rounded text-[10px] border transition ${method === 'url' ? 'bg-[#4c8bf5]/20 border-[#4c8bf5]/40 text-[#8ab4f8]' : 'bg-[#2a2a2a] border-[#3d3d3d] text-[#888]'}`}>
              URL (small models)
            </button>
            <button onClick={() => { setMethod('cloud'); setLink('') }}
              className={`flex-1 py-1.5 rounded text-[10px] border transition ${method === 'cloud' ? 'bg-[#2ea043]/20 border-[#2ea043]/40 text-[#7ee787]' : 'bg-[#2a2a2a] border-[#3d3d3d] text-[#888]'}`}>
              Cloud (any size)
            </button>
          </div>

          <p className="text-[9px] text-[#555]">
            {method === 'url' ? 'Encodes model in URL. May not work on mobile for large models.' : 'Stores model in cloud (JSONBin.io). Short link, works everywhere.'}
          </p>

          {!link && (
            <button onClick={method === 'url' ? generateURL : generateCloud} disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#4c8bf5]/20 border border-[#4c8bf5]/40 text-[#8ab4f8] text-sm font-medium hover:bg-[#4c8bf5]/30 transition disabled:opacity-50">
              {loading ? 'Uploading...' : 'Generate Link'}
            </button>
          )}

          {link && link !== 'MODEL_TOO_LARGE' && link !== 'CLOUD_ERROR' && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input type="text" value={link} readOnly
                  className="flex-1 px-3 py-2 bg-[#1e1e1e] border border-[#3d3d3d] rounded-lg text-white text-[10px] font-mono outline-none truncate" />
                <button onClick={copy}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition ${copied ? 'bg-[#2ea043]/20 border border-[#2ea043]/40 text-[#7ee787]' : 'bg-[#4c8bf5]/20 border border-[#4c8bf5]/40 text-[#8ab4f8] hover:bg-[#4c8bf5]/30'}`}>
                  {copied ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="text-[9px] text-[#555]">Link size: {(link.length / 1024).toFixed(1)} KB</p>
            </div>
          )}

          {link === 'MODEL_TOO_LARGE' && (
            <div className="p-3 bg-[#3a2020] border border-[#5a3030] rounded-lg">
              <p className="text-[#e88] text-xs">Model too large for URL. Use "Cloud" mode instead.</p>
              <button onClick={() => { setMethod('cloud'); setLink('') }} className="mt-2 text-[10px] text-[#8ab4f8] underline">Switch to Cloud</button>
            </div>
          )}

          {link === 'CLOUD_ERROR' && (
            <div className="p-3 bg-[#3a2020] border border-[#5a3030] rounded-lg">
              <p className="text-[#e88] text-xs">Cloud upload failed. Check your connection and try again.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
