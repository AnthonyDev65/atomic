// Shared group-geometry helpers. Kept in a plain module (not a component file)
// so the gizmo, the render transform and the UI all compute the SAME pivot.

// Flatten a group's whole subtree (its own layers + every nested subgroup's).
export function descendantLayerIds(groups, groupId) {
  const out = []
  const walk = (gid) => {
    const g = groups.find(x => x.id === gid)
    if (!g) return
    ;(g.children || []).forEach(id => out.push(id))
    groups.forEach(x => { if (x.parentId === gid) walk(x.id) })
  }
  walk(groupId)
  return out
}

// Effective axis-aligned bounds of a set of layers.
//
// Orbital electrons store a PLACEHOLDER position ([radius, 0, 0]) and get their
// real position computed per-frame as they orbit. Averaging the raw positions
// would drag the center toward +X (every electron sits at [radius,0,0] until it
// moves). So each layer contributes its TRUE extent instead:
//   - orbital electron -> a sphere of `radius` around its orbit center
//   - torus ring       -> a disc of `torusRadius` around its position
//   - everything else  -> its position (± its sphere radius)
//
// Returns { min, max, center, size } in the group's local (base) space.
export function computeGroupBounds(descLayers, layerById) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  let any = false
  const expand = (c, r) => {
    for (let i = 0; i < 3; i++) {
      if (c[i] - r < min[i]) min[i] = c[i] - r
      if (c[i] + r > max[i]) max[i] = c[i] + r
    }
    any = true
  }
  descLayers.forEach(l => {
    if (!l) return
    if (l.orbital) {
      const parent = l.orbital.parentId ? layerById.get(l.orbital.parentId) : null
      const center = parent?.position || [0, 0, 0]
      const r = parent ? (parent.torusRadius || 0.5) - (parent.pathOffset || 0) : (l.orbital.radius || 0.5)
      expand(center, Math.abs(r))
    } else if (l.type === 'torus') {
      expand(l.position || [0, 0, 0], Math.abs(l.torusRadius || 0.5))
    } else {
      expand(l.position || [0, 0, 0], Math.abs(l.sphereRadius || 0))
    }
  })
  if (!any) return { min: [0, 0, 0], max: [0, 0, 0], center: [0, 0, 0], size: [0, 0, 0] }
  const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2]
  const size = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  return { min, max, center, size }
}
