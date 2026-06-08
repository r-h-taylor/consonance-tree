/* =====================================================================
   consonance.js — the engine behind The Consonance Tree, as a library.

   Pure, dependency-free, no DOM. Runs in the browser (as an ES module)
   and in Node. The same math the web tool uses, exposed for scripting.

   Quick start:

     import { analyze, analyzeBatch } from "./consonance.js";

     analyze(["3/2", "4/3", "5/3", "5/4"]);
     analyze("G F A E", { mode: "note" });
     analyze("3/2 4/3 5/3 5/4", { transform: "L L U" });
     analyzeBatch([ ["3/2","4/3"], ["7/4","11/8","13/8"] ]);

   Companion to the paper "A Structure of Harmonic Relations" by
   Richard Taylor. MIT License.
   ===================================================================== */

"use strict";

/* ---------- exact rational arithmetic ---------- */
export function gcd(a, b){ a=Math.abs(a); b=Math.abs(b); while(b){ [a,b]=[b,a%b]; } return a; }
export function reduce(n, d){ const g=gcd(n,d)||1; return [n/g, d/g]; }

/* ---------- full Stern–Brocot tree on Q_{>0} ----------
   Boundaries 0/1 (left) and 1/0 (right). Root 1/1, address "" (ε).
   Each address w ∈ {L,R}* uniquely identifies a reduced positive rational. */
export function addrToFrac(addr){
  let ln=0, ld=1, rn=1, rd=0, n=1, d=1;
  for(const ch of addr){
    if(ch==='L'){ rn=n; rd=d; n=ln+n; d=ld+d; }
    else        { ln=n; ld=d; n=n+rn; d=d+rd; }
  }
  return [n, d];
}
export function fracToAddr(n, d, maxd=60){
  let ln=0, ld=1, rn=1, rd=0, cn=1, cd=1, addr="";
  for(let i=0; i<maxd; i++){
    const cmp = n*cd - cn*d;
    if(cmp===0) return addr;
    if(cmp<0){ addr+='L'; rn=cn; rd=cd; cn=ln+cn; cd=ld+cd; }
    else     { addr+='R'; ln=cn; ld=cd; cn=cn+rn; cd=cd+rd; }
  }
  return addr;
}
export function depth(addr){ return addr.length; }

/* ---------- operators on trajectories ----------
   Anchor-shifting (L, R, U): move the deepest common ancestor of the
   nodes, preserving each node's position relative to it.
   Pointwise (S, V): act on each address independently. S (σ) swaps L↔R
   (reflection across 1/1); V (rev) reverses each address. */
export function commonPrefix(addrs){
  if(!addrs.length) return "";
  let p = addrs[0];
  for(let i=1; i<addrs.length; i++){
    let j=0;
    while(j<p.length && j<addrs[i].length && p[j]===addrs[i][j]) j++;
    p = p.slice(0, j);
    if(!p) break;
  }
  return p;
}
export function applyOpToTrajectory(opTok, addrs){
  if(opTok==='S') return addrs.map(a => a.replace(/[LR]/g, c => c==='L' ? 'R' : 'L'));
  if(opTok==='V') return addrs.map(a => a.split('').reverse().join(''));
  const anchor = commonPrefix(addrs);
  let newAnchor;
  if(opTok==='L')      newAnchor = anchor + "L";
  else if(opTok==='R') newAnchor = anchor + "R";
  else if(opTok==='U') newAnchor = anchor.length ? anchor.slice(0, -1) : anchor;
  else                 newAnchor = anchor;
  return addrs.map(a => newAnchor + a.slice(anchor.length));
}
export function applyWord(word, addrs){
  let cur = addrs.slice();
  for(const t of word) cur = applyOpToTrajectory(t, cur);
  return cur;
}

/* ---------- note names <-> ratio (5-limit JI, C = 1/1 root) ---------- */
const NOTE_SEMITONE = {C:0,"C#":1,DB:1,D:2,"D#":3,EB:3,E:4,F:5,"F#":6,GB:6,G:7,"G#":8,AB:8,A:9,"A#":10,BB:10,B:11};
const SEMI_NAME = ["C","C♯","D","E♭","E","F","F♯","G","A♭","A","B♭","B"];
const JI_BY_SEMITONE = {0:[1,1],1:[16,15],2:[9,8],3:[6,5],4:[5,4],5:[4,3],6:[7,5],7:[3,2],8:[8,5],9:[5,3],10:[9,5],11:[15,8]};

export function noteToRatio(tok){
  const m = String(tok).trim().toUpperCase().replace('♯','#').replace('♭','B');
  if(!(m in NOTE_SEMITONE)) return null;
  const semi = NOTE_SEMITONE[m];
  const [a, b] = JI_BY_SEMITONE[semi % 12];
  return reduce(a, b);
}

/* ---------- 12-TET analysis ---------- */
export function cents(n, d){ return 1200 * Math.log2(n / d); }
export function nearest12(n, d){
  const c = cents(n, d);
  const semi = Math.round(c / 100);
  const dev = c - semi * 100;
  const name = SEMI_NAME[((semi % 12) + 12) % 12];
  const oct = Math.floor(semi / 12);
  const octTag = oct === 0 ? "" : (oct > 0 ? "↑"+oct : "↓"+(-oct));
  return { name: name + octTag, dev, semi };
}
export function primeLimit(n, d){
  let m = n * d, lim = 1, p = 2;
  while(p*p <= m){ while(m % p === 0){ lim = Math.max(lim, p); m /= p; } p++; }
  if(m > 1) lim = Math.max(lim, m);
  return lim;
}

/* ---------- consonance metrics ----------
   C(a,b) = (a+b)/(2ab); bidirectional pair consonance f^pm; internal
   C_nn^(K) sums neighbour-distance means up to K. */
export function consonanceC(n, d){ const g=gcd(n,d)||1; n=n/g; d=d/g; return (n+d)/(2*n*d); }
export function fpm(ri, rj){
  const [ain, aid] = ri, [bjn, bjd] = rj;
  const upN = bjn*aid, upD = bjd*ain;       // rj / ri
  const dnN = 2*ain*bjd, dnD = aid*bjn;     // 2 * ri / rj
  return consonanceC(upN, upD) + consonanceC(dnN, dnD);
}
export function Cnn(seq, K=3){
  const n = seq.length;
  if(n < 2) return 0;
  let total = 0;
  for(let k=1; k<=Math.min(K, n-1); k++){
    let sum=0, cnt=0;
    for(let i=0; i<n-k; i++){ sum += fpm(seq[i], seq[i+k]); cnt++; }
    if(cnt) total += sum / cnt;
  }
  return total;
}

/* ---------- harmonic frame ---------- */
export function harmonicFrame(addrs){
  if(!addrs.length) return null;
  const A = commonPrefix(addrs);
  let ln=0, ld=1, rn=1, rd=0, cn=1, cd=1;
  for(const ch of A){
    if(ch==='L'){ rn=cn; rd=cd; cn=ln+cn; cd=ld+cd; }
    else        { ln=cn; ld=cd; cn=cn+rn; cd=cd+rd; }
  }
  const [rootN, rootD] = (A === "") ? [1,1] : [cn, cd];
  return { Lnum:ln, Lden:ld, Rnum:rn, Rden:rd, chordRoot:A, rootN, rootD, rootInChord: addrs.includes(A) };
}

/* ---------- input parsing ---------- */
function tokenize(input){
  if(Array.isArray(input)) return input.map(x => String(x).trim()).filter(Boolean);
  return String(input).split(/[\s,]+/).filter(Boolean);
}
function detectMode(tokens){
  // a leading note letter (A–G, optional accidental) with no digit/slash → notes
  return tokens.length && /^[A-Ga-g][#b♯♭]?$/.test(tokens[0]) ? "note" : "ratio";
}
function parseTokens(tokens, mode){
  const out = [];
  for(const t of tokens){
    let n, d;
    if(mode === "note"){
      const r = noteToRatio(t);
      if(!r) throw new Error(`"${t}" is not a note name`);
      [n, d] = r;
    } else {
      if(t.includes('/')){ const [a,b] = t.split('/').map(Number); n=a; d=b; }
      else { const v = parseFloat(t); if(Number.isNaN(v)) throw new Error(`"${t}" is not a ratio`); n=Math.round(v*10000); d=10000; }
      if(!n || !d || n<=0 || d<=0) throw new Error(`"${t}" is not a valid ratio`);
    }
    out.push(reduce(n, d));
  }
  if(!out.length) throw new Error("empty sequence");
  return out;
}

/** Parse a transformation word ("L L U", "s", "rev", or an array) into tokens. */
export function parseWord(word){
  const toks = Array.isArray(word) ? word : String(word).split(/[\s,]+/);
  const out = [];
  for(let t of toks){
    t = String(t).toLowerCase();
    if(t==='l') out.push('L');
    else if(t==='r') out.push('R');
    else if(t==='↑'||t==='u'||t==='up'||t==='ascend'||t==='^') out.push('U');
    else if(t==='σ'||t==='s'||t==='sigma'||t==='reflect') out.push('S');
    else if(t==='rev'||t==='v'||t==='reverse') out.push('V');
  }
  return out;
}

/* ---------- the public describe/analyze surface ---------- */
function describe(seq, K){
  const addrs = seq.map(([n,d]) => fracToAddr(n,d));
  const f = harmonicFrame(addrs);
  return {
    ratios: seq.map(([n,d]) => `${n}/${d}`),
    notes: seq.map(([n,d], i) => {
      const t = nearest12(n,d);
      return {
        ratio: [n,d],
        ratioStr: `${n}/${d}`,
        address: addrs[i] === "" ? "ε" : addrs[i],
        depth: depth(addrs[i]),
        cents: cents(n,d),
        tet: t,
        primeLimit: primeLimit(n,d)
      };
    }),
    frame: f ? {
      left:  (f.Lnum===0 && f.Lden===1) ? "0" : `${f.Lnum}/${f.Lden}`,
      right: (f.Rden===0) ? "∞" : `${f.Rnum}/${f.Rden}`,
      chordRoot: `${f.rootN}/${f.rootD}`,
      chordRootAddress: f.chordRoot === "" ? "ε" : f.chordRoot,
      rootInChord: f.rootInChord
    } : null,
    cnn: Cnn(seq, K)
  };
}

/**
 * Analyze one sequence.
 * @param {string|string[]} sequence  e.g. "3/2 4/3 5/3 5/4" or ["G","F","A","E"]
 * @param {object} [options]
 * @param {"ratio"|"note"|"auto"} [options.mode="auto"]
 * @param {string|string[]} [options.transform]  e.g. "L L U", "s", "rev"
 * @param {number} [options.K=3]  neighbour depth for the internal consonance
 * @returns {object} analysis (see README / example.js for shape)
 */
export function analyze(sequence, options = {}){
  const { transform = null, K = 3 } = options;
  let mode = options.mode || "auto";
  const tokens = tokenize(sequence);
  if(mode === "auto") mode = detectMode(tokens);

  const seq = parseTokens(tokens, mode);
  const word = transform ? parseWord(transform) : [];

  const result = describe(seq, K);
  result.input = Array.isArray(sequence) ? sequence.join(" ") : String(sequence);
  result.mode = mode;
  result.transform = word.length ? word.join(" ") : null;

  if(word.length){
    const tAddrs = applyWord(word, seq.map(([n,d]) => fracToAddr(n,d)));
    const tSeq = tAddrs.map(a => addrToFrac(a));
    result.transformed = describe(tSeq, K);
  } else {
    result.transformed = null;
  }
  return result;
}

/** Analyze many sequences at once. Same options applied to each. */
export function analyzeBatch(sequences, options = {}){
  return sequences.map(s => analyze(s, options));
}

export default { analyze, analyzeBatch, parseWord };
