# OpenHands

Local demo website for finding and offering essential community help (San Francisco seed data).

## Run locally

```bash
cd /Users/anubhavbhatia/Projects/OpenHands
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo accounts

Password for all: `demo1234`

- `donor@demo.openhands`
- `host@demo.openhands`
- `provider@demo.openhands`
- `admin@demo.openhands`

## Notes

- Works offline from seed data in the browser/server memory (demo mode).
- Find Help opens on an interactive **satellite map** with category icons. Tap a pin to draw walk/drive routes (OSRM) from your start point; switch layers for streets or labels.
- Assistant uses a local mock by default; optional Gradient AI env vars are in `.env.example`.
- Do not push or deploy unless you explicitly choose to.
