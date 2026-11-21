# GoFare Ghana — Prototype v0.1

A mobile-first Progressive Web App prototype for comparing intercity transport fares by departure station.

## Current features
- Search a small set of sample origin/destination pairs.
- Compare example fares by station.
- Submit a sample fare report.
- Installable PWA shell and basic offline caching.

## Important limitations
- **Every fare in this prototype is fictional demonstration data.** Do not use it for real travel decisions.
- Fare reports are stored in the browser's local storage on the current device only. They are not uploaded, reviewed, or shared.
- There is no real database, user account, station operator account, admin dashboard, map integration, or live station data yet.
- The PWA needs to be served over HTTPS (or localhost) for service-worker installation. Opening `index.html` directly as a file will not enable installation/offline caching.

## Run locally
Use any local static web server, for example:
`python -m http.server 8000`
Then open `http://localhost:8000`.

## Deploy
This is a static site and can be deployed to a static hosting provider such as Cloudflare Pages or GitHub Pages. Connect the repository or upload the project files according to the provider's current instructions.

## Next development stage
Connect a hosted database and authentication, then build a protected admin workflow for station, route, fare, and report verification. Do not publish unverified community reports as official fares.
