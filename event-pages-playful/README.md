# Andreas & Eleni — Playful wedding invitation

The third wedding-site direction: a warm-neutral, tactile invitation suite with a CSS-built 3D envelope, bilingual content, RSVP, schedule, FAQ, gallery, and local upload preview.

```bash
npm install
npm run dev
```

The development server uses `http://127.0.0.1:5175/`.

## Project structure

- `src/App.svelte` owns only the selected language and page composition.
- `src/lib/components/sections/` contains one component per page section. Stateful features own
  their state locally: the hero manages the countdown, RSVP manages its form, and the gallery
  manages playback and local uploads.
- `src/lib/actions/` and `src/lib/utils/` contain reusable behavior and focused domain helpers.
- `src/lib/wedding-config.js` contains non-translated event details; `wedding-data.js` contains the
  English and Greek copy.
- `src/styles/` loads in numbered cascade order, with responsive and reduced-motion overrides last.

## Validation

```bash
npm test
npm run build
```

RSVP submission and guest uploads are front-end previews. Connect them to a production service
before publishing if responses and media need to persist.
