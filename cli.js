/* cli.js — a small terminal tool over the consonance library.
 *
 * Usage:
 *   node cli.js "<sequence>" [options]
 *
 * The sequence is ratios ("3/2 4/3 5/3 5/4") or note names ("G F A E").
 * Quote it, or just list the tokens:  node cli.js 3/2 4/3 5/3 5/4
 *
 * Options:
 *   -t, --transform <word>   transformation word, e.g. "L L U", "s", "rev"
 *   -r, --reference <ratio>  tonic / global gauge, applied before the word
 *   -x, --transpose <ratio>  transpose the image, applied after the word
 *   -m, --mode <ratio|note>  force input mode (default: auto-detect)
 *   -k, --K <n>              neighbour depth for C_nn (default 3)
 *   -h, --help              show this help
 *
 * Examples:
 *   node cli.js 3/2 4/3 5/3 5/4
 *   node cli.js "3/2 4/3 5/3 5/4" --transform "L L U"
 *   node cli.js "1/1 5/4 3/2" --reference 3/2
 *   node cli.js "3/2 4/3 5/3 5/4" --transpose 3/2
 *   node cli.js "G F A E" -t "L L U" -x 5/4
 */

import { analyze } from "./consonance.js";

const args = process.argv.slice(2);
const opts = {};
let seq = null;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "-t" || a === "--transform")      opts.transform = args[++i];
  else if (a === "-r" || a === "--reference") opts.reference = args[++i];
  else if (a === "-x" || a === "--transpose") opts.transpose = args[++i];
  else if (a === "-m" || a === "--mode")      opts.mode = args[++i];
  else if (a === "-k" || a === "--K")         opts.K = Number(args[++i]);
  else if (a === "-h" || a === "--help")      { usage(); process.exit(0); }
  else if (seq === null)                      seq = a;        // first token of the sequence
  else                                        seq += " " + a; // allow unquoted tokens
}

if (seq === null) seq = "3/2 4/3 5/3 5/4"; // default if nothing passed

function usage() {
  console.log(`
Usage: node cli.js "<sequence>" [options]

  -t, --transform <word>   e.g. "L L U", "s", "rev"
  -r, --reference <ratio>  tonic / global gauge (before the word)
  -x, --transpose <ratio>  transpose the image (after the word)
  -m, --mode <ratio|note>  force input mode (default: auto)
  -k, --K <n>              neighbour depth for C_nn (default 3)
  -h, --help

Examples:
  node cli.js 3/2 4/3 5/3 5/4
  node cli.js "3/2 4/3 5/3 5/4" --transform "L L U"
  node cli.js "1/1 5/4 3/2" --reference 3/2 --transpose 5/4
`);
}

function printBlock(title, b) {
  const rootTag = b.frame
    ? `root ${b.frame.chordRoot}${b.frame.rootInChord ? " sounded" : " implied"}`
    : "";
  console.log(title);
  console.log("  ratios    ", b.ratios.join("  "));
  console.log("  address   ", b.notes.map(n => n.addressCompact).join("  "));
  console.log("  depth     ", b.notes.map(n => n.depth).join("  "));
  console.log("  12-TET    ", b.notes.map(n => n.tet.name).join("  "));
  console.log("  limit     ", b.notes.map(n => n.primeLimit).join("  "));
  if (b.frame) console.log("  frame     ", `${b.frame.left} ◁▷ ${b.frame.right}   (${rootTag})`);
  console.log("  C_nn^(3)  ", b.cnn.toFixed(4));
}

try {
  const r = analyze(seq, opts);

  console.log("─".repeat(64));
  console.log(`input      ${r.input}   (mode: ${r.mode})`);
  console.log(`reference  ${r.reference}    transform  ${r.transform ?? "—"}    transpose  ${r.transpose}`);
  console.log("─".repeat(64));

  printBlock("ORIGINAL", r);

  if (r.transformed) {
    console.log("─".repeat(64));
    printBlock("TRANSFORMED", r.transformed);
  }
  console.log("─".repeat(64));
} catch (err) {
  console.error("Error:", err.message);
  console.error('Run "node cli.js --help" for usage.');
  process.exit(1);
}
