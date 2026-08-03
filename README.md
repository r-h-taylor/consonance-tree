# The Consonance Tree

An interactive visualizer for harmonic relations on the Stern–Brocot tree, companion to the paper *A Structure of Harmonic Relations* (pending) by Richard Taylor.

## What it does

Enter a musical sequence (as just-intonation ratios or note names) and apply transformations from the operator monoid described in the paper:

- places each interval as a node on the **full Stern–Brocot tree** rooted at 1/1;
- draws the **trajectory** through the tree, with the lower half (intervals < 1) on the left and the upper half (intervals > 1) on the right;
- overlays the trajectory's **image under the chosen transformation** in a contrasting colour;
- marks the chord's **harmonic root** with a ring — solid when sounded, dashed when implied;
- displays the **harmonic frame** (the chord root's mediant-parents) above each panel;
- reports the **internal consonance** C_nn^(3) of each trajectory;
- lets you set a **reference pitch (tonic)** — any ratio or note name — re-rooting the whole picture so that pitch sits at 1/1;
- gives a **copyable ratio output** for each trajectory that loads straight back in as input;
- plays the **audio** of either trajectory at exact ratios, either melodically or as a chord;
- shows the **nearest 12-TET note** for each interval, with octave markers and cents-deviation badges, and the **prime limit**.

## Transformations

The operators are of three kinds, according to what they do to the trajectory's
**anchor** (the deepest common ancestor of its nodes):

- **Anchor-shifting** (`L`, `R`, `U`): move the trajectory as a rigid shape by moving the
  anchor to its left child, right child, or parent. `U` is *partial* — there is nothing
  above the root, so it has no effect once the anchor is `1/1`.
- **Anchor-preserving** (`σ`): swaps L ↔ R in every address, which at the value level is
  reciprocation `a/b → b/a`, a reflection of the whole tree about 1/1. The letter swap is a
  monoid automorphism, so the anchor maps to its mirror. It preserves `C_nn` and the prime
  limit exactly.
- **Anchor-destroying** (`rev`): reverses each address. Reversal is an *anti*-automorphism,
  turning a common prefix into a common suffix, so the image generally has an unrelated anchor.

Because `L` and `R` have no total inverse, these generate a monoid rather than a group: the
addresses form the free monoid on `{L, R}`, and ascent is its partial inverse. All the
operators preserve the relative depth profile, but only `σ` preserves consonance.

You can also compose a word (`σ L`, `R L`, `L L U`); tokens are applied left to right.
Type `s` for σ in the word input.

Alongside these operators there is a **transpose** — a reference-pitch shift that divides every ratio by a chosen pitch. Unlike the operators above, it leaves all interval content (and hence the consonance) unchanged, sliding the trajectory rigidly through the tree while re-rooting the harmonic frame. It is available in two places: as the input's **reference / tonic** (a global gauge, applied before the word, moving both panels together) and in the **Transformation** panel (applied to the image only, after the word).

## Presets

The opening of Beethoven's Symphony No. 5 (Op. 67), the four-consonance trajectory (3/2, 4/3, 5/3, 5/4), the just major triad, the just major scale, and a Pythagorean diatonic.

## Running it

A single static HTML file with no build step or dependencies. Open `index.html` in a browser, or serve it with GitHub Pages:

1. Push to a repository.
2. In **Settings → Pages**, set the source to the `main` branch, root folder.
3. The tool is live at `https://<username>.github.io/<repo>/`.

Audio uses the Web Audio API and starts on the first play (browsers require a user gesture before sound).

## Library & command line

The same engine ships as a small, dependency-free module (`consonance.js`) you can script from Node or the browser, plus a ready-made terminal tool (`cli.js`):

```bash
node cli.js "3/2 4/3 5/3 5/4" --transform "L L U"
```

The full API, the options (reference / transform / transpose), terminal setup, and the command-line reference are in [USAGE.md](USAGE.md).

## License

MIT.
