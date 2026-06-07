# The Consonance Tree

An interactive visualizer for harmonic relations on the Stern–Brocot tree, companion to the paper *A Structure of Harmonic Relations*.

## What it does

Enter a musical sequence (as just-intonation ratios or note names) and apply transformations from the operator group G = F₂ ⋊ V₄:

- places each interval as a node on the **full Stern–Brocot tree** rooted at 1/1;
- draws the **trajectory** through the tree, with the lower half (intervals < 1) on the left and the upper half (intervals > 1) on the right;
- overlays the trajectory's **image under the chosen transformation** in a contrasting colour;
- marks the chord's **harmonic root** with a ring — solid when sounded, dashed when implied;
- displays the **harmonic frame** (the chord root's mediant-parents) above each panel;
- reports the **internal consonance** C_nn^(3) of each trajectory and the **cross-pair score** C̄(T, T′) between the original and its image;
- plays the **audio** of either trajectory at exact ratios, either melodically or as a chord;
- shows the **nearest 12-TET note** for each interval, with octave markers and cents-deviation badges, and the **prime limit**.

## Transformations

The operators are split into two families:

- **Anchor-shifting** (`L`, `R`, `U`): move the trajectory as a coherent shape by shifting its deepest common ancestor.
- **Pointwise** (`σ`, `rev`): act on each node's address independently. σ swaps L ↔ R (reflection across 1/1); rev reverses each address.

All preserve the relative depth profile. You can also compose a word (`σ L`, `R L`, `L L U`); tokens are applied left to right. Type `s` for σ in the word input.

## Presets

The opening of Beethoven's Symphony No. 5 (Op. 67), the four-consonance trajectory (3/2, 4/3, 5/3, 5/4), the just major triad, the just major scale, and a Pythagorean diatonic.

## Running it

A single static HTML file with no build step or dependencies. Open `index.html` in a browser, or serve it with GitHub Pages:

1. Push to a repository.
2. In **Settings → Pages**, set the source to the `main` branch, root folder.
3. The tool is live at `https://<username>.github.io/<repo>/`.

Audio uses the Web Audio API and starts on the first play (browsers require a user gesture before sound).

## License

MIT.
