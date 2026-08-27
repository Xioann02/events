# ourmoments.io

A Svelte 5/Vite storefront and live invitation editor for the `ourmoments.io` concept.

## Included

- Six occasion-aware content presets: wedding, birthday, baby shower, engagement, graduation, and dinner party
- Four exact isolated builds of the existing Classic, Modern, Playful, and Luxury invitation sites
- Side-by-side live editing on desktop and edit/preview tabs on mobile
- Curated customer fields, repeatable schedule/FAQ items, and removable/restorable sections
- Persistent cart with editable configuration snapshots
- Honest “checkout coming soon” state until purchasing is implemented
- Keyboard-friendly dialogs, visible focus states, reduced-motion support, and responsive layouts

## Run locally

```bash
npm install
npm run dev
```

The app runs at `http://127.0.0.1:5177/` by default.

## Verify

```bash
npm test
npm run build
```

Direct editor previews can also be opened with query parameters, for example:

```text
http://127.0.0.1:5177/?editor=playful&occasion=birthday
```

## Template fidelity

The marketplace does not recreate or restyle the four original designs. Their production builds are served from `public/templates/` and isolated in same-origin preview frames. The editor changes only content and section visibility inside those frames, preserving the original markup, CSS, imagery, motion, and responsive layouts.

The source projects remain independent and are not modified by the marketplace:

- `event-pages/` → Classic
- `event-pages-modern/` → Modern
- `event-pages-playful/` → Playful
- `event-pages-luxury/` → Luxury
