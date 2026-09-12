# RoadPilot Driver App (Demo)

This is a fully separate project. **Not a single line of the RoadPilot repo is
modified.** It's a web app rendered inside a phone frame in the browser, and it
sends real GET requests to the already-running RoadPilot backend
(`http://localhost:8787`). RoadPilot's `app.use(cors())` setting means this
can call the API directly from a different origin with no changes needed on
the RoadPilot side.

## Run order (on demo day)

1. Start RoadPilot as usual — at minimum these two need to be running for this
   app to be meaningful:
   - `3-backend.bat` (or `cd backend && npm run dev`) → `localhost:8787`
   - `5-simulation-engine.bat` (or `cd backend && npx tsx simulation/engine.ts`)
     → generates live truck movement
2. Double-click `run-driver-app.bat` in this folder (installs dependencies on
   first run, then starts the dev server). Or, from a terminal:
   ```
   npm install
   npm run dev
   ```
3. Open `http://localhost:5183` in a browser → the phone-frame screen appears.
4. On the login screen, pick a driver from the "Currently active in the
   simulation" list to see live data moving right away (for the dock-wait
   demo, it's cleanest to pick a driver who just started driving and watch
   them transition into dwelling — see "Known limitations" below for why).

The backend address can be changed with the `VITE_API_BASE` environment
variable (defaults to `http://localhost:8787`).

## Where each feature's data comes from

| Screen | Data source | Real data? |
|---|---|---|
| Driver login list | `/api/drivers/all`, `/api/drivers/available`, `/api/live/positions` | Real |
| Real-time HOS countdown | `hos_remaining` from `/api/live/positions` (computed live by the simulation engine) | Real |
| Cycle tracking (70h/120h) | `REMAINING_HOURS_CAN_7` / `REMAINING_HOURS_CAN_14` from `driver.json` | Real |
| Dock wait / detention | `/api/live/positions` (status), `/api/detention/summary` (real depart events), `/api/settings/thresholds` (2h/$75 config) | Real data + client-observed timestamp (see below) |
| New load offer simulation | Real load picked via `/api/legs/all` + `/api/whatif/:tripNumber` (the same risk engine the dashboard uses, a pure computation endpoint that writes nothing to the DB) | Real |
| My status toggle (driving/dock wait/resting) | None — app-local state only | **Local only, never sent to RoadPilot** |
| "Alert Dispatcher" button | None — shows a local toast only | **Local only, never sent to RoadPilot** |

## Known limitations (left in on purpose)

- **No separate 13h driving / 14h on-duty / 16h elapsed-window countdowns.**
  The current dataset has no basis for computing these three individually (e.g.
  no shift-start timestamp). Instead, this app shows the single `hos_remaining`
  value the simulation engine actually computes, plus the two real cycle
  balances. This was a deliberate choice not to fabricate numbers.
- **Dock arrival time has no lookup endpoint on the server**, so this app
  detects the moment status flips from `driving` to `dwelling` while polling
  and times from that moment. Leaving the app open from before arrival gives
  an accurate count; logging in to a truck that's already dwelling starts the
  count from 0. The depart event is genuinely recorded by
  `/api/detention/summary`, so once the wait ends, the estimate is
  automatically replaced by the server's real final dwell time / fee.
- **Drivers who aren't in AVAIL status have no real Cycle 2 (120h/14-day)
  data.** The only endpoint that returns it, `/api/drivers/available`, only
  returns AVAIL drivers. The UI honestly shows "No data" rather than guessing.
- This sandbox has no outbound network access, so `better-sqlite3`'s native
  module couldn't be installed and the RoadPilot backend couldn't be run
  end-to-end here. This app itself builds cleanly with `npm run build`, and
  every endpoint/field name was verified directly against the uploaded
  `server.ts` / `simulation/engine.ts` / `data/*.json` — but it's worth
  connecting it to a real running backend once to confirm.
"# polavis-driver-app-demo" 
