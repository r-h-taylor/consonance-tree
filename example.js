/* example.js — run with:  node example.js
   Demonstrates the library chewing through many different sequences at once. */

import { analyze, analyzeBatch } from "./consonance.js";

// Any sequences you like — ratios, note names, any prime limit, any length.
const sequences = [
  ["3/2", "4/3", "5/3", "5/4"],                       // four consonances
  ["7/4", "11/8", "13/8"],                            // 7-, 11-, 13-limit
  ["G", "F", "A", "E"],                               // note names
  ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"], // just major scale
];

// One call, every sequence, same transform applied to each:
const results = analyzeBatch(sequences, { transform: "L L U" });

for(const r of results){
  console.log("─".repeat(60));
  console.log(`input:      ${r.input}   (${r.mode})`);
  console.log(`addresses:  ${r.notes.map(x => x.address).join("  ")}`);
  console.log(`nearest TET ${r.notes.map(x => x.tet.name).join("  ")}`);
  console.log(`frame:      ${r.frame.left} ◁ ▷ ${r.frame.right}   root ${r.frame.chordRoot}`);
  console.log(`C_nn^(3):   ${r.cnn.toFixed(4)}`);
  if(r.transformed){
    console.log(`→ ${r.transform}:  ${r.transformed.ratios.join("  ")}   C_nn^(3) = ${r.transformed.cnn.toFixed(4)}`);
  }
}
console.log("─".repeat(60));

// A single sequence, full object:
console.log("\nfull analysis of one sequence:\n");
console.log(JSON.stringify(analyze("1/1 5/4 3/2"), null, 2));
