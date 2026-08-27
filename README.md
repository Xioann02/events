# Wedding website collection

Four independent Svelte/Vite wedding invitations share the same bilingual content and feature set
while keeping separate visual systems.

| Version | Project | Local URL |
| --- | --- | --- |
| Classic | `event-pages/` | `http://127.0.0.1:5173/` |
| Modern | `event-pages-modern/` | `http://127.0.0.1:5174/` |
| Playful | `event-pages-playful/` | `http://127.0.0.1:5175/` |
| Luxury | `event-pages-luxury/` | `http://127.0.0.1:5176/` |

Each project is self-contained. Run commands from the version you want to work on:

```bash
npm install
npm run dev
npm test
npm run build
```

## Architecture standard

- `src/App.svelte` owns language selection and composes the page.
- `src/lib/components/sections/` contains focused page sections with local feature state.
- `src/lib/actions/` and `src/lib/utils/` contain reusable behavior and pure helpers.
- `src/lib/wedding-config.js` contains non-translated event configuration.
- `src/lib/wedding-data.js` contains English and Greek content.
- `src/styles/` contains ordered global style modules; responsive and reduced-motion overrides load
  last to preserve each design's cascade.
- `tests/` covers content parity and pure utilities with Node's built-in test runner.

RSVP submission and guest uploads are currently client-side previews in every version. Connect a
backend before deployment if responses or uploaded media need to persist.
