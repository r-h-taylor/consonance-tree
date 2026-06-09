/* tools/best_scale.mjs
 * Find the most internally-consonant n-note scale (bounded by 1/1 and 2/1)
 * drawing pitches from the Stern-Brocot octave subtree up to a given depth.
 *
 * C_nn^(3) only couples notes within 3 scale-steps, so the optimum can be
 * found by a beam search over the sorted pitch pool rather than brute force.
 *
 *   node tools/best_scale.mjs [depth] [noteCount] [beam]
 *     depth      max Stern-Brocot address depth for the pitch pool (default 10)
 *     noteCount  notes per scale, including 1/1 and 2/1 (default 8)
 *     beam       beam width; larger is more thorough but slower (default 8000)
 *
 * Companion to The Consonance Tree.
 */
import { addrToFrac, fpm, analyze } from "../consonance.js";

function octavePool(D) {
  const out = [];
  for (let len = 0; len <= D - 2; len++)
    for (let m = 0; m < (1 << len); m++) {
      let suf = "";
      for (let b = len - 1; b >= 0; b--) suf += ((m >> b) & 1) ? "R" : "L";
      const addr = "RL" + suf;
      const [n, d] = addrToFrac(addr);
      out.push({ addr, n, d, val: n / d, depth: addr.length });
    }
  out.sort((a, b) => a.val - b.val);
  return out;
}
const F = (p, q) => fpm([p.n, p.d], [q.n, q.d]);

export function bestScale(pool, noteCount, beam) {
  const interior = noteCount - 2;
  const w1 = 1 / (noteCount - 1), w2 = 1 / (noteCount - 2), w3 = 1 / (noteCount - 3);
  const ONE = { n: 1, d: 1 }, TWO = { n: 2, d: 1 };
  let states = [{ tail: [ONE], lastPi: -1, s1: 0, s2: 0, s3: 0, picks: [] }];
  for (let step = 0; step < interior; step++) {
    const next = [];
    for (const st of states)
      for (let pi = st.lastPi + 1; pi < pool.length - (interior - 1 - step); pi++) {
        const d = pool[pi], t = st.tail, L = t.length;
        next.push({
          tail: [...t, d].slice(-3), lastPi: pi,
          s1: st.s1 + F(t[L - 1], d),
          s2: st.s2 + (L >= 2 ? F(t[L - 2], d) : 0),
          s3: st.s3 + (L >= 3 ? F(t[L - 3], d) : 0),
          picks: [...st.picks, d],
        });
      }
    next.sort((a, b) => (b.s1 * w1 + b.s2 * w2 + b.s3 * w3) - (a.s1 * w1 + a.s2 * w2 + a.s3 * w3));
    states = next.slice(0, beam);
  }
  let best = null;
  for (const st of states) {
    const t = st.tail, L = t.length, d = TWO;
    const s1 = st.s1 + F(t[L - 1], d), s2 = st.s2 + (L >= 2 ? F(t[L - 2], d) : 0), s3 = st.s3 + (L >= 3 ? F(t[L - 3], d) : 0);
    const cnn = s1 * w1 + s2 * w2 + s3 * w3;
    if (!best || cnn > best.cnn) best = { cnn, picks: st.picks };
  }
  return best;
}

const depth = Number(process.argv[2]) || 10;
const noteCount = Number(process.argv[3]) || 8;
const beam = Number(process.argv[4]) || 8000;

const pool = octavePool(depth);
const r = bestScale(pool, noteCount, beam);
const scale = ["1/1", ...r.picks.map(p => `${p.n}/${p.d}`), "2/1"];
const verified = analyze(scale).cnn;

console.log(`Most consonant ${noteCount}-note scale, pitches up to depth ${depth} (pool ${pool.length}, beam ${beam}):`);
console.log("  " + scale.join("  "));
console.log(`  C_nn = ${r.cnn.toFixed(4)}  (verified via analyze: ${verified.toFixed(4)})`);
console.log("  pitch depths: " + r.picks.map(p => p.depth).join("  ") + `  (max ${Math.max(...r.picks.map(p => p.depth))})`);
