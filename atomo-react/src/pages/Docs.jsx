export default function Docs() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#ccc] font-['Segoe_UI',system-ui,sans-serif]">
      {/* Header */}
      <header className="border-b border-[#2d2d2d] sticky top-0 bg-[#1a1a1a]/95 backdrop-blur-sm z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-white text-lg font-semibold tracking-tight">Atomo Script Docs</h1>
          <a href="/" className="text-[10px] px-3 py-1.5 rounded bg-[#2a2a2a] border border-[#3d3d3d] text-[#888] hover:text-white transition">
            Back to Editor
          </a>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Intro */}
        <section className="mb-12">
          <h2 className="text-white text-2xl font-light mb-4">Scripting Language</h2>
          <p className="text-[#999] text-sm leading-relaxed mb-4">
            Atomo includes a built-in scripting console for rapid creation of atomic models and 3D scenes.
            Open it with <Kbd>F2</Kbd> or the Script button in the toolbar. Execute with <Kbd>Ctrl+Enter</Kbd>.
          </p>
          <p className="text-[#999] text-sm leading-relaxed">
            The language is JavaScript with pre-defined functions for creating objects. All standard JS features work
            (variables, loops, math, arrow functions, etc).
          </p>
        </section>

        {/* Primitives */}
        <Section title="Primitives">
          <FnDoc
            name="esfera"
            params="x, y, z, color, size, label"
            defaults="0, 0, 0, '#ff4444', 0.5, ''"
            desc="Creates a sphere at the given position."
            example={`esfera(0, 0, 0, '#ff0000', 0.3, 'P')`}
          />
          <FnDoc
            name="cubo"
            params="x, y, z, color, size"
            defaults="0, 0, 0, '#ffffff', 1"
            desc="Creates a box/cube."
            example={`cubo(2, 0, 0, '#44ff44', 0.5)`}
          />
          <FnDoc
            name="torus"
            params="x, y, z, color, radio, grosor, rx°, ry°, rz°"
            defaults="0, 0, 0, '#4466ff', 1, 0.05, 0, 0, 0"
            desc="Creates a torus (ring). Rotation in degrees."
            example={`torus(0, 0, 0, '#6688ff', 1.5, 0.01, 90, 0, 45)`}
          />
          <FnDoc
            name="cilindro"
            params="x, y, z, color, size"
            defaults="0, 0, 0, '#ffffff', 1"
            desc="Creates a cylinder."
            example={`cilindro(0, 1, 0, '#888888', 0.5)`}
          />
          <FnDoc
            name="cono"
            params="x, y, z, color, size"
            defaults="0, 0, 0, '#ffffff', 1"
            desc="Creates a cone."
            example={`cono(0, 0, 0, '#ffaa00', 0.8)`}
          />
          <FnDoc
            name="plano"
            params="x, y, z, color, size"
            defaults="0, 0, 0, '#ffffff', 1"
            desc="Creates a flat plane."
            example={`plano(0, -1, 0, '#333333', 5)`}
          />
          <FnDoc
            name="icosaedro"
            params="x, y, z, color, size"
            defaults="0, 0, 0, '#ffffff', 0.5"
            desc="Creates an icosahedron."
            example={`icosaedro(0, 0, 0, '#ff88ff', 0.4)`}
          />
        </Section>

        {/* Atomic */}
        <Section title="Atomic Shortcuts">
          <FnDoc
            name="proton"
            params="x, y, z, size"
            defaults="0, 0, 0, 0.12"
            desc="Creates a red sphere labeled 'P'."
            example={`proton(0.1, 0, 0.1)`}
          />
          <FnDoc
            name="neutron"
            params="x, y, z, size"
            defaults="0, 0, 0, 0.12"
            desc="Creates a blue sphere labeled 'N'."
            example={`neutron(-0.1, 0.1, 0)`}
          />
          <FnDoc
            name="electron"
            params="x, y, z, size"
            defaults="0, 0, 0, 0.06"
            desc="Creates a cyan sphere labeled 'e'."
            example={`electron(1.5, 0, 0, 0.08)`}
          />
          <FnDoc
            name="orbital"
            params="radio, grosor, rx°, ry°, rz°, color"
            defaults="1.5, 0.01, 90, 0, 0, '#6688ff'"
            desc="Creates a thin torus representing an electron orbital path."
            example={`orbital(2, 0.008, 90, 0, 30, '#aa88ff')`}
          />
        </Section>

        {/* Generators */}
        <Section title="Generators">
          <FnDoc
            name="nucleo"
            params="protones, neutrones, radio, size"
            defaults="6, 6, 0.35, 0.12"
            desc="Generates a compact nucleus with randomly positioned protons and neutrons."
            example={`nucleo(10, 10, 0.4, 0.11)  // Neon nucleus`}
          />
          <FnDoc
            name="capas"
            params="config[], radio, grosor, color"
            defaults="[], 1, 0.01, '#6688ff'"
            desc="Creates orbital shells from an electron configuration array. Each number creates orbital rings at increasing radii."
            example={`capas([2, 8], 0.8, 0.008, '#66ffff')  // 2 shells`}
          />
          <FnDoc
            name="atomo"
            params="protones, neutrones, capas[], opts"
            defaults="—"
            desc="Creates a complete atom: nucleus + orbital shells. Options: radioNucleo, sizeNucleon, radioBase, grosorOrbita, colorOrbita."
            example={`atomo(6, 6, [2, 4], {\n  radioNucleo: 0.3,\n  colorOrbita: '#88aaff'\n})  // Carbon`}
          />
        </Section>

        {/* Utilities */}
        <Section title="Utilities">
          <FnDoc
            name="repetir"
            params="n, fn"
            desc="Repeats a function n times. The callback receives the index."
            example={`repetir(10, (i) => {\n  proton(\n    aleatorio(-0.3, 0.3),\n    aleatorio(-0.3, 0.3),\n    aleatorio(-0.3, 0.3)\n  )\n})`}
          />
          <FnDoc
            name="limpiar"
            params=""
            desc="Clears the entire scene."
            example={`limpiar()`}
          />
          <FnDoc
            name="aleatorio"
            params="min, max"
            defaults="0, 1"
            desc="Returns a random number between min and max."
            example={`const x = aleatorio(-2, 2)`}
          />
          <FnDoc
            name="color"
            params="r, g, b"
            desc="Creates a hex color string from RGB values (0-1 range)."
            example={`const c = color(1, 0.5, 0)  // '#ff8000'`}
          />
          <FnDoc
            name="log"
            params="message"
            desc="Prints a message to the output panel."
            example={`log('Created ' + 10 + ' objects')`}
          />
        </Section>

        {/* Math */}
        <Section title="Math Constants & Functions">
          <div className="bg-[#1e1e1e] rounded-lg p-4 border border-[#2d2d2d]">
            <p className="text-[#999] text-xs mb-3">Available directly (no Math. prefix needed):</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <code className="text-[#79c0ff]">PI</code>
              <code className="text-[#79c0ff]">sin(x)</code>
              <code className="text-[#79c0ff]">cos(x)</code>
              <code className="text-[#79c0ff]">sqrt(x)</code>
              <code className="text-[#79c0ff]">abs(x)</code>
              <code className="text-[#79c0ff]">random()</code>
            </div>
          </div>
        </Section>

        {/* Examples */}
        <Section title="Full Examples">
          <Example
            title="Neon Atom (Z=10)"
            code={`limpiar()

// Nucleus: 10P + 10N
nucleo(10, 10, 0.35, 0.11)

// Shell 1: 2 electrons
orbital(0.8, 0.008, 90, 0, 0, '#66ffff')
orbital(0.8, 0.008, 90, 0, 90, '#66ffff')

// Shell 2: 8 electrons
orbital(1.6, 0.01, 90, 0, 0, '#aa88ff')
orbital(1.6, 0.01, 90, 0, 60, '#aa88ff')
orbital(1.6, 0.01, 90, 0, 120, '#aa88ff')
orbital(1.6, 0.01, 45, 0, 30, '#aa88ff')`}
          />
          <Example
            title="Carbon Atom (Z=6)"
            code={`limpiar()
atomo(6, 6, [2, 4], {
  radioNucleo: 0.3,
  sizeNucleon: 0.1,
  radioBase: 0.7,
  colorOrbita: '#88ccff'
})`}
          />
          <Example
            title="Random Particle Cloud"
            code={`limpiar()
repetir(200, () => {
  const r = aleatorio(0, 3)
  const theta = aleatorio(0, PI * 2)
  const phi = aleatorio(0, PI)
  esfera(
    r * sin(phi) * cos(theta),
    r * sin(phi) * sin(theta),
    r * cos(phi),
    color(aleatorio(0.5, 1), aleatorio(0.2, 0.6), aleatorio(0.5, 1)),
    0.03
  )
})`}
          />
        </Section>

        {/* Keyboard shortcuts */}
        <Section title="Keyboard Shortcuts">
          <div className="bg-[#1e1e1e] rounded-lg p-4 border border-[#2d2d2d] space-y-2 text-xs">
            <ShortcutRow keys="F2" desc="Open/close script editor" />
            <ShortcutRow keys="Ctrl+Enter" desc="Run script" />
            <ShortcutRow keys="Escape" desc="Close editor / Deselect" />
            <ShortcutRow keys="Tab" desc="Indent code" />
            <ShortcutRow keys="G" desc="Move mode" />
            <ShortcutRow keys="R" desc="Rotate mode" />
            <ShortcutRow keys="S" desc="Scale mode" />
            <ShortcutRow keys="D" desc="Deselect" />
            <ShortcutRow keys="Delete" desc="Delete selected" />
            <ShortcutRow keys="Ctrl (hold)" desc="Disable grid snap" />
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h3 className="text-white text-lg font-medium mb-4 pb-2 border-b border-[#2d2d2d]">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function FnDoc({ name, params, defaults, desc, example }) {
  return (
    <div className="bg-[#1e1e1e] rounded-lg p-4 border border-[#2d2d2d]">
      <div className="flex items-baseline gap-1 mb-1">
        <code className="text-[#d2a8ff] font-semibold text-sm">{name}</code>
        <code className="text-[#8b949e] text-xs">({params})</code>
      </div>
      {defaults && <p className="text-[10px] text-[#555] mb-2 font-mono">Defaults: {defaults}</p>}
      <p className="text-[#999] text-xs mb-3">{desc}</p>
      {example && (
        <pre className="bg-[#161616] rounded p-2.5 text-[11px] font-mono text-[#a8e6a0] overflow-x-auto">
          {example}
        </pre>
      )}
    </div>
  )
}

function Example({ title, code }) {
  return (
    <div className="bg-[#1e1e1e] rounded-lg border border-[#2d2d2d] overflow-hidden">
      <div className="px-4 py-2 border-b border-[#2d2d2d]">
        <span className="text-white text-xs font-medium">{title}</span>
      </div>
      <pre className="p-4 text-[11px] font-mono text-[#a8e6a0] overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  )
}

function Kbd({ children }) {
  return (
    <kbd className="px-1.5 py-0.5 rounded bg-[#2a2a2a] border border-[#3d3d3d] text-[#ddd] text-[10px] font-mono">
      {children}
    </kbd>
  )
}

function ShortcutRow({ keys, desc }) {
  return (
    <div className="flex items-center justify-between">
      <kbd className="px-2 py-0.5 rounded bg-[#2a2a2a] border border-[#3d3d3d] text-[#ddd] text-[10px] font-mono">{keys}</kbd>
      <span className="text-[#888]">{desc}</span>
    </div>
  )
}
