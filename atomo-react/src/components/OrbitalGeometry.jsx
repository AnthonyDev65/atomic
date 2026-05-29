import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore } from '../store/useStore'

/**
 * Orbital geometries with two modes:
 * - Simple: thin tube path (electron trajectory)
 * - Full: solid lobe shapes (probability density volumes)
 */

// P orbital: figure-8 path (simple) or two lobes on Z axis (full)
export function PorbitalGeometry({ radius = 1, tubeRadius = 0.02 }) {
  const orbitalMode = useStore(s => s.orbitalMode)

  const geometry = useMemo(() => {
    if (orbitalMode === 'full') {
      // Two lobes: top lobe (larger) + bottom lobe (smaller) along Y axis
      // Using parametric surface: r(θ,φ) = |cos(θ)| shaped
      return createLobeGeometry(radius, 2, 'p')
    } else {
      // Thin tube path: figure-8
      const points = []
      for (let i = 0; i <= 100; i++) {
        const t = (i / 100) * Math.PI * 2
        const r = radius * Math.sin(t)
        points.push(new THREE.Vector3(
          r * Math.cos(t) * 0.5,
          radius * Math.sin(t) * Math.cos(t) * 1.1,
          r * Math.sin(t) * 0.5
        ))
      }
      const curve = new THREE.CatmullRomCurve3(points, true)
      return new THREE.TubeGeometry(curve, 100, tubeRadius, 8, true)
    }
  }, [radius, tubeRadius, orbitalMode])

  return <primitive object={geometry} attach="geometry" />
}

// D orbital: 4-leaf clover path (simple) or 4 lobes in XY plane (full)
export function DorbitalGeometry({ radius = 1, tubeRadius = 0.02 }) {
  const orbitalMode = useStore(s => s.orbitalMode)

  const geometry = useMemo(() => {
    if (orbitalMode === 'full') {
      return createLobeGeometry(radius, 4, 'd')
    } else {
      const points = []
      for (let i = 0; i <= 200; i++) {
        const t = (i / 200) * Math.PI * 2
        const r = radius * (Math.abs(Math.cos(2 * t)) * 0.85 + 0.15)
        points.push(new THREE.Vector3(
          r * Math.cos(t),
          r * Math.sin(t) * Math.cos(t) * 0.3,
          r * Math.sin(t)
        ))
      }
      const curve = new THREE.CatmullRomCurve3(points, true)
      return new THREE.TubeGeometry(curve, 200, tubeRadius, 8, true)
    }
  }, [radius, tubeRadius, orbitalMode])

  return <primitive object={geometry} attach="geometry" />
}

// F orbital: 6-petal path (simple) or 6 lobes (full)
export function ForbitalGeometry({ radius = 1, tubeRadius = 0.02 }) {
  const orbitalMode = useStore(s => s.orbitalMode)

  const geometry = useMemo(() => {
    if (orbitalMode === 'full') {
      return createLobeGeometry(radius, 6, 'f')
    } else {
      const points = []
      for (let i = 0; i <= 300; i++) {
        const t = (i / 300) * Math.PI * 2
        const r = radius * (Math.abs(Math.cos(3 * t)) * 0.8 + 0.2)
        points.push(new THREE.Vector3(
          r * Math.cos(t),
          r * Math.sin(2 * t) * 0.25,
          r * Math.sin(t)
        ))
      }
      const curve = new THREE.CatmullRomCurve3(points, true)
      return new THREE.TubeGeometry(curve, 300, tubeRadius, 8, true)
    }
  }, [radius, tubeRadius, orbitalMode])

  return <primitive object={geometry} attach="geometry" />
}

/**
 * Creates solid lobe geometry for orbital shapes.
 * Uses spherical harmonics-inspired parametric surfaces.
 */
function createLobeGeometry(radius, lobes, type) {
  const segments = 40
  const vertices = []
  const indices = []

  for (let i = 0; i <= segments; i++) {
    for (let j = 0; j <= segments; j++) {
      const theta = (i / segments) * Math.PI
      const phi = (j / segments) * Math.PI * 2
      let r

      if (type === 'p') {
        // P: two lobes along Y — r = |cos(θ)|^0.8
        r = radius * Math.pow(Math.abs(Math.cos(theta)), 0.8) * 0.9
        const x = r * Math.sin(theta) * Math.cos(phi) * 0.55
        const y = radius * Math.cos(theta) * Math.pow(Math.abs(Math.cos(theta)), 0.3)
        const z = r * Math.sin(theta) * Math.sin(phi) * 0.55
        vertices.push(x, y, z)
      } else if (type === 'd') {
        // D: four lobes in XZ plane — r = |sin(2θ)·cos(2φ)|
        r = radius * Math.pow(Math.abs(Math.sin(2 * theta) * Math.cos(2 * phi)), 0.6) * 0.85
        r = Math.max(r, radius * 0.03)
        const x = r * Math.sin(theta) * Math.cos(phi)
        const y = r * Math.cos(theta) * 0.4
        const z = r * Math.sin(theta) * Math.sin(phi)
        vertices.push(x, y, z)
      } else {
        // F: six lobes — r = |sin(θ)²·cos(3φ)| + |cos(θ)·sin(2θ)|
        const val = Math.abs(Math.sin(theta) * Math.sin(theta) * Math.cos(3 * phi)) * 0.6 +
                    Math.abs(Math.cos(theta) * Math.sin(2 * theta)) * 0.4
        r = radius * Math.pow(val, 0.5) * 0.85
        r = Math.max(r, radius * 0.03)
        const x = r * Math.sin(theta) * Math.cos(phi)
        const y = r * Math.cos(theta)
        const z = r * Math.sin(theta) * Math.sin(phi)
        vertices.push(x, y, z)
      }
    }
  }

  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const a = i * (segments + 1) + j
      const b = a + 1
      const c = a + (segments + 1)
      const d = c + 1
      indices.push(a, b, c)
      indices.push(b, d, c)
    }
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

/**
 * Point cloud geometries for orbital shapes.
 * Dense point distributions on the orbital surface.
 */
function createOrbitalPointCloud(type, radius, count = 2000) {
  const positions = []

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    let r

    if (type === 'torus') {
      // Points on torus surface
      const torusAngle = Math.random() * Math.PI * 2
      const tubeAngle = Math.random() * Math.PI * 2
      const tubeR = radius * 0.08
      const x = (radius + tubeR * Math.cos(tubeAngle)) * Math.cos(torusAngle)
      const y = tubeR * Math.sin(tubeAngle)
      const z = (radius + tubeR * Math.cos(tubeAngle)) * Math.sin(torusAngle)
      positions.push(x, y, z)
      continue
    } else if (type === 'orbital_p') {
      // P: two lobes along Y
      r = radius * Math.pow(Math.abs(Math.cos(phi)), 0.6) * 0.9
      const x = r * Math.sin(phi) * Math.cos(theta) * 0.55
      const y = radius * Math.cos(phi) * Math.pow(Math.abs(Math.cos(phi)), 0.3)
      const z = r * Math.sin(phi) * Math.sin(theta) * 0.55
      positions.push(x, y, z)
      continue
    } else if (type === 'orbital_d') {
      // D: four lobes in XZ plane
      r = radius * Math.pow(Math.abs(Math.sin(2 * phi) * Math.cos(2 * theta)), 0.5) * 0.85
      r = Math.max(r, radius * 0.02)
      positions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi) * 0.4, r * Math.sin(phi) * Math.sin(theta))
      continue
    } else if (type === 'orbital_f') {
      // F: six lobes
      const val = Math.abs(Math.sin(phi) * Math.sin(phi) * Math.cos(3 * theta)) * 0.6 +
                  Math.abs(Math.cos(phi) * Math.sin(2 * phi)) * 0.4
      r = radius * Math.pow(val, 0.4) * 0.85
      r = Math.max(r, radius * 0.02)
      positions.push(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta))
      continue
    }
    positions.push(0, 0, 0)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geo
}

export { createOrbitalPointCloud }

export function getOrbitalPoint(type, t, radius) {
  const angle = t * Math.PI * 2
  switch (type) {
    case 'orbital_p': {
      const r = radius * Math.sin(angle)
      return {
        x: r * Math.cos(angle) * 0.5,
        y: radius * Math.sin(angle) * Math.cos(angle) * 1.1,
        z: r * Math.sin(angle) * 0.5
      }
    }
    case 'orbital_d': {
      const r = radius * (Math.abs(Math.cos(2 * angle)) * 0.85 + 0.15)
      return {
        x: r * Math.cos(angle),
        y: r * Math.sin(angle) * Math.cos(angle) * 0.3,
        z: r * Math.sin(angle)
      }
    }
    case 'orbital_f': {
      const r = radius * (Math.abs(Math.cos(3 * angle)) * 0.8 + 0.2)
      return {
        x: r * Math.cos(angle),
        y: r * Math.sin(2 * angle) * 0.25,
        z: r * Math.sin(angle)
      }
    }
    default: {
      return {
        x: radius * Math.cos(angle),
        y: 0,
        z: radius * Math.sin(angle)
      }
    }
  }
}
