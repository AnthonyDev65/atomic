# ⚛️ Atomo Editor

A professional 3D atomic model editor built with React and Three.js. Create interactive visualizations of atoms, electron orbitals, and molecular structures in real-time.

![Atomo Editor](https://img.shields.io/badge/React-19-blue?logo=react) ![Three.js](https://img.shields.io/badge/Three.js-0.184-black?logo=threedotjs) ![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss) ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)

## Features

**3D Objects**
- Primitives: Sphere, Box, Torus, Cylinder, Cone, Icosahedron, Plane
- Orbital shapes: S (circular), P (dumbbell), D (clover), F (multi-lobe)
- Particle clouds with shimmer animation

**Atomic Modeling**
- Protons, neutrons, electrons with labels
- Animated orbiting electrons that follow orbital paths
- Orbital generator with configurable shells
- Nucleus generator with random compact distribution

**Editor**
- Transform gizmos (move, rotate, scale) with grid snap
- Multi-selection (Shift+Click)
- Groups with drag & drop
- Properties panel with draggable inputs (Figma-style)
- Layers panel with visibility toggle
- Undo-friendly architecture

**Scripting**
- Built-in code editor with syntax highlighting
- Functions: `esfera`, `torus`, `orbital`, `nucleo`, `atomo`, `capas`, `repetir`
- Full JavaScript support with math helpers
- Example scripts included

**Graphics**
- UnrealBloomPass (same as Three.js native)
- Configurable bloom, emissive, exposure
- Quality presets (Low / Medium / High)
- Custom background color
- Grid with configurable snap

**Viewer Mode**
- Clean presentation mode (no UI)
- HUD with element info and electron configuration
- Superscript notation support (1s² 2s² 2p⁶)

**File Management**
- Export/Import `.atomo` projects
- Backward compatible with legacy format
- Auto-save groups and orbital data

## Tech Stack

| Technology | Purpose |
|---|---|
| React 19 | UI framework |
| Three.js + R3F | 3D rendering |
| @react-three/drei | Helpers (OrbitControls, TransformControls, Gizmo) |
| Zustand | State management |
| Tailwind CSS 4 | Styling |
| Vite 8 | Build tool |

## Getting Started

```bash
cd atomo-react
npm install
npm run dev
```

Open `http://localhost:5173`

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `G` | Move mode |
| `R` | Rotate mode |
| `S` | Scale mode |
| `D` | Deselect |
| `Delete` | Delete selected |
| `Ctrl+D` | Duplicate |
| `Shift+Click` | Multi-select |
| `F2` | Script editor |
| `Ctrl+Enter` | Run script |
| `Ctrl` (hold) | Disable grid snap |

## Script Examples

```javascript
// Neon atom (Z=10)
limpiar()
nucleo(10, 10, 0.35, 0.11)
orbital(2, 0.8, 3, '#ff4444', '#66ffff', '#66ffff')
orbital(8, 1.6, 2, '#ff4444', '#aa88ff', '#aa88ff')
```

```javascript
// Mercury (Z=80) - full Bohr model
limpiar()
nucleo(80, 121, 0.5, 0.07)
orbital(2, 1.0, 3.5, '#ff4444', '#ffffff', '#ccccff')
orbital(8, 2.2, 3.0, '#ff4444', '#88ddff', '#4499ee')
orbital(18, 3.2, 2.2, '#ff4444', '#ffcc44', '#cc8800')
orbital(32, 4.4, 1.5, '#ff4444', '#ff88cc', '#cc2288')
orbital(18, 5.6, 1.0, '#ff4444', '#66ff99', '#22aa55')
orbital(2, 6.8, 0.6, '#ff4444', '#ff6633', '#ff3300')
```

## Deployment

Configured for Docker (Dokploy/any container platform):

```bash
docker build -t atomo-editor .
docker run -p 80:80 atomo-editor
```

## Documentation

Visit `/docs` in the app for the full scripting API reference.

## License

MIT
