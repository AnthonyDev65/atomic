import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

// Dedicated layer for rendering overlay content (gizmos, axes) on top,
// unaffected by post-processing. Must match OVERLAY_LAYER in SceneContent.jsx.
const GIZMO_LAYER = 2

export default function BloomEffect() {
  const { gl, scene, camera, size } = useThree()
  const composerRef = useRef()
  const bloomRef = useRef()

  const bloomStrength = useStore(s => s.bloomStrength)
  const bloomRadius = useStore(s => s.bloomRadius)
  const bloomThreshold = useStore(s => s.bloomThreshold)
  const exposure = useStore(s => s.exposure)

  useEffect(() => {
    const composer = new EffectComposer(gl)
    composer.addPass(new RenderPass(scene, camera))
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      bloomStrength,
      bloomRadius,
      bloomThreshold
    )
    composer.addPass(bloom)
    composerRef.current = composer
    bloomRef.current = bloom
    return () => composer.dispose()
  }, [gl, scene, camera])

  // Update bloom params
  useEffect(() => {
    if (bloomRef.current) {
      bloomRef.current.strength = bloomStrength
      bloomRef.current.radius = bloomRadius
      bloomRef.current.threshold = bloomThreshold
    }
    gl.toneMappingExposure = exposure
  }, [bloomStrength, bloomRadius, bloomThreshold, exposure, gl])

  // Update size
  useEffect(() => {
    if (composerRef.current) composerRef.current.setSize(size.width, size.height)
  }, [size])

  // Override render. Overlay content — TransformControls gizmos and axes
  // (tagged userData.noBloom) — must NOT receive bloom, so we hide it during
  // the post-processed pass, then draw it crisp on top in a dedicated layer.
  useFrame(() => {
    const composer = composerRef.current
    if (!composer) return

    // Collect overlay roots: gizmos (type set by three.js, survives
    // minification) plus anything explicitly tagged to skip post-processing.
    const overlay = []
    scene.traverse(o => { if (o.type === 'TransformControlsGizmo' || o.userData?.noBloom) overlay.push(o) })

    // 1) Post-processed scene without overlay content. Reset camera layers
    //    FIRST so the composer always sees the scene (defends against a stuck
    //    overlay layer).
    camera.layers.set(0)
    overlay.forEach(o => { o.visible = false })
    composer.render()
    overlay.forEach(o => { o.visible = true })
    if (!overlay.length) return

    // 2) Crisp overlay pass, bypassing bloom and drawn on top (depth cleared).
    //    scene.background must be cleared first: a Color background triggers a
    //    forced screen clear inside gl.render() even with autoClear off, which
    //    would erase the post-processed scene and leave only the overlay.
    overlay.forEach(o => o.traverse(c => c.layers.enable(GIZMO_LAYER)))
    const prevAutoClear = gl.autoClear
    const prevBg = scene.background
    try {
      gl.autoClear = false
      scene.background = null
      gl.clearDepth()
      camera.layers.set(GIZMO_LAYER)
      gl.render(scene, camera)
    } finally {
      scene.background = prevBg
      camera.layers.set(0)
      gl.autoClear = prevAutoClear
    }
  }, 1)

  return null
}
