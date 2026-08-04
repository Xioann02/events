# Andreas & Eleni — Luxury wedding invitation

The fourth wedding-site direction: a refined, tactile invitation suite with a CSS-built 3D envelope, bilingual content, RSVP, schedule, FAQ, gallery, and local upload preview.

```bash
npm install
npm run dev
```

The development server uses `http://127.0.0.1:5176/`.

## Project structure

- `src/App.svelte` owns only the selected language and page composition.
- `src/lib/components/sections/` contains one component per page section. Stateful features keep
  their own state: the hero owns the countdown, RSVP owns its form, and the gallery owns playback
  and local uploads.
- `src/lib/components/ui/` contains reusable interface primitives.
- `src/lib/actions/` and `src/lib/utils/` contain framework actions and focused domain helpers.
- `src/lib/wedding-config.js` contains non-translated event details; `wedding-data.js` contains the
  English and Greek copy.
- `src/styles/` is loaded in numbered cascade order. Shared foundations come first, section styles
  follow, and responsive/reduced-motion overrides remain last.

## Validation

```bash
npm test
npm run build
```

RSVP submission and guest uploads are front-end previews. Connect them to a production service
before publishing if responses and media need to persist.
