import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

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

  // Override render
  useFrame(() => {
    if (composerRef.current) composerRef.current.render()
  }, 1)

  return null
}
