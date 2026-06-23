// Keyframe animation helpers — shared between the 3D driver and the timeline UI.

// R3F's invalidate(), set by TimelineDriver so the timeline panel (outside the
// Canvas) can force a redraw while scrubbing on `frameloop='demand'` devices.
export const invalidateRef = { current: null }

// Recenters/resets the camera to the default framing. Set inside the Canvas
// (TimelineDriver) so the Toolbar, which lives outside it, can trigger it.
export const centerCameraRef = { current: null }

// Toggles a click-mode shared electron's transfer: flips which orbital it sits
// on and kicks off the eased transition (read each frame by the 3D driver).
// Mutates the share object in place (same reference the store holds).
export function toggleShareTransfer(sh) {
  if (!sh) return
  sh.clickTarget = (sh.clickTarget || 0) >= 1 ? 0 : 1
  sh.transStart = sh.clickW || 0
  sh.transP = 0
  sh.transitioning = true
}

// Properties that can be keyframed.
export const ANIM_PROPS = ['position', 'rotation', 'scale', 'opacity']

const lerp = (a, b, f) => a + (b - a) * f
const smoothstep = (f) => f * f * (3 - 2 * f) // ease in-out

function lerpValue(a, b, f) {
  if (Array.isArray(a)) return a.map((x, i) => lerp(x, b[i] ?? x, f))
  return lerp(a, b, f)
}

// Sample a sorted keyframe track [{ t, v }] at time `t`. Returns the value
// (clamped at the ends) or undefined if the track is empty.
export function sampleProp(kfs, t) {
  if (!kfs || kfs.length === 0) return undefined
  if (kfs.length === 1) return kfs[0].v
  if (t <= kfs[0].t) return kfs[0].v
  const last = kfs[kfs.length - 1]
  if (t >= last.t) return last.v
  for (let i = 0; i < kfs.length - 1; i++) {
    const a = kfs[i]
    const b = kfs[i + 1]
    if (t >= a.t && t <= b.t) {
      const span = b.t - a.t
      const f = span > 0 ? (t - a.t) / span : 0
      return lerpValue(a.v, b.v, smoothstep(f))
    }
  }
  return last.v
}

// True if any layer in the list has at least one keyframe.
export function hasAnyKeyframes(layers) {
  return layers.some(l => l.keyframes && ANIM_PROPS.some(p => l.keyframes[p]?.length))
}
