# Motion Studies

The public catalogue hub for a series of authored works about cities, movement and the ways transport becomes visible as data.

This repository intentionally contains only the dependency-free hub for now. The shared runtime and future `@motionstudies` packages remain in Gleislicht until three real editions have proved the extraction boundary.

## Local preview

Serve the repository root with any static server, for example:

```sh
python3 -m http.server 4173
```

Then open <http://localhost:4173>.

## Publishing

Pushes to `main` deploy the static site to GitHub Pages through `.github/workflows/pages.yml`.
