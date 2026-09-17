# EMS frontend

The web client for the Employee Management System. React 19, Vite, Tailwind —
36 screens, around 23,500 lines.

The API it talks to lives in [ems-backend](https://github.com/Vishal-Singh-Thakur/ems-backend).

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle into dist/
npm run preview    # serve that bundle locally
npm run lint
```

The backend must be running, or every screen will show an empty state. See the
backend's README for how to start it.

## Configuration

One variable, in `.env`:

```
VITE_API_URL=http://localhost:8001/api
```

Port 8001 is the API gateway — the only backend process a browser is allowed to
reach. Pointing this at the service behind it (8002) will not work: that process
refuses any request that did not come through the gateway.

`.env` is not committed. Copy the line above into a new one after cloning.

## How it is laid out

```
src/
  WebView/        one file per screen — dashboard, attendance, leave, expenses,
                  assets, onboarding, offboarding, documents, reports, settings
  components/     shared pieces, grouped by area (Dashboards/, Roles/, …)
  Utils/          ApiHit (the fetch wrapper), roleUtils, menuUtils, theme
  Context/        auth and theme providers
  redux/          store, for the few pieces of cross-screen state
  Data/           static reference data, such as the holiday list
```

## Three things worth knowing before changing anything

### The server decides what a user may do, not this code

`hasPermission(user, 'expenses.pay')` hides a button. It does not protect
anything — the API checks the same permission and refuses regardless. Treat the
checks here as *presentation*: getting one wrong makes the interface confusing,
never insecure.

Where the answer depends on more than a permission — may this manager approve
*this* claim — the server sends the answer with the row (`canApprove`, `canPay`)
and the component renders from that. Re-deriving those rules here would mean two
copies that drift.

### Sessions renew themselves

Access tokens last fifteen minutes. `ApiHit` catches the resulting 401, refreshes
in the background, and retries the request once; the user sees nothing. It only
sends them to the login screen when the refresh itself fails.

One detail in there matters: several requests can hit a 401 at the same moment,
and refresh tokens rotate — so a second refresh would present a token the first
had already spent, which the server reads as a replay and ends the whole session.
`ApiHit` keeps one in-flight refresh and makes everyone wait on it. Anything that
fetches outside `ApiHit` loses that protection.

### Dark mode is class-based, and charts are outside it

Tailwind's `dark:` variants come from a class on `<html>`, set in `Utils/theme.js`.
Every colour needs both halves — `bg-white dark:bg-slate-800` — because a colour
defined once is right in one theme and invisible in the other.

Recharts draws SVG, and Tailwind classes do not reach inside it. Chart colours are
passed as props and picked to stay legible on both grounds. See
`components/Dashboards/EmployeeGrowthChart.jsx`.

## Adding a screen

1. Create the component in `src/WebView/`.
2. Add the API paths to `src/components/Constant/Api/Api.jsx`.
3. Add a route in `App.jsx`, wrapped in `ProtectedRoute` with the permission the
   API requires.
4. Add the sidebar entry in `src/Utils/menuUtils.jsx`.

Steps 3 and 4 both take a permission; they should be the same one, and it should
be the one the backend route checks. Three places, one answer.
