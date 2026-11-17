// Generates one JOIN animation per join type (INNER, LEFT, RIGHT, FULL) per database.
// Usage: node tools/illustrations/join.mjs public/assets
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CW, GREY, PALETTE, RH, esc, renderAnimated, renderStatic, sceneBuilder, sqlLine, stepPills } from './common.mjs';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node join.mjs <assets dir> [--static <dir>]');
// --static <dir> also writes the final frame of each animation as a static SVG (for checking).
const STATIC_DIR = process.argv[3] === '--static' ? process.argv[4] : undefined;

// ---------- datasets (copied from each database's 03_insert.md) ----------
// `key` is the index of the ON column; `label` names a row in the explanations.
const DATASETS = [
  {
    dir: '01_eCommerce',
    left: {
      table: 'Produse',
      alias: 'p',
      cols: [{ name: 'Denumire', w: 160 }, { name: 'IdCategorie', w: 104 }],
      key: 1,
      rows: [
        ['Mouse wireless', 1],
        ['Tastatura mecanica', 1],
        ['Monitor 27 inch', 1],
        ['Ghid SQL Server', 2],
        ['Clean Code', 2],
        ['Pantofi de alergare', 3],
        ['Tricou din bumbac', 4],
        ['Sapa de gradina', 5],
        ['Casti bluetooth', 1],
      ],
      label: (r) => r[0],
    },
    right: {
      table: 'Categorii',
      alias: 'c',
      cols: [{ name: 'Id', w: 48 }, { name: 'Nume', w: 132 }],
      key: 0,
      rows: [
        [1, 'Electronice'],
        [2, 'Carti'],
        [3, 'Sport'],
        [4, 'Imbracaminte'],
        [5, 'Casa si gradina'],
        [6, 'Jucarii'],
      ],
      label: (r) => r[1],
    },
    reason: 'fiecare produs are o categorie (IdCategorie este NOT NULL și cheie străină).',
    // Produse LEFT JOIN Categorii has no unmatched rows, so the LEFT JOIN animation puts Categorii on the left.
    leftSwap: true,
  },
  {
    dir: '02_Library',
    left: {
      table: 'Clients',
      alias: 'cl',
      cols: [{ name: 'ClientID', w: 92 }, { name: 'FirstName', w: 104 }],
      key: 0,
      rows: [
        [1, 'Maria'],
        [2, 'Ion'],
        [3, 'Ana'],
        [4, 'Mihai'],
        [5, 'Elena'],
        [6, 'Andrei'],
      ],
      label: (r) => r[1],
    },
    right: {
      table: 'Rentals',
      alias: 'r',
      cols: [{ name: 'RentalID', w: 88 }, { name: 'ClientID', w: 88 }, { name: 'BookID', w: 76 }],
      key: 1,
      rows: [
        [1, 1, 1],
        [2, 2, 3],
        [3, 1, 4],
        [4, 3, 5],
        [5, 4, 7],
        [6, 1, 8],
        [7, 2, 2],
        [8, 5, 6],
      ],
      label: (r) => `împrumutul ${r[0]}`,
    },
    reason: 'fiecare împrumut aparține unui client (ClientID este NOT NULL și cheie străină).',
  },
  {
    dir: '03_Attendance',
    left: {
      table: 'Students',
      alias: 's',
      cols: [{ name: 'StudentID', w: 96 }, { name: 'FirstName', w: 104 }],
      key: 0,
      rows: [
        [1, 'Maria'],
        [2, 'Ion'],
        [3, 'Ana'],
        [4, 'Mihai'],
        [5, 'Elena'],
        [6, 'Andrei'],
        [7, 'Cristina'],
        [8, 'Vlad'],
      ],
      label: (r) => r[1],
    },
    right: {
      table: 'Classes',
      alias: 'cl',
      cols: [{ name: 'ClassID', w: 88 }, { name: 'StudentID', w: 104 }, { name: 'SubjectID', w: 104 }],
      key: 1,
      rows: [
        [1, 1, 1],
        [2, 2, 1],
        [3, 1, 2],
        [4, 2, 2],
        [5, 3, 1],
        [6, 3, 3],
        [7, 4, 1],
        [8, 4, 3],
        [9, 5, 4],
        [10, 6, 5],
      ],
      label: (r) => `înscrierea ${r[0]}`,
    },
    reason: 'fiecare înscriere aparține unui elev (StudentID este NOT NULL și cheie străină).',
  },
];

const TYPES = [
  { id: 'inner', kw: 'INNER JOIN', keepL: false, keepR: false },
  { id: 'left', kw: 'LEFT JOIN', keepL: true, keepR: false },
  { id: 'right', kw: 'RIGHT JOIN', keepL: false, keepR: true },
  { id: 'full', kw: 'FULL OUTER JOIN', keepL: true, keepR: true },
];

// ---------- layout ----------
const W = 900;
const STEPS = ['Tabelele', 'ON', 'Perechi', 'Fără pereche', 'Rezultat'];
// step 4 is the longest: each unmatched row is highlighted, searched for, then moved with its NULLs
const TIMELINE = { TOTAL: 37, START: [0, 4, 10, 18, 29], MOVE: 1.2 };
const KEEP_FILL = '#93c5fd';

const STYLE = `
  .ttitle{font-size:13px;font-weight:700;fill:#0f172a}
  .nullrow{fill:#fef3c7;stroke:#f59e0b;stroke-width:1.5;stroke-dasharray:4 3}
  .nullv{font-size:13px;fill:#b45309;font-style:italic;font-weight:700}
  .seek{fill:none;stroke:#f59e0b;stroke-width:3}
  .ghost{stroke:#f59e0b;stroke-width:2;stroke-dasharray:6 4}
  .nomatch{font-size:12px;font-weight:700;fill:#dc2626}
  .callout{font-size:11.5px;font-weight:700;fill:#b45309}
  .unrow{fill:none;stroke:#94a3b8;stroke-width:1.5;stroke-dasharray:4 3}
  .colhl{fill:none;stroke:#facc15;stroke-width:2.5}
  .tag{font-size:11.5px;font-style:italic;fill:#64748b}
  .tag.ok{fill:#15803d;font-style:normal;font-weight:700}
  .tag.bad{fill:#b91c1c;font-style:normal;font-weight:700}
  .venn{stroke:#0f172a;stroke-width:1.5}
  .vpulse{fill:#facc15;fill-opacity:.75;stroke:#ca8a04;stroke-width:2}
  .vpulse.bad{fill:#fca5a5;stroke:#dc2626}
  .vlabel{font-size:12px;font-weight:700;fill:#0f172a}
  .vcap{font-size:11px;fill:#475569}
  .vempty{font-size:13px;font-weight:700;fill:#b91c1c}
`;

const words = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const quoted = (xs) => xs.map((x) => `„${x}”`).join(', ');

/** Widens columns so that the prefixed header in the result ("cl.ClientID") fits. */
function prepare(side) {
  side.cols = side.cols.map((c) => ({ ...c, w: Math.max(c.w, Math.ceil((side.alias.length + 1 + c.name.length) * 7.4 + 18)) }));
  side.w = side.cols.reduce((a, c) => a + c.w, 0);
}

function matches(ds) {
  const { left: L, right: R } = ds;
  const pairs = [];
  L.rows.forEach((l, i) => R.rows.forEach((r, j) => l[L.key] === r[R.key] && pairs.push({ i, j })));
  const unL = L.rows.map((_, i) => i).filter((i) => !pairs.some((p) => p.i === i));
  const unR = R.rows.map((_, j) => j).filter((j) => !pairs.some((p) => p.j === j));
  return { pairs, unL, unR };
}

const resultCount = (m, t) => m.pairs.length + (t.keepL ? m.unL.length : 0) + (t.keepR ? m.unR.length : 0);

function buildScene(ds, type) {
  const { left: L, right: R } = ds;
  const { els, add, only, all } = sceneBuilder(5);
  const m = matches(ds);
  const rows = [
    ...m.pairs,
    ...(type.keepL ? m.unL.map((i) => ({ i, j: null })) : []),
    ...(type.keepR ? m.unR.map((j) => ({ i: null, j })) : []),
  ];

  // Same key value → same colour on both sides; rows without a pair are grey.
  const keys = [...new Set([...L.rows.map((r) => r[L.key]), ...R.rows.map((r) => r[R.key])])].sort((a, b) => a - b);
  const colorL = (i) => (m.unL.includes(i) ? GREY : PALETTE[keys.indexOf(L.rows[i][L.key]) % PALETTE.length]);
  const colorR = (j) => (m.unR.includes(j) ? GREY : PALETTE[keys.indexOf(R.rows[j][R.key]) % PALETTE.length]);

  stepPills(add, only, W, STEPS);

  // --- query panel
  const lKey = `${L.alias}.${L.cols[L.key].name}`;
  const rKey = `${R.alias}.${R.cols[R.key].name}`;
  const onText = `ON ${lKey} = ${rKey}`;
  const query = [
    `SELECT ${[...L.cols.map((c) => `${L.alias}.${c.name}`), ...R.cols.map((c) => `${R.alias}.${c.name}`)].join(', ')}`,
    `FROM   ${L.table} AS ${L.alias}`,
    `${type.kw} ${R.table} AS ${R.alias} ${onText};`,
  ];
  const qx = 24;
  const qy = 56;
  const qh = query.length * 22 + 18;
  const qw = W - 2 * qx - 170;
  add(`<rect x="${qx}" y="${qy}" width="${qw}" height="${qh}" rx="8" class="qbox"/>`, all());
  const lineY = (i) => qy + 24 + i * 22;
  const hl = (line, frag) => {
    const idx = query[line].indexOf(frag);
    if (idx < 0) throw new Error(`fragment not found: ${frag}`);
    return `<rect x="${qx + 14 + idx * CW - 3}" y="${lineY(line) - 16}" width="${frag.length * CW + 6}" height="22" rx="4" class="qhl"/>`;
  };
  add(hl(1, query[1]) + hl(2, `${R.table} AS ${R.alias}`), only(0), true);
  add(hl(2, onText), only(1), true);
  add(hl(0, query[0]), only(2), true);
  add(hl(2, type.kw), only(3), true);
  add(hl(0, query[0]) + hl(2, type.kw), only(4), true);
  add(query.map((l, i) => sqlLine(l, qx + 14, lineY(i))).join(''), all());

  // --- Venn legend: shaded regions are the rows this join keeps; it pulses in sync with the rows
  const vr = 25;
  const vd = 30;
  const vx = qx + qw + 85;
  const vy = qy + 36;
  const vh = Math.sqrt(vr * vr - (vd / 2) ** 2).toFixed(2);
  const top = `${vx} ${(vy - vh).toFixed(2)}`;
  const bot = `${vx} ${(vy + +vh).toFixed(2)}`;
  const lens = `M${top} A${vr} ${vr} 0 0 1 ${bot} A${vr} ${vr} 0 0 1 ${top} Z`;
  const crescL = `M${top} A${vr} ${vr} 0 1 0 ${bot} A${vr} ${vr} 0 0 1 ${top} Z`;
  const crescR = `M${top} A${vr} ${vr} 0 1 1 ${bot} A${vr} ${vr} 0 0 0 ${top} Z`;
  const fill = (keep) => (keep ? KEEP_FILL : '#ffffff');
  add(
    `<path d="${crescL}" fill="${fill(type.keepL)}" class="venn"/><path d="${crescR}" fill="${fill(type.keepR)}" class="venn"/>` +
      `<path d="${lens}" fill="${KEEP_FILL}" class="venn"/>` +
      `<text x="${vx - vd / 2 - 9}" y="${vy + 4}" class="vlabel" text-anchor="middle">${esc(L.alias)}</text>` +
      `<text x="${vx + vd / 2 + 9}" y="${vy + 4}" class="vlabel" text-anchor="middle">${esc(R.alias)}</text>`,
    all(),
  );
  add(`<path d="${lens}" class="vpulse"/>`, only(2));
  // unmatched rows: yellow when this join keeps them, red when it drops them
  if (m.unL.length) add(`<path d="${crescL}" class="vpulse${type.keepL ? '' : ' bad'}"/>`, only(3));
  if (m.unR.length) add(`<path d="${crescR}" class="vpulse${type.keepR ? '' : ' bad'}"/>`, only(3));
  // A side without unmatched rows: its crescent is empty for this data.
  if (!m.unL.length) add(`<text x="${vx - vd / 2 - 9}" y="${vy + 20}" class="vempty" text-anchor="middle">∅</text>`, only(3, 4));
  if (!m.unR.length) add(`<text x="${vx + vd / 2 + 9}" y="${vy + 20}" class="vempty" text-anchor="middle">∅</text>`, only(3, 4));
  add(`<text x="${vx}" y="${qy + qh - 2}" class="vcap" text-anchor="middle">${esc(type.kw)}</text>`, only(0, 1, 2));
  add(
    `<text x="${vx}" y="${qy + qh - 2}" class="vcap" text-anchor="middle">fără pereche: ${esc(L.alias)} ${m.unL.length} · ${esc(R.alias)} ${m.unR.length}</text>`,
    only(3, 4),
  );

  // --- explanations (two lines per step)
  const nPairs = m.pairs.length;
  const nRes = rows.length;
  const most = [
    ...L.rows.map((r, i) => ({ label: L.label(r), n: m.pairs.filter((p) => p.i === i).length })),
    ...R.rows.map((r, j) => ({ label: R.label(r), n: m.pairs.filter((p) => p.j === j).length })),
  ].sort((a, b) => b.n - a.n)[0];
  const sideText = (side, other, un, keep) => {
    if (!un.length) return `${side.table}: toate rândurile au pereche.`;
    const names = quoted(un.map((k) => side.label(side.rows[k])));
    if (keep) return `${un.length === 1 ? `Rândul ${names} rămâne` : `Rândurile ${names} rămân`}, cu NULL în coloanele din ${other.table}.`;
    return `${un.length === 1 ? `Rândul ${names} din ${side.table} este eliminat` : `Rândurile ${names} din ${side.table} sunt eliminate`}.`;
  };
  const keepText = {
    inner: 'Fără pereche: INNER JOIN păstrează doar perechile; rândurile fără pereche sunt eliminate.',
    left: `Fără pereche: LEFT JOIN păstrează toate rândurile din ${L.table}, chiar și pe cele fără pereche.`,
    right: `Fără pereche: RIGHT JOIN păstrează toate rândurile din ${R.table}, chiar și pe cele fără pereche.`,
    full: 'Fără pereche: FULL OUTER JOIN păstrează rândurile fără pereche din ambele tabele.',
  }[type.id];
  const same = TYPES.filter((t) => t !== type && resultCount(m, t) === nRes).map((t) => t.kw);
  const explain = [
    [`Tabelele: ${L.table} (stânga) și ${R.table} (dreapta).`, `Coloanele din condiția ON (${lKey} și ${rKey}) sunt evidențiate.`],
    [
      `ON: liniile leagă rândurile pentru care ${lKey} = ${rKey}.`,
      (most.n > 1 ? `${most.label} are ${most.n} perechi, deci apare de ${most.n} ori în rezultat. ` : '') +
        (m.unL.length || m.unR.length ? 'Rândurile gri nu au nicio pereche.' : ''),
    ],
    [`Perechi: fiecare pereche devine un rând în rezultat (${words(nPairs, 'rând', 'rânduri')}).`, `Coloanele din stânga vin din ${L.table}, cele din dreapta din ${R.table}.`],
    [keepText, `${sideText(L, R, m.unL, type.keepL)} ${sideText(R, L, m.unR, type.keepR)}`],
    [
      `Rezultat: ${words(nRes, 'rând', 'rânduri')}${same.length ? ` — același rezultat ca ${same.join(' și ')}.` : '.'}`,
      same.length ? `Motivul: ${ds.reason}` : '',
      // LEFT JOIN: the chapter's next topic is the anti-join, which keeps exactly the rows that got NULLs
      type.id === 'left' && m.unL.length
        ? `Anti-join: cu WHERE ${rKey} IS NULL ar rămâne doar ${quoted(m.unL.map((i) => L.label(L.rows[i])))}.`
        : '',
    ],
  ];
  const ey = qy + qh + 28;
  const extraLine = explain.some((e) => e[2]);
  explain.forEach(([first, ...more], p) => {
    const [head, ...rest] = first.split(':');
    add(
      `<text x="${W / 2}" y="${ey}" class="explain" text-anchor="middle"><tspan class="explainb">${esc(head)}:</tspan>${esc(rest.join(':'))}</text>` +
        more
          .filter(Boolean)
          .map((line, n) => `<text x="${W / 2}" y="${ey + 21 * (n + 1)}" class="explain" text-anchor="middle">${esc(line)}</text>`)
          .join(''),
      only(p),
      true,
    );
  });

  // --- source tables
  const VT = ey + 50 + (extraLine ? 21 : 0);
  const HY = VT + 10; // header row top
  const LX = 40;
  const RTX = W - 40 - R.w;
  const rowY = (k) => HY + RH + k * RH;
  const colXs = (side, x0) => {
    const xs = [];
    side.cols.reduce((x, c) => (xs.push(x), x + c.w), x0);
    return xs;
  };
  // the result's header prefixes column names with the alias ("cl.ClientID"), as in the SELECT list
  const header = (side, x0, y, prefixed) =>
    `<rect x="${x0}" y="${y}" width="${side.w}" height="${RH}" class="th"/>` +
    side.cols
      .map((c, ci) => `<text x="${colXs(side, x0)[ci] + 8}" y="${y + 17}" class="tht${ci === side.key ? ' key' : ''}">${esc(prefixed ? `${side.alias}.${c.name}` : c.name)}</text>`)
      .join('');
  const rowSvg = (side, vals, x0, y, color) =>
    `<rect x="${x0}" y="${y}" width="${side.w}" height="${RH}" fill="${color.t}" class="row"/>` +
    `<rect x="${x0}" y="${y}" width="4" height="${RH}" fill="${color.c}"/>` +
    vals
      .map((v, ci) => `<text x="${colXs(side, x0)[ci] + 8}" y="${y + 17}" class="td${ci === side.key ? ' keyv' : ''}"${ci === side.key ? ` fill="${color.c}"` : ''}>${esc(v)}</text>`)
      .join('');
  const nullSvg = (side, x0, y) =>
    `<rect x="${x0}" y="${y}" width="${side.w}" height="${RH}" class="nullrow"/>` +
    side.cols.map((_, ci) => `<text x="${colXs(side, x0)[ci] + 8}" y="${y + 17}" class="nullv">NULL</text>`).join('');

  add(
    `<text x="${LX}" y="${VT}" class="ttitle">${esc(L.table)} (stânga)</text><text x="${RTX}" y="${VT}" class="ttitle">${esc(R.table)} (dreapta)</text>` +
      header(L, LX, HY, false) +
      header(R, RTX, HY, false),
    all(),
  );
  L.rows.forEach((r, i) => {
    add(rowSvg(L, r, LX, rowY(i), colorL(i)) + (m.unL.includes(i) ? `<rect x="${LX}" y="${rowY(i)}" width="${L.w}" height="${RH}" class="unrow"/>` : ''), all());
  });
  R.rows.forEach((r, j) => {
    add(rowSvg(R, r, RTX, rowY(j), colorR(j)) + (m.unR.includes(j) ? `<rect x="${RTX}" y="${rowY(j)}" width="${R.w}" height="${RH}" class="unrow"/>` : ''), all());
  });
  // the ON columns
  const colBox = (side, x0) => {
    const x = colXs(side, x0)[side.key];
    return `<rect x="${x + 1}" y="${HY + 1}" width="${side.cols[side.key].w - 2}" height="${RH * (side.rows.length + 1) - 2}" rx="3" class="colhl"/>`;
  };
  add(colBox(L, LX) + colBox(R, RTX), only(0, 1), true);

  // connectors between matching rows
  m.pairs.forEach(({ i, j }, k) => {
    const c = colorL(i).c;
    const y1 = rowY(i) + RH / 2;
    const y2 = rowY(j) + RH / 2;
    add(
      `<line x1="${LX + L.w + 4}" y1="${y1}" x2="${RTX - 4}" y2="${y2}" stroke="${c}" stroke-width="1.8"/>` +
        `<circle cx="${LX + L.w + 4}" cy="${y1}" r="3.5" fill="${c}"/><circle cx="${RTX - 4}" cy="${y2}" r="3.5" fill="${c}"/>`,
      [{ o: 0 }, {}, {}, {}, {}],
      { delay: k * 0.2 },
    );
  });

  // unmatched rows: tag "fără pereche", then kept / eliminated
  const unTag = (side, idx, x, anchor, keep) => {
    const y = rowY(idx) + 17;
    add(`<text x="${x}" y="${y}" class="tag" text-anchor="${anchor}">fără pereche</text>`, only(1, 2), true);
    add(
      `<text x="${x}" y="${y}" class="tag ${keep ? 'ok' : 'bad'}" text-anchor="${anchor}">${keep ? '✓ păstrat, cu NULL' : '✗ eliminat'}</text>`,
      only(3, 4),
      true,
    );
    if (!keep) {
      const x0 = side === L ? LX : RTX;
      add(`<rect x="${x0}" y="${rowY(idx)}" width="${side.w}" height="${RH}" class="dim"/>`, [{ o: 0 }, { o: 0 }, { o: 0 }, {}, {}]);
    }
  };
  m.unL.forEach((i) => unTag(L, i, LX + L.w + 10, 'start', type.keepL));
  m.unR.forEach((j) => unTag(R, j, RTX - 10, 'end', type.keepR));

  // --- result
  const resX = (W - (L.w + R.w)) / 2;
  const RT = rowY(Math.max(L.rows.length, R.rows.length)) + 44;
  const RHY = RT + 8;
  const resY = (k) => RHY + RH + k * RH;
  add(
    `<text x="${resX}" y="${RT}" class="ttitle">Rezultat</text>` + header(L, resX, RHY, true) + header(R, resX + L.w, RHY, true),
    [{ o: 0 }, { o: 0 }, {}, {}, {}],
  );
  add(`<text x="${resX + 62}" y="${RT}" class="restitle">— ${words(nPairs, 'rând', 'rânduri')}</text>`, only(2), true);
  add(`<text x="${resX + 62}" y="${RT}" class="restitle">— ${words(nRes, 'rând', 'rânduri')}</text>`, only(3, 4), true);

  // Each result row is built from a copy of the left row and a copy of the right row (or NULLs),
  // which lift off the source tables and slide into place.
  // Unmatched rows that the join keeps are staged one at a time in step 4: the row lights up, a dashed
  // line searches the other table and finds nothing (✗), then the row moves down with NULLs and a callout.
  const STAGE = 2.2; // seconds per unmatched row
  rows.forEach(({ i, j }, k) => {
    if (i !== null && j !== null) return;
    const t0 = (k - nPairs) * STAGE;
    const y = rowY(i ?? j);
    const cy = y + RH / 2;
    // the search line stops in the gap so its ✗ doesn't point at an unrelated row of the other table
    const [x0, w, gx1, gx2] =
      i !== null ? [LX, L.w, LX + L.w + 128, LX + L.w + 175] : [RTX, R.w, RTX - 128, RTX - 175];
    add(`<rect x="${x0 - 2}" y="${y - 1}" width="${w + 4}" height="${RH + 2}" rx="3" class="seek"/>`, only(3), { delay: t0 });
    add(
      `<line x1="${gx1}" y1="${cy}" x2="${gx2}" y2="${cy}" class="ghost"/>` +
        `<text x="${gx2 + (i !== null ? 4 : -4)}" y="${cy + 5}" class="nomatch" text-anchor="${i !== null ? 'start' : 'end'}">✗ nicio pereche</text>`,
      only(3),
      { delay: t0 + 0.4 },
    );
    const ry = resY(k);
    const other = i !== null ? R : L;
    add(
      i !== null
        ? `<text x="${resX + L.w + R.w + 10}" y="${ry + 11}" class="callout">← nicio pereche în ${esc(other.table)}</text>` +
            `<text x="${resX + L.w + R.w + 10}" y="${ry + 23}" class="callout">→ NULL în coloanele ${esc(other.alias)}.*</text>`
        : `<text x="${resX - 10}" y="${ry + 11}" class="callout" text-anchor="end">nicio pereche în ${esc(other.table)} →</text>` +
            `<text x="${resX - 10}" y="${ry + 23}" class="callout" text-anchor="end">NULL în coloanele ${esc(other.alias)}.* ←</text>`,
      [{ o: 0 }, { o: 0 }, { o: 0 }, {}, {}],
      { delay: t0 + 1.4 },
    );
  });

  rows.forEach(({ i, j }, k) => {
    const isPair = i !== null && j !== null;
    const phase = isPair ? 2 : 3;
    const delay = isPair ? k * 0.45 : (k - nPairs) * STAGE + 1.0;
    const appear = (dx, dy) => [0, 1, 2, 3, 4].map((p) => (p < phase ? { o: 0 } : { x: dx, y: dy }));
    if (i !== null) add(rowSvg(L, L.rows[i], LX, rowY(i), colorL(i)), appear(resX - LX, resY(k) - rowY(i)), { delay });
    else add(nullSvg(L, resX, resY(k)), appear(0, 0), { delay });
    if (j !== null) add(rowSvg(R, R.rows[j], RTX, rowY(j), colorR(j)), appear(resX + L.w - RTX, resY(k) - rowY(j)), { delay });
    else add(nullSvg(R, resX + L.w, resY(k)), appear(0, 0), { delay });
  });

  const H = resY(rows.length) + 30;
  return { els, H };
}

for (const ds of DATASETS) {
  prepare(ds.left);
  prepare(ds.right);
  const dir = join(OUT, ds.dir, 'img');
  mkdirSync(dir, { recursive: true });
  for (const type of TYPES) {
    const sides = type.id === 'left' && ds.leftSwap ? { ...ds, left: ds.right, right: ds.left } : ds;
    const { els, H } = buildScene(sides, type);
    const title = `Animație: cum funcționează ${type.kw} (${sides.left.table} și ${sides.right.table})`;
    writeFileSync(join(dir, `join_${type.id}_animatie.svg`), renderAnimated({ W, H, title, els, steps: STEPS, timeline: TIMELINE, extraStyle: STYLE }));
    if (STATIC_DIR) {
      mkdirSync(STATIC_DIR, { recursive: true });
      for (const p of [1, 3, 4]) writeFileSync(join(STATIC_DIR, `${ds.dir}_${type.id}_${p}.svg`), renderStatic(W, H, title, els, p, STYLE));
    }
  }
  console.log('wrote', dir);
}
