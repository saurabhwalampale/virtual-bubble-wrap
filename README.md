# Virtual Bubble Wrap (Static Site)

A delightful single-page mini app you can deploy on Netlify:

- Virtual Bubble Wrap (`pages/bubble.html`)

No build step is required. Everything is plain HTML/CSS/JS with CDN styling.

## Run locally

From a terminal:

```bash
cd virtual-bubble-wrap
python3 -m http.server 5173
```

Then open `http://localhost:5173`.

## Deploy to Netlify

Option A: Drag-and-drop (quickest)
- Zip the `interactive-toys` folder or select it directly.
- Go to Netlify app → Deploys → Drag & Drop (`app.netlify.com/drop`).
- Drop the folder. Netlify will publish it as a static site.

Option B: Connect repository
- Create a GitHub repo and push this folder.
- In Netlify, “Add new site” → “Import an existing project”.
- Select the repo. Build command: `none` (empty). Publish directory: the root of this folder.

## Customize

- Colors and fonts: tweak `styles.css` or use Tailwind utility classes in the HTML.
- Bubble grid defaults: adjust sizing/density in `scripts/bubble.js` (`gridConfig`).
- Sound: toggle in the UI or tweak `playPop` in `scripts/bubble.js`.
- Counters and refill: see `scripts/bubble.js` for `updateCounters` and the refill logic.

## Files

- `index.html` – landing page
- `pages/bubble.html` – bubble wrap UI
- `scripts/bubble.js` – bubble logic (sound generated with WebAudio)
- `styles.css` – shared styles (pointer, bubble visuals)

## License

MIT