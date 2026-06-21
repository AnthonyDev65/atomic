import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

// Dedicated layer for rendering gizmos on top, unaffected by post-processing.
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

  // Override render. Gizmos (TransformControls) must NOT receive bloom, so we
  // hide them during the post-processed pass, then draw them crisp on top in a
  // dedicated overlay layer.
  useFrame(() => {
    const composer = composerRef.current
    if (!composer) return

    // Collect gizmo helper roots (type set by three.js, survives minification)
    const gizmos = []
    scene.traverse(o => { if (o.type === 'TransformControlsGizmo') gizmos.push(o) })

    // 1) Post-processed scene without gizmos. Reset camera layers FIRST so the
    //    composer always sees the scene (defends against a stuck overlay layer).
    camera.layers.set(0)
    gizmos.forEach(g => { g.visible = false })
    composer.render()
    if (!gizmos.length) return

    // 2) Crisp overlay of just the gizmos, bypassing bloom.
    //    scene.background must be cleared first: a Color background triggers a
    //    forced screen clear inside gl.render() even with autoClear off, which
    //    would erase the post-processed scene and leave only the gizmo.
    gizmos.forEach(g => { g.visible = true; g.traverse(c => c.layers.enable(GIZMO_LAYER)) })
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
