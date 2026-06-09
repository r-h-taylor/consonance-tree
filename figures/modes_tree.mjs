/* figures/modes_tree.mjs
 * Self-contained SVG generator for the "modes on the octave subtree" figure,
 * for any tree depth. Companion to The Consonance Tree.
 *
 *   node figures/modes_tree.mjs [depth] [noteCount] [topN] [cols] > modes.svg
 *     depth      max Stern-Brocot address depth for octave pitches (default 4)
 *     noteCount  notes per mode incl. 1/1 and 2/1 (default 8)
 *     topN       max panels, ranked by consonance (default 12; all if fewer)
 *     cols       panels per row (default 4)
 * Panels widen and node dots shrink automatically as the tree deepens.
 * SELF-CONTAINED
 */
import { analyze, addrToFrac } from "../consonance.js";

const R_END = 8;
const NODE_FILL = "#5dcaa5", NODE_STROKE = "#0f6e56";
const END_FILL = "#d3d1c7", END_STROKE = "#5f5e5a";
const EDGE = "#9c9a92", TRAJ = "#1d9e75";
const TEXT_MAIN = "#2c2c2a", TEXT_SUB = "#5f5e5a", BG = "#ffffff";
const FONT = "Helvetica, Arial, sans-serif";
const LEAF_X0 = 18, Y_TOP = 42, Y_BOT = 138, CELL_H = 200;

function subtreeNodes(D) {
  const nodes = [];
  for (let len = 0; len <= D - 2; len++)
    for (let m = 0; m < (1 << len); m++) {
      let suf = "";
      for (let b = len - 1; b >= 0; b--) suf += ((m >> b) & 1) ? "R" : "L";
      const addr = "RL" + suf;
      const [a, b] = addrToFrac(addr);
      nodes.push({ addr, depth: addr.length, r: `${a}/${b}`, val: a / b });
    }
  return nodes;
}

function layout(D) {
  const nodes = subtreeNodes(D);
  const byAddr = Object.fromEntries(nodes.map(n => [n.addr, n]));
  const leaves = nodes.filter(n => n.depth === D).sort((a, b) => a.val - b.val);
  const nL = leaves.length;
  const innerSpan = Math.max(124, (nL - 1) * 14);
  const LEAF_X1 = LEAF_X0 + innerSpan;
  const spacing = nL > 1 ? innerSpan / (nL - 1) : innerSpan;
  const rNode = Math.max(4, Math.min(6, Math.floor(spacing * 0.42)));
  const cellW = Math.round(LEAF_X1 + 24);
  leaves.forEach((n, i) => n.x = nL === 1 ? (LEAF_X0 + LEAF_X1) / 2 : LEAF_X0 + i * spacing);
  for (let dd = D - 1; dd >= 2; dd--)
    nodes.filter(n => n.depth === dd).forEach(n => { n.x = (byAddr[n.addr + "L"].x + byAddr[n.addr + "R"].x) / 2; });
  const yOf = dd => D === 2 ? Y_TOP : Y_TOP + (dd - 2) * (Y_BOT - Y_TOP) / (D - 2);
  nodes.forEach(n => n.y = yOf(n.depth));
  return { nodes, byAddr, LEAF_X1, rNode, cellW };
}

function* combos(arr, k) {
  const n = arr.length;
  if (k > n) return;
  const idx = Array.from({ length: k }, (_, i) => i);
  while (true) {
    yield idx.map(i => arr[i]);
    let i = k - 1;
    while (i >= 0 && idx[i] === i + n - k) i--;
    if (i < 0) return;
    idx[i]++;
    for (let j = i + 1; j < k; j++) idx[j] = idx[j - 1] + 1;
  }
}
function choose(n, k) { let r = 1; for (let i = 0; i < k; i++) r = r * (n - i) / (i + 1); return Math.round(r); }

export function modesFigureSVG(depth = 4, noteCount = 8, topN = 12, cols = 4) {
  const interior = noteCount - 2;
  const { nodes, byAddr, LEAF_X1, rNode, cellW } = layout(depth);
  if (interior < 1 || interior > nodes.length)
    throw new Error(`noteCount ${noteCount} needs ${interior} interior pitches; depth ${depth} has ${nodes.length}`);
  const total = choose(nodes.length, interior);
  if (total > 3_000_000) throw new Error(`${total} modes is too many to rank; lower the depth or note count`);
  if (total > 150_000) console.error(`Ranking ${total.toLocaleString()} modes — this may take a few seconds...`);

  // stream every combination, keep only the top N by consonance (O(topN) memory)
  let top = [];
  for (const inc of combos(nodes, interior)) {
    const incSorted = inc.slice().sort((a, b) => a.val - b.val);
    const seq = ["1/1", ...incSorted.map(p => p.r), "2/1"];
    const cnn = analyze(seq).cnn;
    if (top.length < topN) { top.push({ inc: incSorted, cnn }); }
    else {
      let mi = 0;
      for (let j = 1; j < top.length; j++) if (top[j].cnn < top[mi].cnn) mi = j;
      if (cnn > top[mi].cnn) top[mi] = { inc: incSorted, cnn };
    }
  }
  top.sort((a, b) => b.cnn - a.cnn);

  const root = byAddr["RL"];
  const END_L = { x: LEAF_X0 - 2, y: Y_TOP - 28 }, END_R = { x: LEAF_X1 + 2, y: Y_TOP - 28 };
  const edges = nodes.filter(n => n.depth > 2).map(n => [byAddr[n.addr.slice(0, -1)], n]);
  const cx = (LEAF_X0 + LEAF_X1) / 2;

  const rows = Math.ceil(top.length / cols);
  const W = cols * cellW, H = rows * CELL_H + 24;
  const X = (ox, dx) => ox + dx, Y = (oy, dy) => oy + dy;

  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">\n`;
  s += `<title>Modes on the octave subtree (depth ${depth})</title>\n`;
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="${BG}"/>\n`;

  top.forEach((m, i) => {
    const ox = (i % cols) * cellW + 14, oy = Math.floor(i / cols) * CELL_H + 24;
    for (const [p, c] of edges)
      s += `<line x1="${X(ox,p.x)}" y1="${Y(oy,p.y)}" x2="${X(ox,c.x)}" y2="${Y(oy,c.y)}" stroke="${EDGE}" stroke-width="0.6" opacity="0.5"/>\n`;
    for (const e of [END_L, END_R])
      s += `<line x1="${X(ox,e.x)}" y1="${Y(oy,e.y)}" x2="${X(ox,root.x)}" y2="${Y(oy,root.y)}" stroke="${EDGE}" stroke-width="0.6" stroke-dasharray="3 3" fill="none" opacity="0.7"/>\n`;
    const incSet = new Set(m.inc.map(p => p.addr));
    const pts = [END_L, ...m.inc, END_R].map(p => `${X(ox,p.x)},${Y(oy,p.y)}`).join(" ");
    s += `<polyline points="${pts}" fill="none" stroke="${TRAJ}" stroke-width="1.5" opacity="0.9" stroke-linejoin="round"/>\n`;
    for (const e of [END_L, END_R])
      s += `<circle cx="${X(ox,e.x)}" cy="${Y(oy,e.y)}" r="${R_END}" fill="${END_FILL}" stroke="${END_STROKE}" stroke-width="0.6"/>\n`;
    for (const p of nodes) {
      if (incSet.has(p.addr))
        s += `<circle cx="${X(ox,p.x)}" cy="${Y(oy,p.y)}" r="${rNode}" fill="${NODE_FILL}" stroke="${NODE_STROKE}" stroke-width="0.6"/>\n`;
      else
        s += `<circle cx="${X(ox,p.x)}" cy="${Y(oy,p.y)}" r="${rNode}" fill="none" stroke="${EDGE}" stroke-width="1" stroke-dasharray="2 2"/>\n`;
    }
    const omittedCount = nodes.length - m.inc.length;
    if (omittedCount === 1) {
      const om = nodes.find(p => !incSet.has(p.addr));
      s += `<text x="${X(ox,cx)}" y="${Y(oy,168)}" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="600" fill="${TEXT_MAIN}">omit ${om.r}</text>\n`;
      s += `<text x="${X(ox,cx)}" y="${Y(oy,184)}" text-anchor="middle" font-family="${FONT}" font-size="12" fill="${TEXT_SUB}">C_nn ${m.cnn.toFixed(3)}</text>\n`;
    } else {
      s += `<text x="${X(ox,cx)}" y="${Y(oy,176)}" text-anchor="middle" font-family="${FONT}" font-size="13" font-weight="600" fill="${TEXT_MAIN}">C_nn ${m.cnn.toFixed(3)}</text>\n`;
    }
  });
  s += `</svg>`;
  return s;
}

const depth = Number(process.argv[2]) || 4;
const noteCount = Number(process.argv[3]) || 8;
const topN = Number(process.argv[4]) || 12;
const cols = Number(process.argv[5]) || 4;
console.log(modesFigureSVG(depth, noteCount, topN, cols));
