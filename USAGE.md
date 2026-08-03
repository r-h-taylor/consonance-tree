# Using the Consonance Library

`consonance.js` is the engine behind [The Consonance Tree](index.html), packaged
as a small, dependency-free module you can call from your own scripts. It runs
in the browser (as an ES module) and in Node, and accepts anything the web
tool's input box accepts — any just-intonation ratios, any note names, any
length, any transformation word.

This page documents how to use it programmatically. For the interactive tool,
just open `index.html`.

---

## Setup

The library is a single file, `consonance.js`, with no dependencies and no build
step. The repo also ships a runnable demo (`example.js`) and a one-line
`package.json` that tells Node to treat the `.js` files as ES modules.

**In Node** (v18 or later):

```bash
node example.js
```

Keep `consonance.js`, `example.js`, and `package.json` in the same folder. The
`package.json` containing `"type": "module"` is what lets `import` work; if you
drop `consonance.js` into an existing project, make sure that project is also set
up for ES modules (a `"type": "module"` in its `package.json`, or a `.mjs`
extension).

**In the browser**, load it as a module:

```html
<script type="module">
  import { analyze, analyzeBatch } from "./consonance.js";
  console.log(analyze("3/2 4/3 5/3 5/4"));
</script>
```

---

## Running in the terminal

The library runs from the command line with [Node.js](https://nodejs.org). No
server, no browser — just a terminal.

**1. Check that Node is installed.** Open a terminal and run:

```bash
node --version
```

If you see a version number (v18 or later), you're ready. If you get
`command not found`, install Node first — download the installer from
[nodejs.org](https://nodejs.org), or on macOS with [Homebrew](https://brew.sh):

```bash
brew install node
```

**2. Get the files in one folder.** `consonance.js`, `example.js`, and
`package.json` need to sit side by side. Move them into a working folder and
`cd` into it:

```bash
cd path/to/your/folder
```

**3. Run the demo:**

```bash
node example.js
```

You'll get a table of addresses, nearest 12-TET notes, harmonic frames, and
C_nn values for each sequence.

**4. Run your own script.** Create a file in the same folder — say
`mine.js` — that imports the library:

```js
// mine.js
import { analyze, analyzeBatch } from "./consonance.js";

const results = analyzeBatch([
  ["3/2", "4/3", "5/3", "5/4"],
  ["7/4", "11/8", "13/8"],
], { transform: "L L U" });

for (const r of results) {
  console.log(r.input, "→ C_nn =", r.cnn.toFixed(4));
}
```

then run it:

```bash
node mine.js
```

**Quick one-off.** To analyze something without writing a file, use Node's
`-e` flag (the `--input-type=module` makes `import` work):

```bash
node --input-type=module -e 'import("./consonance.js").then(({analyze}) => console.log(analyze("3/2 4/3 5/3 5/4").cnn))'
```

---

## Quick start

```js
import { analyze, analyzeBatch } from "./consonance.js";

// a single sequence (ratios)
analyze(["3/2", "4/3", "5/3", "5/4"]);

// note names (auto-detected; C is the 1/1 root)
analyze("G F A E");

// apply a transformation
analyze("3/2 4/3 5/3 5/4", { transform: "L L U" });

// many sequences in one call, same options applied to each
analyzeBatch([
  ["3/2", "4/3", "5/3", "5/4"],
  ["7/4", "11/8", "13/8"],
  ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"],
], { transform: "rev" });
```

---

## API

### `analyze(sequence, options?)`

Analyzes one sequence and returns a result object (see [below](#the-result-object)).

| Argument | Type | Notes |
|---|---|---|
| `sequence` | `string` \| `string[]` | A space/comma-separated string (`"3/2 4/3"`) or an array of tokens (`["3/2","4/3"]`). |
| `options.mode` | `"ratio"` \| `"note"` \| `"auto"` | How to read the tokens. Default `"auto"`: notes if the first token looks like a note name (`A`–`G`, optional `#`/`b`), ratios otherwise. |
| `options.transform` | `string` \| `string[]` | A transformation word, e.g. `"L L U"`, `"s"`, `"rev"`. Applied left to right. Omit for no transform. |
| `options.reference` | `string` \| `[n,d]` | A reference pitch / tonic — any ratio (`"3/2"`), decimal, or note name (`"G"`). Every ratio is divided by it so it lands on `1/1`, **before** any transform. This is a global gauge: it moves the base sequence and its image together. Default `1/1` (no change). |
| `options.transpose` | `string` \| `[n,d]` | A transposition applied **after** the word, to the **image only** — divide the transformed sequence by it so it lands on `1/1`. Use it to transpose as part of the transformation; set with no `transform` to get the base sequence vs. its transposition. Default `1/1` (no change). |
| `options.K` | `number` | Neighbour depth for the internal consonance C_nn. Default `3`. |

### `analyzeBatch(sequences, options?)`

Maps `analyze` over an array of sequences, applying the same `options` to each.
Returns an array of result objects. This is the entry point for processing many
sequences at once.

### `parseWord(word)`

Parses a transformation word (string or array) into canonical operator tokens
(`["L","L","U"]`). Useful if you want to inspect or validate a word before
passing it in. Unknown tokens are ignored.

### `addrCompact(addr, threshold?)`

Run-length form of an address, for display: `"RLLLLLLL"` → `"RL⁷"`, `""` → `"ε"`.
Addresses at or below `threshold` characters (default 12) come back verbatim.
The run-length encoding is the continued fraction, so this is lossless — the
Pythagorean comma reads `RL⁷³R³L²RLRL²³R²L⁴` instead of 111 letters.

Lower-level building blocks are also exported for advanced use:
`fracToAddr`, `fracToAddrInfo`, `addrToFrac`, `applyWord`, `harmonicFrame`,
`Cnn`, `fpm`, `nearest12`, `primeLimit`, `cents`, `noteToRatio`, `reduce`,
`gcd`, `MAX_ADDRESS_DEPTH`.

---

## The result object

```js
{
  input: "3/2 4/3 5/3 5/4",   // echo of what you passed
  mode: "ratio",               // resolved mode (after auto-detection)
  reference: "1/1",            // tonic applied (every ratio divided by this)
  transform: "L L U",          // canonical word, or null if none
  transpose: "1/1",            // transposition applied to the image (after the word)

  ratios: ["3/2", "4/3", "5/3", "5/4"],

  notes: [                     // one entry per pitch, in sequence order
    {
      ratio: [3, 2],           // [numerator, denominator], reduced
      ratioStr: "3/2",
      address: "RL",           // Stern–Brocot address ("ε" for 1/1)
      addressCompact: "RL",    // run-length form for display; "RL⁷⁹" for 81/80
      depth: 2,                // length of the address
      cents: 701.955,          // cents above 1/1
      tet: { name: "G", dev: 1.955, semi: 7 },  // nearest 12-TET note,
                               // cents deviation, semitones above C
      primeLimit: 3
    }
    // ...
  ],

  frame: {                     // harmonic frame of the trajectory
    left: "1/1",               // left boundary (or "0")
    right: "2/1",              // right boundary (or "∞")
    chordRoot: "3/2",          // the chord root (rational at the anchor)
    chordRootAddress: "RL",
    rootInChord: true          // is the root actually one of the notes?
  },

  cnn: 1.3359,                 // internal consonance C_nn^(K)

  transformed: { /* ... */ }   // same shape as above for the image under
                               // `transform`, or null if no transform given
}
```

The `transformed` block carries its own `ratios`, `notes`, `frame`, and `cnn`,
computed on the image of the trajectory under the transformation.

---

## Transformations

A transformation word is a sequence of operator tokens applied left to right.
Tokens are case-insensitive and accept several spellings:

| Operator | Accepted tokens | Effect |
|---|---|---|
| `L` | `l` | Anchor-shift: descend left (deepest common ancestor → left child) |
| `R` | `r` | Anchor-shift: descend right |
| `U` | `u`, `up`, `↑`, `^`, `ascend` | Anchor-shift: ascend (anchor → parent). Partial: no effect once the anchor is `1/1`. |
| `σ` | `s`, `sigma`, `reflect` | Pointwise: swap L↔R in every address (reflect across 1/1) |
| `rev` | `rev`, `v`, `reverse` | Pointwise: reverse each address |

The anchor-shifting operators (`L`, `R`, `U`) move the whole trajectory as a
rigid shape by relocating its anchor (deepest common ancestor). `σ` and `rev`
act on each address independently, but differ in kind: the letter swap `σ` is a
monoid automorphism, so it maps the anchor to its mirror and preserves the
trajectory's structure, while `rev` is an anti-automorphism that turns the
common prefix into a common suffix and so destroys the anchor. All preserve the
relative depth profile; only `σ` preserves consonance.

Examples: `"L"`, `"R L"`, `"L L U"`, `"s"`, `"rev"`, `"s L"`.

---

## Notes on conventions

- **No octave reduction.** Every pitch sits at its honest position in the full
  Stern–Brocot tree, so `2/1` and `1/2` are distinct nodes, not folded into
  `1/1`.
- **Addresses are exact.** `fracToAddr(n, d)` runs to completion for any reduced
  positive rational — there is no silent depth cap. Addresses are deeper than
  they look: a node's depth is the sum of its continued-fraction quotients, so
  `81/80` (the syntonic comma) sits at depth 80 and `32805/32768` (the schisma)
  at depth 894. Pass an explicit `maxd` if you want a depth-limited approximant,
  and use `fracToAddrInfo(n, d, maxd)` to get `{addr, depth, exact}` so you can
  tell an approximant from an exact address. Non-integer or non-positive input
  throws, as does anything exceeding `MAX_ADDRESS_DEPTH` (100000).
- **Note names** use 5-limit just intonation with **C as the 1/1 root**
  (`C`=1/1, `E`=5/4, `G`=3/2, and so on). Accidentals `#`/`♯` and `b`/`♭` are
  accepted.
- **Consonance.** `cnn` is the internal consonance C_nn^(K). The sequence is
  first **sorted by pitch**, so that "k apart" means k scale-steps rather than k
  positions in the input; then for each neighbour distance `k` from 1 to `K` it
  averages a bidirectional pair-consonance kernel over all pairs that far apart
  and sums those means. Larger `K` includes more distant pairs. Sorting makes
  `cnn` a property of the pitch set, and is what makes `σ` an exact isometry.
- **Reference vs. transpose.** Both `reference` and `transpose` are transpositions
  (division by a rational), and both leave all interval content — and therefore
  `cnn` — unchanged; they only relocate where things sit on the tree and what is
  read as the root. They differ in *when* they apply: `reference` is a global
  gauge applied **before** the word, so it moves the base sequence and its image
  together; `transpose` is applied **after** the word, to the image only, so it
  acts as a transposition that is part of the transformation. `1/1` is the
  default for each — a free gauge choice, not a privileged tonic.
- The cross-pair score between a trajectory and its image is intentionally not
  reported here; it can be added if needed.

---

## A worked batch

```js
import { analyzeBatch } from "./consonance.js";

const results = analyzeBatch(
  [ ["3/2","4/3","5/3","5/4"], ["7/4","11/8","13/8"] ],
  { transform: "L L U" }
);

for (const r of results) {
  console.log(r.input, "→", r.transform);
  console.log("  addresses:", r.notes.map(n => n.address).join(" "));
  console.log("  C_nn^(3): ", r.cnn.toFixed(4),
              "→", r.transformed.cnn.toFixed(4));
}
```

See [`example.js`](example.js) for the full runnable demo.

---

Companion to the paper *A Structure of Harmonic Relations* (pending) by
[Richard Taylor](https://scholar.google.com/citations?user=N6dbY7QAAAAJ&hl=en).
Released under the MIT License.

---

## Figures

The `figures/` folder holds generators that emit self-contained SVG for the
paper. `modes_tree.mjs` draws the "modes on the octave subtree" small-multiples
figure for any tree depth:

```bash
node figures/modes_tree.mjs [depth] [noteCount] [topN] [cols] > modes.svg
```

| Argument | Meaning |
|---|---|
| `depth` | max Stern–Brocot address depth for the octave pitch pool (default 4 → 7 pitches; 5 → 15; 6 → 31) |
| `noteCount` | notes per mode, including the fixed 1/1 and 2/1 endpoints (default 8) |
| `topN` | how many panels to draw, ranked by consonance C_nn (default 12; all shown if fewer exist) |
| `cols` | panels per row (default 4) |

All four are optional; bare `node figures/modes_tree.mjs` reproduces the
depth-4 figure. Examples:

```bash
node figures/modes_tree.mjs              # depth-4 leave-one-out family (7 panels)
node figures/modes_tree.mjs 5 8 12 4     # depth 5, top 12 eight-note modes
node figures/modes_tree.mjs 5 7 20 5     # 7-note modes, top 20, 5 per row
```

The output is a standalone SVG — open it in a browser to view (`open -a Safari modes.svg`).
