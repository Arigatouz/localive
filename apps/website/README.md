# Localive Website

The official Localive documentation site, built with Astro + Starlight.

- **Landing page** at `/` — cyberpunk-themed dual-mode (dark/light) with animated inline SVG logo
- **Docs** at root level (no `/docs/` prefix) — covers concept guides, framework tutorials, plugin docs, CLI reference, and VS Code extension

## Tech stack

- Astro 6 + Starlight 0.40
- Custom Cyberpunk dual theme (`html[data-theme]` switching via `localStorage('starlight-theme')`)
- Animated logo via inline SVG (`src/components/CyberLogo.astro`) — SMIL animations + CSS glow

## Development

```bash
npx nx serve website     # dev server at localhost:4321
npx nx build website     # build to dist/
```

## Gotchas

- `<pre><code>` blocks with JS `import` syntax cause esbuild errors — use plain `<p>` or `<div>` for code on the landing page
- OG meta tags must be added via Starlight's `head` config in `astro.config.mjs`, not raw `<meta>` tags