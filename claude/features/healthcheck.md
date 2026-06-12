# Healthcheck

Status: built. The end-to-end reference feature.

> As any user, I want the home page to show whether the API and its databases are
> reachable, so I immediately know if the system is operational.

**Behavior / rules:**

- The `/` page of each app greets its audience ("Hello Client" / "Hello Admin") and checks
  API health on load.
- While checking: a "Checking API health..." message is shown.
- On success: a status card shows overall status (`ok` / `degraded`), per-service state for
  PostgreSQL and Redis, and the server uptime.
- Status is `ok` only when **both** PostgreSQL and Redis respond; otherwise `degraded`
  (HTTP 503 from the API).
- If the API is unreachable: the page shows an error message instead of the card.
