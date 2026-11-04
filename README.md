# AIResearcher · Ellie Epp research site

Static GitHub Pages site. It needs no build step and no Jekyll.

## Files
- `index.html` is the whole site. Edit text here.
- `assets/site.css` holds colors and layout: navy `#0C1B33`, cream `#F4EFE4`, mint `#3EE8C4`, lavender `#B8A6FF`.
- `assets/site.js` opens a collapsed section when a link points to it.
- `assets/thought-bg.js` is the active background, "Thought forming" (background dots - 2 motion).
- `assets/living-bg.js` is the alternative background, the dot network (background dots - 1 motion).
- `assets/img/prof_pic.jpg` is your headshot.

## Live site
**https://elizabethhannan.github.io/AIResearcher/**

GitHub Pages serves this repo from the `main` branch, root folder (Settings → Pages).

## Update later
```bash
git add .
git commit -m "Update site"
git push
```

## Background settings
- **Strength:** `--bg-alpha` in `assets/site.css`. Higher numbers are bolder.
- **Speed (Thought forming):** `--bg-speed`. The default is 0.55; 1 is the original speed.
- **Column position:** set by the canvas tag in `index.html`, `data-offset="-12"`, which places it 12 px left of your name in the sidebar.
- **Switch to the dot network:** follow the comment above the last `<script>` in `index.html`.

## Preview on your Mac before publishing
```bash
python3 -m http.server 8000
```
Then open http://localhost:8000.
