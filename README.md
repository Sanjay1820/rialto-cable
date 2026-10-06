# Rialto Cables

Static HTML, CSS and JavaScript website with an animated product homepage,
scroll bounce effects, pointer interactions and a draggable, rotating Earth.
The product, company and contact pages are included so homepage links work.

## Deploy on Vercel

1. Create a new Vercel project and import `Sanjay1820/rialto-cable`.
2. Use the `main` branch and repository root directory.
3. Framework preset: **Other**. No build or install command is required.
4. Output directory: **.** (the repository root).
5. Deploy. `vercel.json` already contains these settings.

Deployment configuration reference:
https://vercel.com/docs/project-configuration/vercel-json

## Preview locally

Open `index.html` in a browser, or serve this folder with any static web server.
The Earth texture is bundled so it also works when opening the HTML directly.
External fonts and icon stylesheets may require an internet connection.

The quotation form prepares an email inquiry in the visitor's email app.

## Assets

Earth texture source: the three.js example asset
`examples/textures/planets/earth_atmos_2048.jpg`, retrieved from
https://github.com/mrdoob/three.js/tree/dev/examples/textures/planets.
