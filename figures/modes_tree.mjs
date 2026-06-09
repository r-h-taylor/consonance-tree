/* figures/modes_tree.mjs
 *
 * Generates the "modes on the octave subtree" figure: small-multiple
 * Stern-Brocot octave subtrees (depth 4), one panel per mode, each showing the
 * trajectory through the pitches it keeps with the omitted pitch hollow,
 * ranked by internal consonance C_nn.
 *
 * Emits a SELF-CONTAINED SVG (all colors/fonts inline) so it renders the same
 * in a browser, Preview, Inkscape, or a LaTeX pipeline — no external styles.
 *
 * Style spec (locked):
 *   - octave subtree to depth 4: the 7 pitches 5/4 4/3 7/5 3/2 8/5 5/3 7/4
 *   - gray endpoint nodes (1/1, 2/1), radius 8, placed just OUTSIDE the outer
 *     leaves so panels flare outward rather than taper in
 *   - teal pitch nodes, radius 6; omitted pitch drawn as a dashed hollow ring
 *   - green trajectory through 1/1 -> kept pitches -> 2/1
 *   - dashed frame leaders from each endpoint to the 3/2 root
 *
 * Usage:
 *   node figures/modes_tree.mjs [noteCount] [cols] > modes.svg
 *     noteCount  total notes per mode incl. 1/1 and 2/1 (default 8 -> 6 interior)
 *     cols       panels per row (default 4)
 *
 * Companion to The Consonance Tree.
 */

import { analyze } from "../consonance.js";

const NODES = [
  { r: "5/4", x: 18,  y: 138 },
  { r: "4/3", x: 38,  y: 90  },
  { r: "7/5", x: 58,  y: 138 },
  { r: "3/2", x: 80,  y: 42  },
  { r: "8/5", x: 102, y: 138 },
  { r: "5/3", x: 122, y: 90  },
  { r: "7/4", x: 142, y: 138 },
];
const POS = Object.fromEntries(NODES.map(n => [n.r, n]));
const END_L = { r: "1/1", x: 16,  y: 14 };
const END_R = { r: "2/1", x: 144, y: 14 };
const SKEL = [["3/2","4/3"],["3/2","5/3"],["4/3","5/4"],["4/3","7/5"],["5/3","8/5"],["5/3","7/4"]];

const R_NODE = 6, R_END = 8;
const NODE_FILL = "#5dcaa5", NODE_STROKE = "#0f6e56";   // teal
const END_FILL = "#d3d1c7", END_STROKE = "#5f5e5a";     // gray
const EDGE = "#9c9a92", TRAJ = "#1d9e75";
const TEXT_MAIN = "#2c2c2a", TEXT_SUB = "#5f5e5a", BG = "#ffffff";
const FONT = "Helvetica, Arial, sans-serif";
const CELL_W = 166, CELL_H = 200;

function combinations(arr, k) {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  const [head, ...tail] = arr;
  return [...combinations(tail, k - 1).map(c => [head, ...c]), ...combinations(tail, k)];
}

export function modesFigureSVG(noteCount = 8, cols = 4) {
  const interior = noteCount - 2;
  if (interior < 1 || interior > NODES.length)
    throw new Error(`noteCount ${noteCount} needs ${interior} interior pitches; depth-4 has ${NODES.length}`);

  const val = s => { const [n, d] = s.split("/").map(Number); return n / d; };
  const modes = combinations(NODES, interior).map(inc => {
    const incSorted = inc.slice().sort((a, b) => val(a.r) - val(b.r));
    const seq = ["1/1", ...incSorted.map(p => p.r), "2/1"];
    const omitted = NODES.filter(p => !inc.includes(p)).map(p => p.r);
    return { inc: incSorted, omitted, seq, cnn: analyze(seq).cnn };
  });
  modes.sort((a, b) => b.cnn - a.cnn);

  const rows = Math.ceil(modes.length / cols);
  const W = cols * CELL_W, H = rows * CELL_H + 24;
  const X = (ox, dx) => ox + dx, Y = (oy, dy) => oy + dy;
  const label = m => m.omitted.length === 1 ? `omit ${m.omitted[0]}` : `keep ${m.inc.length}`;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">\n`;
  s += `<title>Modes on the octave subtree (depth 4)</title>\n`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="${BG}"/>\n`;

  modes.forEach((m, i) => {
    const ox = (i % cols) * CELL_W + 14;
    const oy = Math.floor(i / cols) * CELL_H + 24;
    for (const [a, b] of SKEL)
      s += `<line x1="${X(ox,POS[a].x)}" y1="${Y(oy,POS[a].y)}" x2="${X(ox,POS[b].x)}" y2="${Y(oy,POS[b].y)}" stroke="${EDGE}" stroke-width="0.6" opacity="0.5"/>\n`;
    for (const e of [END_L, END_R])
      s += `<line x1="${X(ox,e.x)}" y1="${Y(oy,e.y)}" x2="${X(ox,POS["3/2"].x)}" y2="${Y(oy,POS["3/2"].y)}" stroke="${EDGE}" stroke-width="0.6" stroke-dasharray="3 3" fill="none" opacity="0.7"/>\n`;
    const pts = [END_L, ...m.inc, END_R].map(p => `${X(ox,p.x)},${Y(oy,p.y)}`).join(" ");
    s += `<polyline points="${pts}" fill="none" stroke="${TRAJ}" stroke-width="1.5" opacity="0.9" stroke-linejoin="round"/>\n`;
    for (const e of [END_L, END_R])
      s += `<circle cx="${X(ox,e.x)}" cy="${Y(oy,e.y)}" r="${R_END}" fill="${END_FILL}" stroke="${END_STROKE}" stroke-width="0.6"/>\n`;
    for (const p of NODES) {
      if (m.omitted.includes(p.r))
        s += `<circle cx="${X(ox,p.x)}" cy="${Y(oy,p.y)}" r="${R_NODE}" fill="none" stroke="${EDGE}" stroke-width="1" stroke-dasharray="2 2"/>\n`;
      else
        s += `<circle cx="${X(ox,p.x)}" cy="${Y(oy,p.y)}" r="${R_NODE}" fill="${NODE_FILL}" stroke="${NODE_STROKE}" stroke-width="0.6"/>\n`;
    }
    s += `<text x="${X(ox,80)}" y="${Y(oy,168)}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="600" fill="${TEXT_MAIN}">${label(m)}</text>\n`;
    s += `<text x="${X(ox,80)}" y="${Y(oy,184)}" text-anchor="middle" font-family="${FONT}" font-size="12" fill="${TEXT_SUB}">C_nn ${m.cnn.toFixed(3)}</text>\n`;
  });

  s += `</svg>`;
  return s;
}

const noteCount = Number(process.argv[2]) || 8;
const cols = Number(process.argv[3]) || 4;
console.log(modesFigureSVG(noteCount, cols));
