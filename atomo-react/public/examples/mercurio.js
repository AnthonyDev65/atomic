// ═══════════════════════════════════════════════════
// Modelo de Bohr — Mercurio (Hg, Z=80)
// Núcleo : 80 protones + 121 neutrones (Hg-201)
// Capas  : K=2  L=8  M=18  N=32  O=18  P=2
// ═══════════════════════════════════════════════════

limpiar()

// — Protones (rojo)
repetir(80, (i) => esfera(
  Math.cos(i * Math.PI * 2 / 80) * (0.15 + (i % 3) * 0.12),
  Math.sin(i * Math.PI * 2 / 80) * (0.15 + (i % 3) * 0.12),
  ((i % 5) - 2) * 0.12,
  '#ff2222', 0.18, 'P'
))

// — Neutrones (azul)
repetir(121, (i) => esfera(
  Math.cos(i * Math.PI * 2 / 121 + 0.4) * (0.15 + (i % 4) * 0.1),
  Math.sin(i * Math.PI * 2 / 121 + 0.4) * (0.15 + (i % 4) * 0.1),
  ((i % 5) - 2) * 0.12,
  '#0044ff', 0.18, 'N'
))

// — Capa K: 2e  (radio 1.4)
orbital(2, 1.4, 4.0, '#ff4444', '#ffffff', '#aaaadd')

// — Capa L: 8e  (radio 2.2)
orbital(8, 2.2, 3.0, '#ff4444', '#88ddff', '#4499ee')

// — Capa M: 18e (radio 3.2)
orbital(18, 3.2, 2.2, '#ff4444', '#ffcc44', '#cc8800')

// — Capa N: 32e (radio 4.4)
orbital(32, 4.4, 1.5, '#ff4444', '#ff88cc', '#cc2288')

// — Capa O: 18e (radio 5.6)
orbital(18, 5.6, 1.0, '#ff4444', '#66ff99', '#22aa55')

// — Capa P: 2e  (radio 6.8) — capa de valencia
orbital(2, 6.8, 0.6, '#ff4444', '#ff6633', '#ff3300')
