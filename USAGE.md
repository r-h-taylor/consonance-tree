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
| `options.K` | `number` | Neighbour depth for the internal consonance C_nn. Default `3`. |

### `analyzeBatch(sequences, options?)`

Maps `analyze` over an array of sequences, applying the same `options` to each.
Returns an array of result objects. This is the entry point for processing many
sequences at once.

### `parseWord(word)`

Parses a transformation word (string or array) into canonical operator tokens
(`["L","L","U"]`). Useful if you want to inspect or validate a word before
passing it in. Unknown tokens are ignored.

Lower-level building blocks are also exported for advanced use:
`fracToAddr`, `addrToFrac`, `applyWord`, `harmonicFrame`, `Cnn`, `fpm`,
`nearest12`, `primeLimit`, `cents`, `noteToRatio`, `reduce`, `gcd`.

---

## The result object

```js
{
  input: "3/2 4/3 5/3 5/4",   // echo of what you passed
  mode: "ratio",               // resolved mode (after auto-detection)
  transform: "L L U",          // canonical word, or null if none

  ratios: ["3/2", "4/3", "5/3", "5/4"],

  notes: [                     // one entry per pitch, in sequence order
    {
      ratio: [3, 2],           // [numerator, denominator], reduced
      ratioStr: "3/2",
      address: "RL",           // Stern–Brocot address ("ε" for 1/1)
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

  cnn: 0.9146,                 // internal consonance C_nn^(K)

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
| `U` | `u`, `up`, `↑`, `^`, `ascend` | Anchor-shift: ascend (anchor → parent) |
| `σ` | `s`, `sigma`, `reflect` | Pointwise: swap L↔R in every address (reflect across 1/1) |
| `rev` | `rev`, `v`, `reverse` | Pointwise: reverse each address |

The anchor-shifting operators (`L`, `R`, `U`) move the whole trajectory as a
coherent shape by relocating its deepest common ancestor. The pointwise
operators (`σ`, `rev`) act on each node's address independently. All preserve
the relative depth profile.

Examples: `"L"`, `"R L"`, `"L L U"`, `"s"`, `"rev"`, `"s L"`.

---

## Notes on conventions

- **No octave reduction.** Every pitch sits at its honest position in the full
  Stern–Brocot tree, so `2/1` and `1/2` are distinct nodes, not folded into
  `1/1`.
- **Note names** use 5-limit just intonation with **C as the 1/1 root**
  (`C`=1/1, `E`=5/4, `G`=3/2, and so on). Accidentals `#`/`♯` and `b`/`♭` are
  accepted.
- **Consonance.** `cnn` is the internal consonance C_nn^(K): for each neighbour
  distance `k` from 1 to `K`, it averages a bidirectional pair-consonance kernel
  over all pairs that far apart, then sums those means. Larger `K` includes more
  distant pairs.
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
