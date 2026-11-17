// Generates the GROUP BY / aggregate / HAVING illustrations (5 static steps + 1 animation) per database.
// Usage: node tools/illustrations/group_by.mjs public/assets
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CW, PALETTE, RH, esc, renderAnimated, renderStatic, sceneBuilder, sqlLine, stepPills } from './common.mjs';

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node group_by.mjs <assets dir>');

// ---------- datasets (copied from each database's 03_insert.md) ----------
const sum = (vs) => ({ value: vs.reduce((a, b) => a + b, 0), expr: vs.join(' + ') });

const DATASETS = [
  {
    dir: '01_eCommerce',
    table: 'Produse',
    columns: [
      { name: 'Id', w: 44 },
      { name: 'Denumire', w: 170 },
      { name: 'IdCategorie', w: 96 },
      { name: 'Stoc', w: 60 },
    ],
    rows: [
      [1, 'Mouse wireless', 1, 150],
      [2, 'Tastatura mecanica', 1, 80],
      [3, 'Monitor 27 inch', 1, 30],
      [4, 'Ghid SQL Server', 2, 45],
      [5, 'Clean Code', 2, 60],
      [6, 'Pantofi de alergare', 3, 55],
      [7, 'Tricou din bumbac', 4, 200],
      [8, 'Sapa de gradina', 5, 70],
      [9, 'Casti bluetooth', 1, 0],
    ],
    keyIdx: 2,
    aggs: [
      { name: 'NumarProduse', w: 112, fn: (rs) => ({ value: rs.length, note: `COUNT(*) = ${rs.length}` }) },
      {
        name: 'StocTotal',
        w: 92,
        fn: (rs) => {
          const s = sum(rs.map((r) => r[3]));
          return { value: s.value, note: rs.length > 1 ? `SUM(Stoc) = ${s.expr} = ${s.value}` : `SUM(Stoc) = ${s.value}` };
        },
      },
    ],
    query: [
      'SELECT   IdCategorie, COUNT(*) AS NumarProduse, SUM(Stoc) AS StocTotal',
      'FROM     Produse',
      'GROUP BY IdCategorie',
      'HAVING   COUNT(*) >= 2;',
    ],
    aggFragments: ['COUNT(*) AS NumarProduse', 'SUM(Stoc) AS StocTotal'],
    having: { test: (g) => g.aggValues[0] >= 2, text: (g) => `${g.aggValues[0]} ≥ 2` },
    explain: [
      'FROM: se citesc toate rândurile din tabelul Produse.',
      'GROUP BY: rândurile cu aceeași valoare în IdCategorie ajung în același grup.',
      'Agregare: fiecare grup devine un singur rând; COUNT și SUM se calculează pe rândurile grupului.',
      'HAVING: se păstrează doar grupurile cu COUNT(*) >= 2; celelalte sunt eliminate.',
      'SELECT: rezultatul final are câte un rând pentru fiecare grup rămas.',
    ],
  },
  {
    dir: '02_Library',
    table: 'Rentals',
    columns: [
      { name: 'RentalID', w: 80 },
      { name: 'ClientID', w: 80 },
      { name: 'BookID', w: 70 },
      { name: 'RentalDays', w: 96 },
    ],
    rows: [
      [1, 1, 1, 14],
      [2, 2, 3, 14],
      [3, 1, 4, 7],
      [4, 3, 5, 14],
      [5, 4, 7, 7],
      [6, 1, 8, 14],
      [7, 2, 2, 7],
      [8, 5, 6, 14],
    ],
    keyIdx: 1,
    aggs: [
      { name: 'RentalCount', w: 104, fn: (rs) => ({ value: rs.length, note: `COUNT(*) = ${rs.length}` }) },
      {
        name: 'TotalDays',
        w: 96,
        fn: (rs) => {
          const s = sum(rs.map((r) => r[3]));
          return { value: s.value, note: rs.length > 1 ? `SUM(RentalDays) = ${s.expr} = ${s.value}` : `SUM(RentalDays) = ${s.value}` };
        },
      },
    ],
    query: [
      'SELECT   ClientID, COUNT(*) AS RentalCount, SUM(RentalDays) AS TotalDays',
      'FROM     Rentals',
      'GROUP BY ClientID',
      'HAVING   COUNT(*) >= 2;',
    ],
    aggFragments: ['COUNT(*) AS RentalCount', 'SUM(RentalDays) AS TotalDays'],
    having: { test: (g) => g.aggValues[0] >= 2, text: (g) => `${g.aggValues[0]} ≥ 2` },
    explain: [
      'FROM: se citesc toate rândurile din tabelul Rentals.',
      'GROUP BY: împrumuturile cu același ClientID ajung în același grup.',
      'Agregare: fiecare grup devine un singur rând; COUNT și SUM se calculează pe rândurile grupului.',
      'HAVING: se păstrează doar clienții cu COUNT(*) >= 2; ceilalți sunt eliminați.',
      'SELECT: rezultatul final are câte un rând pentru fiecare grup rămas.',
    ],
  },
  {
    dir: '03_Attendance',
    table: 'Attendance',
    columns: [
      { name: 'AttendanceID', w: 104 },
      { name: 'ClassID', w: 66 },
      { name: 'TeacherID', w: 84 },
      { name: 'AttendanceDate', w: 116 },
    ],
    rows: [
      [1, 1, 1, '2024-09-03'],
      [2, 2, 1, '2024-09-03'],
      [3, 5, 1, '2024-09-03'],
      [4, 7, 1, '2024-09-03'],
      [5, 3, 2, '2024-09-04'],
      [6, 4, 2, '2024-09-04'],
      [7, 6, 3, '2024-09-04'],
      [8, 8, 3, '2024-09-04'],
      [9, 1, 1, '2024-09-05'],
      [10, 2, 1, '2024-09-05'],
      [11, 9, 4, '2024-09-05'],
      [12, 10, 5, '2024-09-05'],
    ],
    keyIdx: 2,
    aggs: [
      { name: 'SessionCount', w: 108, fn: (rs) => ({ value: rs.length, note: `COUNT(*) = ${rs.length}` }) },
      {
        name: 'LastDate',
        w: 100,
        fn: (rs) => {
          const v = rs.map((r) => r[3]).sort().at(-1);
          return { value: v, note: `MAX(AttendanceDate) = ${v}` };
        },
      },
    ],
    query: [
      'SELECT   TeacherID, COUNT(*) AS SessionCount, MAX(AttendanceDate) AS LastDate',
      'FROM     Attendance',
      'GROUP BY TeacherID',
      'HAVING   COUNT(*) > 1;',
    ],
    aggFragments: ['COUNT(*) AS SessionCount', 'MAX(AttendanceDate) AS LastDate'],
    having: { test: (g) => g.aggValues[0] > 1, text: (g) => `${g.aggValues[0]} > 1` },
    explain: [
      'FROM: se citesc toate rândurile din tabelul Attendance.',
      'GROUP BY: orele ținute de același TeacherID ajung în același grup.',
      'Agregare: fiecare grup devine un singur rând; COUNT și MAX se calculează pe rândurile grupului.',
      'HAVING: se păstrează doar profesorii cu COUNT(*) > 1; ceilalți sunt eliminați.',
      'SELECT: rezultatul final are câte un rând pentru fiecare grup rămas.',
    ],
  },
];

// ---------- layout ----------
const W = 840;
const STEPS = ['FROM', 'GROUP BY', 'Agregare', 'HAVING', 'SELECT'];
const TITLES = [
  'Pasul 1 — FROM: tabelul sursă',
  'Pasul 2 — GROUP BY: gruparea rândurilor',
  'Pasul 3 — funcțiile de agregare',
  'Pasul 4 — HAVING: filtrarea grupurilor',
  'Pasul 5 — SELECT: rezultatul',
];
const FILES = ['group_by_1_tabel', 'group_by_2_grupare', 'group_by_3_agregare', 'group_by_4_having', 'group_by_5_rezultat'];
const TIMELINE = { TOTAL: 28, START: [0, 4, 9, 15, 21], MOVE: 1.2 };

/**
 * Builds the scene as a list of elements. Each element has SVG markup and a state per phase:
 * { o: opacity, x: dx, y: dy }. Static images render one phase; the animation interpolates them.
 */
function buildScene(ds) {
  const { els, add, only } = sceneBuilder(5);
  stepPills(add, only, W, STEPS);

  // --- query panel
  const qx = 24;
  const qy = 56;
  const qh = ds.query.length * 22 + 18;
  add(`<rect x="${qx}" y="${qy}" width="${W - 2 * qx}" height="${qh}" rx="8" class="qbox"/>`, only(0, 1, 2, 3, 4));
  const lineY = (i) => qy + 24 + i * 22;
  const hl = (line, frag) => {
    const idx = ds.query[line].indexOf(frag);
    if (idx < 0) throw new Error(`fragment not found: ${frag}`);
    return `<rect x="${qx + 14 + idx * CW - 3}" y="${lineY(line) - 16}" width="${frag.length * CW + 6}" height="22" rx="4" class="qhl"/>`;
  };
  const lineOf = (kw) => ds.query.findIndex((l) => l.startsWith(kw));
  const fromL = lineOf('FROM');
  const groupL = lineOf('GROUP BY');
  const havingL = lineOf('HAVING');
  add(hl(fromL, ds.query[fromL].trimEnd()), only(0), true);
  add(hl(groupL, ds.query[groupL].trimEnd()), only(1), true);
  add(ds.aggFragments.map((f) => hl(0, f)).join(''), only(2), true);
  add(hl(havingL, ds.query[havingL].trimEnd()), only(3), true);
  add(hl(0, ds.query[0].trimEnd()), only(4), true);
  add(ds.query.map((l, i) => sqlLine(l, qx + 14, lineY(i))).join(''), only(0, 1, 2, 3, 4));

  // --- explanation line
  const ey = qy + qh + 30;
  ds.explain.forEach((t, i) => {
    const [head, ...rest] = t.split(':');
    add(
      `<text x="${W / 2}" y="${ey}" class="explain" text-anchor="middle"><tspan class="explainb">${esc(head)}:</tspan>${esc(rest.join(':'))}</text>`,
      only(i),
      true,
    );
  });

  // --- data
  const VT = ey + 22; // top of the visual area
  const groups = [];
  ds.rows.forEach((r, i) => {
    let g = groups.find((g) => g.key === r[ds.keyIdx]);
    if (!g) groups.push((g = { key: r[ds.keyIdx], rows: [] }));
    g.rows.push({ r, i });
  });
  groups.sort((a, b) => (a.key < b.key ? -1 : 1));
  groups.forEach((g, gi) => {
    g.color = PALETTE[gi % PALETTE.length];
    const res = ds.aggs.map((a) => a.fn(g.rows.map((x) => x.r)));
    g.aggValues = res.map((x) => x.value);
    g.notes = res.map((x) => x.note);
    g.pass = ds.having.test(g);
  });

  // left table
  const LX = 44;
  const LW = ds.columns.reduce((a, c) => a + c.w, 0);
  const colX = [];
  ds.columns.reduce((x, c) => (colX.push(x), x + c.w), LX);
  const keyCol = ds.columns[ds.keyIdx];
  add(
    `<rect x="${LX}" y="${VT}" width="${LW}" height="${RH}" class="th"/>` +
      ds.columns
        .map((c, i) => `<text x="${colX[i] + 8}" y="${VT + 17}" class="tht${i === ds.keyIdx ? ' key' : ''}">${esc(c.name)}</text>`)
        .join(''),
    [{}, {}, {}, {}, { o: 0 }],
  );

  // grouped layout
  const gap = 24;
  let cursor = VT + RH + 22;
  groups.forEach((g) => {
    g.top = cursor;
    g.h = Math.max(g.rows.length * RH, 2 * RH);
    cursor += g.h + gap;
  });
  const groupedBottom = cursor - gap;
  const origBottom = VT + RH + ds.rows.length * RH;

  // bucket outlines + labels (drawn under rows)
  groups.forEach((g) => {
    const label = `${keyCol.name} = ${g.key}`;
    const lw = label.length * 6.6 + 14;
    add(
      `<rect x="${LX - 8}" y="${g.top - 6}" width="${LW + 16}" height="${g.h + 12}" rx="8" fill="${g.color.t}" fill-opacity="0.45" stroke="${g.color.c}" stroke-width="1.5" stroke-dasharray="5 3"/>` +
        `<rect x="${LX}" y="${g.top - 15}" width="${lw}" height="17" rx="8" fill="${g.color.c}"/>` +
        `<text x="${LX + 7}" y="${g.top - 3}" class="glabel">${esc(label)}</text>`,
      [{ o: 0 }, {}, {}, {}, { o: 0 }],
    );
  });

  // source rows
  groups.forEach((g) => {
    g.rows.forEach(({ r, i }, j) => {
      const y0 = VT + RH + i * RH;
      const y1 = g.top + j * RH;
      const cells = r
        .map((v, ci) => `<text x="${colX[ci] + 8}" y="${y0 + 17}" class="td${ci === ds.keyIdx ? ' keyv' : ''}"${ci === ds.keyIdx ? ` fill="${g.color.c}"` : ''}>${esc(v)}</text>`)
        .join('');
      add(
        `<rect x="${LX}" y="${y0}" width="${LW}" height="${RH}" fill="${g.color.t}" class="row"/>` +
          `<rect x="${LX}" y="${y0}" width="4" height="${RH}" fill="${g.color.c}"/>` +
          cells,
        [{}, { y: y1 - y0 }, { y: y1 - y0 }, { y: y1 - y0 }, { y: y1 - y0, o: 0 }],
      );
    });
  });

  // aggregate table on the right
  const AX = LX + LW + 70;
  const aggCols = [{ name: keyCol.name, w: keyCol.w }, ...ds.aggs];
  const AW = aggCols.reduce((a, c) => a + c.w, 0);
  const aColX = [];
  aggCols.reduce((x, c) => (aColX.push(x), x + c.w), AX);
  const RX = (W - AW) / 2; // x of the final result table
  const passing = groups.filter((g) => g.pass);
  const RT = VT + 30; // top of the final result table, leaving room for its title

  add(
    `<rect x="${AX}" y="${VT}" width="${AW}" height="${RH}" class="th"/>` +
      aggCols.map((c, i) => `<text x="${aColX[i] + 8}" y="${VT + 17}" class="tht${i === 0 ? ' key' : ' agg'}">${esc(c.name)}</text>`).join(''),
    [{ o: 0 }, { o: 0, x: -30 }, {}, {}, { x: RX - AX, y: RT - VT }],
  );
  add(
    `<rect x="${RX - 1}" y="${RT - 1}" width="${AW + 2}" height="${RH * (passing.length + 1) + 2}" rx="3" class="resframe"/>` +
      `<text x="${RX}" y="${RT - 10}" class="restitle">Rezultat (${passing.length} ${passing.length === 1 ? 'rând' : 'rânduri'})</text>`,
    only(4),
  );

  groups.forEach((g) => {
    const y = g.top;
    const vals = [g.key, ...g.aggValues];
    const rowSvg =
      `<rect x="${AX}" y="${y}" width="${AW}" height="${RH}" fill="${g.color.t}" class="row"/>` +
      `<rect x="${AX}" y="${y}" width="4" height="${RH}" fill="${g.color.c}"/>` +
      vals.map((v, i) => `<text x="${aColX[i] + 8}" y="${y + 17}" class="td${i === 0 ? ' keyv' : ' aggv'}"${i === 0 ? ` fill="${g.color.c}"` : ''}>${esc(v)}</text>`).join('');
    const k = passing.indexOf(g);
    const resultState = g.pass ? { x: RX - AX, y: RT + RH + k * RH - y } : { o: 0 };
    add(rowSvg, [{ o: 0 }, { o: 0, x: -30 }, {}, {}, resultState]);

    // arrow bucket → aggregate row
    const ay = y + RH / 2;
    add(
      `<line x1="${LX + LW + 14}" y1="${ay}" x2="${AX - 10}" y2="${ay}" stroke="${g.color.c}" stroke-width="2"/>` +
        `<path d="M${AX - 10} ${ay - 5} L${AX - 2} ${ay} L${AX - 10} ${ay + 5} Z" fill="${g.color.c}"/>`,
      only(2, 3),
    );
    // calculation notes
    add(`<text x="${AX + 6}" y="${y + RH + 14}" class="note">${esc(g.notes.join('   ·   '))}</text>`, only(2), true);
    // HAVING verdict
    add(
      `<text x="${AX + 6}" y="${y + RH + 14}" class="note ${g.pass ? 'ok' : 'bad'}">COUNT(*) = ${g.aggValues[0]} → ${esc(ds.having.text(g))} ${g.pass ? 'adevărat → grup păstrat' : 'fals → grup eliminat'}</text>`,
      only(3),
      true,
    );
    if (g.pass) {
      add(
        `<circle cx="${AX + AW + 18}" cy="${ay}" r="10" class="okc"/><path d="M${AX + AW + 13} ${ay} l4 4 l7 -8" class="okm"/>`,
        only(3),
      );
    } else {
      add(
        `<rect x="${LX - 10}" y="${g.top - 17}" width="${AX + AW - LX + 20}" height="${g.h + 25}" class="dim"/>` +
          `<line x1="${AX}" y1="${ay}" x2="${AX + AW}" y2="${ay}" class="strike"/>` +
          `<circle cx="${AX + AW + 18}" cy="${ay}" r="10" class="badc"/><path d="M${AX + AW + 14} ${ay - 4} l8 8 m0 -8 l-8 8" class="badm"/>`,
        only(3),
      );
    }
  });

  const H = Math.max(groupedBottom, origBottom) + 34;
  const resultH = RT + RH * (passing.length + 1) + 30;
  return { els, H, resultH };
}

for (const ds of DATASETS) {
  const dir = join(OUT, ds.dir, 'img');
  mkdirSync(dir, { recursive: true });
  const { els, H, resultH } = buildScene(ds);
  FILES.forEach((f, p) => writeFileSync(join(dir, `${f}.svg`), renderStatic(W, p === 4 ? resultH : H, TITLES[p], els, p)));
  const title = 'Animație: cum funcționează GROUP BY, funcțiile de agregare și HAVING';
  writeFileSync(join(dir, 'group_by_animatie.svg'), renderAnimated({ W, H, title, els, steps: STEPS, timeline: TIMELINE }));
  console.log('wrote', dir);
}
