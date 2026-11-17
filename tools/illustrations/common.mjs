// Shared building blocks for the SVG illustrations (GROUP BY, JOIN).
//
// A scene is a list of elements. Each element has SVG markup and a state per phase (step):
// { o: opacity, x: dx, y: dy }. A static image renders one phase; the animation interpolates
// between phases with CSS keyframes and adds clickable step pills and a pause button.

export const RH = 26; // table row height
export const CW = 8.4; // monospace char width at 14px (forced via textLength)
export const PALETTE = [
  { c: '#2563eb', t: '#dbeafe' },
  { c: '#d97706', t: '#fef3c7' },
  { c: '#059669', t: '#d1fae5' },
  { c: '#7c3aed', t: '#ede9fe' },
  { c: '#db2777', t: '#fce7f3' },
  { c: '#0891b2', t: '#cffafe' },
  { c: '#65a30d', t: '#ecfccb' },
  { c: '#4f46e5', t: '#e0e7ff' },
];
export const GREY = { c: '#94a3b8', t: '#f1f5f9' };

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const KEYWORDS = /\b(SELECT|FROM|GROUP BY|HAVING|FULL OUTER JOIN|INNER JOIN|LEFT JOIN|RIGHT JOIN|ON|AS|COUNT|SUM|MAX|MIN|AVG)\b/g;

/** One line of SQL in monospace, keywords coloured, width forced to `line.length * CW`. */
export function sqlLine(line, x, y) {
  let out = '';
  let last = 0;
  for (const m of line.matchAll(KEYWORDS)) {
    out += esc(line.slice(last, m.index));
    out += `<tspan class="kw">${esc(m[0])}</tspan>`;
    last = m.index + m[0].length;
  }
  out += esc(line.slice(last));
  return `<text class="sql" x="${x}" y="${y}" textLength="${(line.length * CW).toFixed(1)}" lengthAdjust="spacingAndGlyphs" xml:space="preserve">${out}</text>`;
}

export const BASE_STYLE = `
  .bg{fill:#ffffff}
  text{font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif}
  .sql{font-family:Consolas,'Cascadia Mono',Menlo,'DejaVu Sans Mono',monospace;font-size:14px;fill:#e2e8f0}
  .kw{fill:#7dd3fc;font-weight:600}
  .qbox{fill:#0f172a}
  .qhl{fill:#facc15;fill-opacity:.28;stroke:#facc15;stroke-width:1.2}
  .pill{fill:#f1f5f9;stroke:#cbd5e1}
  .pillt{font-size:13px;fill:#64748b;font-weight:600}
  .pillon{fill:#0f172a}
  .pillont{font-size:13px;fill:#ffffff;font-weight:700}
  .arrowt{font-size:20px;fill:#94a3b8}
  .explain{font-size:15px;fill:#334155}
  .explainb{font-weight:700;fill:#0f172a}
  .th{fill:#1e293b}
  .tht{font-size:12.5px;font-weight:700;fill:#f8fafc}
  .tht.key{fill:#fde68a}
  .tht.agg{fill:#a7f3d0}
  .row{stroke:#ffffff;stroke-width:1}
  .td{font-size:13px;fill:#1e293b}
  .keyv,.aggv{font-weight:700}
  .glabel{font-size:11px;font-weight:700;fill:#ffffff}
  .note{font-size:11.5px;fill:#475569;font-style:italic}
  .note.ok{fill:#15803d;font-style:normal;font-weight:600}
  .note.bad{fill:#b91c1c;font-style:normal;font-weight:600}
  .okc{fill:#16a34a}.okm{fill:none;stroke:#fff;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
  .badc{fill:#dc2626}.badm{fill:none;stroke:#fff;stroke-width:2.4;stroke-linecap:round}
  .dim{fill:#ffffff;fill-opacity:.68}
  .strike{stroke:#dc2626;stroke-width:2}
  .resframe{fill:none;stroke:#0f172a;stroke-width:2}
  .restitle{font-size:13px;font-weight:700;fill:#0f172a}
`;

export function svgDoc(W, H, title, body, extraStyle = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${BASE_STYLE}${extraStyle}</style>
<rect class="bg" width="${W}" height="${H}" rx="10"/>
${body}
</svg>
`;
}

/**
 * `add(svg, states, opts)` registers an element. opts.snap switches instantly between phases instead of
 * easing (for text that would overlap while cross-fading); opts.delay (s) staggers its transitions.
 * Passing `true` as opts is shorthand for { snap: true }.
 */
export function sceneBuilder(phases) {
  const els = [];
  const add = (svg, states, opts = {}) => {
    const { snap = false, delay = 0 } = typeof opts === 'boolean' ? { snap: opts } : opts;
    els.push({ svg, snap, delay, states: states.map((s) => ({ o: 1, x: 0, y: 0, ...s })) });
  };
  const only = (...ps) => Array.from({ length: phases }, (_, p) => ({ o: ps.includes(p) ? 1 : 0 }));
  const all = () => only(...Array.from({ length: phases }, (_, p) => p));
  return { els, add, only, all };
}

const PILL_W = 128;
const PILL_GAP = 12;
const pillX = (W, n, i) => (W - (n * PILL_W + (n - 1) * PILL_GAP)) / 2 + i * (PILL_W + PILL_GAP);

/** The "1. FROM › 2. GROUP BY › ..." bar; the current step is dark. */
export function stepPills(add, only, W, steps) {
  const every = only(...steps.map((_, i) => i));
  steps.forEach((s, i) => {
    const x = pillX(W, steps.length, i);
    add(
      `<rect x="${x}" y="14" width="${PILL_W}" height="28" rx="14" class="pill"/>` +
        `<text x="${x + PILL_W / 2}" y="33" class="pillt" text-anchor="middle">${i + 1}. ${esc(s)}</text>`,
      every,
    );
    add(
      `<rect x="${x}" y="14" width="${PILL_W}" height="28" rx="14" class="pillon"/>` +
        `<text x="${x + PILL_W / 2}" y="33" class="pillont" text-anchor="middle">${i + 1}. ${esc(s)}</text>`,
      only(i),
      true,
    );
    if (i < steps.length - 1) {
      add(`<text x="${x + PILL_W + PILL_GAP / 2}" y="33" class="arrowt" text-anchor="middle">›</text>`, every);
    }
  });
}

export function renderStatic(W, H, title, els, phase, extraStyle = '') {
  const body = els
    .map(({ svg, states }) => {
      const s = states[phase];
      if (s.o === 0) return '';
      const t = s.x || s.y ? ` transform="translate(${s.x} ${s.y})"` : '';
      const o = s.o !== 1 ? ` opacity="${s.o}"` : '';
      return t || o ? `<g${t}${o}>${svg}</g>` : svg;
    })
    .filter(Boolean)
    .join('\n');
  return svgDoc(W, H, title, body, extraStyle);
}

// Clickable step pills and a pause button, drawn outside the fading scene. They only work when the SVG
// is embedded as a document (<object> or opened directly); inside <img> scripts don't run and it just loops.
function controls(W, steps, START) {
  const hits = steps
    .map(
      (_, i) =>
        `<rect class="step" data-start="${START[i]}" x="${pillX(W, steps.length, i)}" y="14" width="${PILL_W}" height="28" rx="14"><title>Reia animația de la pasul ${i + 1}</title></rect>`,
    )
    .join('');
  const cx = W - 38;
  return `${hits}
<g id="playpause" class="ctl"><title>Pauză / continuă</title><circle cx="${cx}" cy="28" r="15"/>
<g class="icon-pause"><rect x="${cx - 6}" y="21" width="4" height="14" rx="1"/><rect x="${cx + 2}" y="21" width="4" height="14" rx="1"/></g>
<path class="icon-play" d="M${cx - 4} 20 L${cx + 7} 28 L${cx - 4} 36 Z"/></g>
<script><![CDATA[
  let paused = false;
  const setPaused = (p) => {
    paused = p;
    document.getAnimations().forEach((a) => (p ? a.pause() : a.play()));
    document.documentElement.classList.toggle('paused', p);
  };
  document.querySelectorAll('.step').forEach((el) =>
    el.addEventListener('click', () => {
      // Jump to the start of the step (just after the fade-in for step 1) and keep playing from there.
      const t = Math.max(Number(el.dataset.start), 0.5) * 1000;
      document.getAnimations().forEach((a) => (a.currentTime = t));
      setPaused(false);
    }),
  );
  document.getElementById('playpause').addEventListener('click', () => setPaused(!paused));
]]></script>`;
}

/**
 * Looping animation. timeline: { TOTAL, START, MOVE } in seconds; phase i starts at START[i] and its
 * elements take MOVE seconds (plus their own delay) to reach their state.
 */
export function renderAnimated({ W, H, title, els, steps, timeline, extraStyle = '' }) {
  const { TOTAL, START, MOVE } = timeline;
  const pct = (s) => +((s / TOTAL) * 100).toFixed(2);
  const same = (a, b) => a.o === b.o && a.x === b.x && a.y === b.y;
  const css = (s) => `opacity:${s.o};transform:translate(${s.x}px,${s.y}px)`;
  let style = `${extraStyle}
  .scene{animation:scene ${TOTAL}s linear infinite}
  @keyframes scene{0%{opacity:0}${pct(0.4)}%{opacity:1}${pct(TOTAL - 1)}%{opacity:1}${pct(TOTAL - 0.5)}%{opacity:0}100%{opacity:0}}
  @media (prefers-reduced-motion: reduce){.scene,.scene *{animation:none!important}}
  .step{fill:#0f172a;fill-opacity:0;cursor:pointer}
  .step:hover{fill-opacity:.12}
  .ctl{cursor:pointer}.ctl circle{fill:#0f172a}.ctl:hover circle{fill:#334155}.ctl rect,.ctl path{fill:#ffffff}
  .paused .icon-pause,:root:not(.paused) .icon-play{display:none}`;
  const body = els
    .map(({ svg, states, snap, delay }, n) => {
      if (states.every((s) => same(s, states[0]))) {
        return states[0].o === 1 ? svg : '';
      }
      const frames = [`0%{${css(states[0])}}`];
      for (let i = 1; i < states.length; i++) {
        const move = snap ? 0.05 : MOVE;
        frames.push(`${pct(START[i] + delay)}%{${css(states[i - 1])}}`, `${pct(START[i] + delay + move)}%{${css(states[i])}}`);
      }
      frames.push(`${pct(TOTAL - 0.45)}%{${css(states.at(-1))}}`, `${pct(TOTAL - 0.4)}%{${css(states[0])}}`, `100%{${css(states[0])}}`);
      style += `\n  .e${n}{animation:k${n} ${TOTAL}s ease-in-out infinite}@keyframes k${n}{${frames.join('')}}`;
      return `<g class="e${n}" style="${css(states[0])}">${svg}</g>`;
    })
    .filter(Boolean)
    .join('\n');
  return svgDoc(W, H, title, `<g class="scene">\n${body}\n</g>\n${controls(W, steps, START)}`, style);
}
