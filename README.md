# Boston → SC Move Plan

Personal move-tracking app. Syncs across devices via Firebase Firestore.

## Local development

```bash
npm install
npm run dev
```

Opens at http://localhost:5173

## Deployment to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → import the repo
3. Click Deploy (no config needed, Vercel auto-detects Vite)
4. Add the resulting URL to your phone home screen

## Files

- `src/MovePlan.jsx` — main app component
- `src/firebase.js` — Firebase config (already filled in)
- `src/main.jsx` — React entry point
- `index.html` — page shell with fonts and metadata

## Notes

- Firestore rules are currently open (anyone with the Firebase project URL can read/write). Fine for personal use. Add auth if ever made multi-user.
- Check-state is stored in `progress/main` as a single document with a `checks` map.
