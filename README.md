# Interactive Toys (Static Site)

A tiny collection of delightful web apps you can deploy on Netlify:

- Wheel of Fortune (`pages/wheel.html`)
- Virtual Bubble Wrap (`pages/bubble.html`)

No build step is required. Everything is plain HTML/CSS/JS with CDN styling.

## Run locally

From a terminal:

```bash
cd interactive-toys
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

- Wheel labels: open `pages/wheel.html` → edit the text area defaults or just type your own when using the app.
- Colors and fonts: tweak `styles.css` or use Tailwind utility classes in the HTML.
- Bubble grid defaults: adjust the sizing and density in `scripts/bubble.js` (`gridConfig`).

## Files

- `index.html` – landing page
- `pages/wheel.html` – wheel page UI
- `pages/bubble.html` – bubble wrap UI
- `scripts/wheel.js` – wheel logic
- `scripts/bubble.js` – bubble logic (sound generated with WebAudio)
- `styles.css` – shared styles (pointer, bubble visuals)

## License

MIT