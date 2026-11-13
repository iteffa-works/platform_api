# API contours (outline)

## Platform — `/api/v1`

Для `web`. JWT. Без client-обмежень.

### Auth
- `POST /auth/register` — перший користувач = admin
- `POST /auth/login`
- `GET /auth/me`
- `GET /auth/captcha` — SVG-капча; `{ enabled: false }`, якщо `AUTH_CAPTCHA=false`

### Accounts (кабінет)
- `GET|POST|PATCH|DELETE /accounts`

### Admin
- `GET /admin/users`
- `PATCH /admin/users/:id` — `{ role: user|admin }`

## Client — `/api/client/v1`

Для `desktop` / скриптів. API key + rate limit.

- `GET /status`
- `GET /work/next`
- `POST /work/:id/result`
