# API contours (outline)

## Platform — `/api/v1`

For `web`. No client-scope limits. JWT (`Authorization: Bearer <token>`).

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET|POST|PATCH|DELETE /accounts`

## Client — `/api/client/v1`

For `desktop` / scripts. API key + rate limit. Local processing cycle.

- `GET /status`
- `GET /work/next` → `{ work }`
- `POST /work/:id/result` → `{ status: done|failed, data?, error? }`

Auth: `Authorization: Bearer <CLIENT_API_KEY>` or `X-Client-Key`.
